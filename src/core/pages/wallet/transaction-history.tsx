"use client";
import { useState, useMemo, useEffect } from "react";
import type { ComponentType } from "react";
import { ThunderSDK } from "thunder-sdk";
import type { ThunderSDK as TSDKType } from "thunder-sdk";
import {
  IconArrowNarrowUp,
  IconArrowDownDashed,
  IconCalendarCheck,
} from "@tabler/icons-react";
import { use } from "@/core/hooks/use";
import { getWalletLedgers } from "@/core/endpoints/wallet";
import { formatDateForInput } from "@/core/lib/utils";
import { useTranslation } from "react-i18next";
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater";
import { Filters, type TFilterValue } from "@/core/crud/filters";
import { fieldsFromModuleMetadata } from "@/core/crud/FormPage";
import { JSONSchemaToFields, type TField } from "@/core/lib/jsonSchemaToFields";

type TWalletLedger = typeof TSDKType.walletLedgers.type.get$return.results[number];

const TYPE_ICONS: Record<TWalletLedger["type"], ComponentType<{ className?: string }>> = {
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

function parseFilterToBackendQuery(filters?: TFilterValue) {
  if (!filters || !Object.keys(filters).length) return undefined;
  const parsed: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, filter]) => {
    if (!filter) return;

    // Safely extract raw value whether filter is { value: ... } or direct primitive
    const rawValue = (typeof filter === "object" && filter !== null && "value" in filter)
      ? (filter as any).value
      : filter;

    if (rawValue === undefined || rawValue === null || rawValue === "") return;

    // 1. Type Filter
    if (key === "type") {
      const arr = Array.isArray(rawValue) ? rawValue : [rawValue];
      if (arr.length) parsed[key] = { $in: arr.map((v) => ({ type: "string", value: String(v) })) };
      return;
    }

    // 2. Amount Filter (Handles Single Integer/Decimal & Arrays -> Cents + Credit & Debit Match)
    if (key === "amount") {
      const nums = (Array.isArray(rawValue) ? rawValue : [rawValue])
        .map(Number)
        .filter((n) => !isNaN(n));

      if (nums.length === 1) {
        const base = Math.abs(nums[0]);
        const minCents = Math.round(base * 100);
        const maxCents = Number.isInteger(base) ? minCents + 99 : minCents;

        parsed.$or = [
          {
            amount: {
              $gte: { type: "number", value: String(minCents) },
              $lte: { type: "number", value: String(maxCents) },
            },
          },
          {
            amount: {
              $gte: { type: "number", value: String(-maxCents) },
              $lte: { type: "number", value: String(-minCents) },
            },
          },
        ];
      } else if (nums.length >= 2) {
        const [a, b] = [Math.abs(nums[0]), Math.abs(nums[1])];
        const minCents = Math.round(Math.min(a, b) * 100);
        const maxCents = Math.round(Math.max(a, b) * 100) + 99;

        parsed.$or = [
          {
            amount: {
              $gte: { type: "number", value: String(minCents) },
              $lte: { type: "number", value: String(maxCents) },
            },
          },
          {
            amount: {
              $gte: { type: "number", value: String(-maxCents) },
              $lte: { type: "number", value: String(-minCents) },
            },
          },
        ];
      }
      return;
    }

    // 3. Reference & Description Dual Match (e.g., "ORD287")
    if (key === "reference") {
      const refVal = String(rawValue).trim();
      if (refVal) {
        const regexVal = { type: "string", value: refVal };
        const existingOr = Array.isArray(parsed.$or) ? parsed.$or : [];

        parsed.$or = [
          ...existingOr,
          { reference: { $regex: regexVal, $options: "i" } },
          { description: { $regex: regexVal, $options: "i" } },
          { purpose: { $regex: regexVal, $options: "i" } },
        ];
      }
      return;
    }

    // 4. Date Filters (createdAt / updatedAt)
    if ((key === "createdAt" || key === "updatedAt") && Array.isArray(rawValue) && rawValue.length) {
      const dateQ: Record<string, unknown> = {};
      if (rawValue[0]) dateQ.$gte = { type: "date", value: new Date(rawValue[0]).toISOString() };
      const toDate = rawValue[1] ? new Date(rawValue[1]) : rawValue[0] ? new Date(rawValue[0]) : null;
      if (toDate) {
        toDate.setHours(23, 59, 59, 999);
        dateQ.$lte = { type: "date", value: toDate.toISOString() };
      }
      parsed[key] = dateQ;
      return;
    }

    // Default Fallback
    parsed[key] = {
      $eq: {
        type: typeof rawValue === "number" ? "number" : "string",
        value: String(rawValue),
      },
    };
  });

  return Object.keys(parsed).length ? parsed : undefined;
}

export function TransactionHistory({ fields: propFields }: { fields?: TField[] }) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<TFilterValue>();
  const [internalFields, setInternalFields] = useState<TField[]>([]);

  // Metadata for walletLedgers / wallet module
  const metadata = useMemo(
    () => ThunderSDK.getMetadata("walletLedgers"),
    []
  );

  // Load fields dynamically from module metadata if propFields is not provided
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
        setInternalFields(JSONSchemaToFields.flatten(results, { excludeArray: true }));
      } catch (err) {
        console.error("Failed to load metadata fields for walletLedgers:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [metadata, propFields]);

  const activeFields = propFields && propFields.length > 0 ? propFields : internalFields;

  // Request Query Generation using custom parser
  const requestQuery = useMemo(() => {
    const backendFilters = parseFilterToBackendQuery(filters);

    return {
      ...(backendFilters ? { filters: backendFilters } : {}),
      sort: { createdAt: -1 },
    };
  }, [filters]);

  const ledgerRequest = useMemo(() => getWalletLedgers(requestQuery), [requestQuery]);
  const { data, isLoading } = use(ledgerRequest);

  const transactions = ((data as { results?: TWalletLedger[] })?.results) ?? [];

  return (
    <div className="flex flex-col gap-2.5">
      {/* Standard Filters Component */}
      <div className="flex items-center gap-2">
        <Filters fields={activeFields} filters={filters} onChange={setFilters} />
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

      {/* 🟢 Transition.dev Bottom-to-Top Animation */}
      {!isLoading && transactions.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card transform-gpu will-change-transform animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out fill-mode-both">
          {transactions.map((tx) => {
            const txType: TWalletLedger["type"] = tx.type === "credit" ? "credit" : "debit";
            const Icon = TYPE_ICONS[txType];
            let description = typeof tx.description === "string"
              ? tx.description
              : tx.purpose ?? tx.reference;

            if (tx.purpose === "wallet_transfer" && txType === "debit") {
              const target = (tx as any).oppositeTenant?.name || (tx as any).oppositeWallet || t("Wallet");
              description = t("Transfer to {{target}}", { target });
            }

            return (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_BG_CLASS[txType]} ${TYPE_COLOR_CLASS[txType]}`}>
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {t(TYPE_LABEL_KEYS[txType])}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span className={`text-sm font-medium ${TYPE_COLOR_CLASS[txType]}`}>
                    {formatAmount(tx.amount, tx.currency, i18n.language)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <IconCalendarCheck className="size-3.5 text-success" />
                    <span className="text-xs text-muted-foreground">
                      {formatDateForInput(tx.createdAt as TWalletLedger["createdAt"])}
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