"use client";
import React, { useEffect, useMemo } from "react";
import type { ComponentType } from "react";
import { ThunderSDK } from "thunder-sdk";
import type { ThunderSDK as TSDKType } from "thunder-sdk";
import {
  IconArrowDownDashed,
  IconArrowNarrowUp,
  IconCalendar,
} from "@tabler/icons-react";
import { use } from "@/core/hooks/use";
import { getWalletLedgers } from "@/core/endpoints/wallet";
import { formatDateForInput } from "@/core/lib/utils";
import { useTranslation } from "react-i18next";
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater";
import { Filters, type TFilterValue } from "@/core/crud/filters";
import { fieldsFromModuleMetadata } from "@/core/crud/FormPage";
import { JSONSchemaToFields, type TField } from "@/core/lib/jsonSchemaToFields";
import { CopyButton } from "@/components/ui/copy-button";
import { filterToMongo } from "@/core/crud/filters/lib/filterToMongo";

type TWalletLedger =
  typeof TSDKType.walletLedgers.type.get$return.results[number];

const TYPE_ICONS: Record<
  TWalletLedger["type"],
  ComponentType<{ className?: string }>
> = {
  credit: IconArrowDownDashed,
  debit: IconArrowNarrowUp,
};

const TYPE_LABEL_KEYS: Record<TWalletLedger["type"], string> = {
  credit: "Credit",
  debit: "Debit",
};

const TYPE_COLOR_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "text-success",
  debit: "text-destructive",
};

const TYPE_ICON_BG_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "bg-success/15",
  debit: "bg-destructive/15",
};

const LRI = "\u2066";
const PDI = "\u2069";

const CURRENCY_LABELS_AR: Record<string, string> = {
  LYD: "د.ل",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function getCurrencyLabel(currency: string, lang: string) {
  const code = currency.toUpperCase();
  if (lang?.startsWith("ar")) {
    return CURRENCY_LABELS_AR[code] ?? code;
  }
  return code;
}

function formatAmount(amount: number, currency: string, lang: string) {
  const label = getCurrencyLabel(currency, lang);
  const numberStr = (Math.abs(amount) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${LRI}${numberStr} ${label}${PDI}`;
}

export function TransactionHistory({
  fields: propFields,
}: {
  fields?: TField[];
}) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = React.useState<TFilterValue>();
  const [fields, setFields] = React.useState<TField[]>([]);

  const metadata = useMemo(
    () => ThunderSDK.getMetadata("walletLedgers"),
    [],
  );

  useEffect(() => {
    if (propFields && propFields.length > 0) return;

    let isMounted = true;
    void (async () => {
      try {
        const results = await fieldsFromModuleMetadata(metadata, {
          type: "output",
          resolveRef: false,
        });
        if (!isMounted) return;
        setFields(JSONSchemaToFields.flatten(results, { excludeArray: true }));
      } catch (err) {
        console.error("Failed to load metadata fields for walletLedgers:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [metadata, propFields]);

  const activeFields = propFields && propFields.length > 0 ? propFields : fields;
  const outboundFilters = React.useMemo(() => {
    const nextFilters = { ...(filters ?? {}) };

    for (const [key, filter] of Object.entries(nextFilters)) {
      const field = activeFields.find((item) => item.name === key);


      if (field?.enum && filter.operator === "$all") {
        nextFilters[key] = {
          ...filter,
          operator: "$in",
        };
      }


      if (key === "amount" && filter?.value !== undefined && filter?.value !== null) {
        const rawVal = filter.value;
        const cents = Math.abs(rawVal) * 100;
        nextFilters[key] = {
          operator: "$in",
          value: [cents, -cents],
        };
      }
    }

    return nextFilters;
  }, [activeFields, filters]);


  const query = useMemo(() => {
    const mongoFilters = filterToMongo(outboundFilters);
    const hasFilters = Object.keys(mongoFilters).length > 0;
    return {
      sort: { createdAt: -1 },
      ...(hasFilters ? { filters: mongoFilters } : {}),
    };
  }, [outboundFilters]);

  const ledgerRequest = useMemo(() => getWalletLedgers(query), [query]);
  const { data, isLoading } = use(ledgerRequest);

  const transactions = ((data as { results?: TWalletLedger[] })?.results) ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Dynamic Filters Bar */}
      <div className="flex items-center gap-2">
        <Filters
          fields={activeFields}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <h3 className="text-sm font-semibold text-foreground shrink-0">
          {t("Transactions")}
        </h3>
      </div>

      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRepeater key={i} />
          ))}
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="py-6 text-center animate-in fade-in duration-200">
          <p className="text-sm text-muted-foreground">
            {t("No transactions to display")}
          </p>
        </div>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card transform-gpu will-change-transform animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-both">
          {transactions.map((tx) => {
            const txType: TWalletLedger["type"] =
              tx.type === "credit" ? "credit" : "debit";
            const Icon = TYPE_ICONS[txType];
            let description =
              typeof tx.description === "string"
                ? tx.description
                : tx.purpose ?? tx.reference;

            if (tx.purpose === "wallet_transfer" && txType === "debit") {
              const target =
                (tx as any).oppositeTenant?.name ||
                (tx as any).oppositeWallet ||
                t("Wallet");
              description = t("Transfer to {{target}}", { target });
            }

            return (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_BG_CLASS[txType]
                    } ${TYPE_COLOR_CLASS[txType]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {t(TYPE_LABEL_KEYS[txType])}
                  </span>

                  <span className="text-xs text-muted-foreground font-mono">
                    {tx.reference}
                  <CopyButton value={tx.reference} />
                  </span>
                
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>

                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-medium ${TYPE_COLOR_CLASS[txType]
                      }`}
                  >
                    {formatAmount(tx.amount, tx.currency, i18n.language)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconCalendar className="size-3.5" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateForInput(
                        tx.createdAt as TWalletLedger["createdAt"],
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}