"use client";
import type { ThunderSDK } from "thunder-sdk";
import {
  IconArrowNarrowUp,
  IconArrowDownDashed,
  IconCalendar,
  IconCalendarCheck 
} from "@tabler/icons-react";
import React, { useState } from "react";
import type { ComponentType } from "react";
import type { DateRange } from "react-day-picker";
import { use } from "@/core/hooks/use";
import { getWalletLedgers } from "@/core/endpoints/wallet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateForInput } from "@/core/lib/utils";
import { useTranslation } from "react-i18next";
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater";

type TWalletLedger = typeof ThunderSDK.walletLedgers.type.get$return.results[number];

const TYPE_ICONS: Record<TWalletLedger["type"], ComponentType<{ className?: string }>> = {
  credit: IconArrowDownDashed,
  debit: IconArrowNarrowUp,
};

// مفاتيح ترجمة ثابتة — تُمرَّر لـ t() وقت العرض داخل الـ component، وليست نصًا نهائيًا
const TYPE_LABEL_KEYS: Record<TWalletLedger["type"], string> = {
  credit: "Received",
  debit: "Sent",
};

const TYPE_COLOR_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "text-success",
  debit: "text-destructive",
};

const TYPE_ICON_BG_CLASS: Record<TWalletLedger["type"], string> = {
  credit: "bg-success/15",
  debit: "bg-destructive/15",
};

// Unicode bidi isolate marks — تمنع المتصفح من قلب ترتيب الأرقام/الحروف
// اللاتينية لما تكون جوه container اتجاهه rtl (Arabic UI).
const LRI = "\u2066"; // Left-to-Right Isolate
const PDI = "\u2069"; // Pop Directional Isolate

// لو حابب تزيد عملات زيادة، زيدها هنا.
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


type FilterPreset = "1m" | "3m" | "6m" | "custom";

function getDateFrom(preset: FilterPreset): Date | undefined {
  const now = new Date();
  switch (preset) {
    case "1m": return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3m": return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6m": return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    default: return undefined;
  }
}

function buildQuery(preset: FilterPreset, customRange: DateRange | undefined) {
  const query: Record<string, unknown> = { sort: { createdAt: -1 } };

  let from: Date | undefined;
  let to: Date | undefined;

  if (preset === "custom" && customRange) {
    from = customRange.from;
    to = customRange.to;
  } else if (preset !== "custom") {
    from = getDateFrom(preset);
    to = new Date();
  }

  if (from || to) {
    const createdAt: Record<string, unknown> = {};
    if (from) createdAt.$gte = { type: "date", value: from.toISOString() };
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      createdAt.$lte = { type: "date", value: endOfDay.toISOString() };
    }
    query.filters = { createdAt };
  }

  return query;
}

export function TransactionHistory() {
  const { t, i18n } = useTranslation();
  const [preset, setPreset] = useState<FilterPreset>("1m");
  const [range, setRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const query = React.useMemo(() => buildQuery(preset, range), [preset, range]);
  const ledgerRequest = React.useMemo(() => getWalletLedgers(query), [query]);
  const { data, isLoading } = use(ledgerRequest);
  const transactions = (data?.results as TWalletLedger[] ?? []);

  const presets: { key: FilterPreset; label: string }[] = [
    { key: "1m", label: t("This Month") },
    { key: "3m", label: t("3 Months") },
    { key: "6m", label: t("6 Months") },
    { key: "custom", label: t("Custom") },
  ];

  const handlePreset = (key: FilterPreset) => {
    setPreset(key);
    if (key !== "custom") { setRange(undefined); setCalendarOpen(false); }
    else setCalendarOpen(true);
  };

  const rangeLabel = range?.from
    ? `${range.from.toLocaleDateString()}${range.to ? ` – ${range.to.toLocaleDateString()}` : ""}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("Transactions")}</h3>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {presets.map(({ key, label }) => (
          key === "custom" ? (
            <Popover key={key} open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handlePreset("custom")}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      preset === "custom"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <IconCalendar className="h-3.5 w-3.5" />
                    {rangeLabel ?? label}
                  </button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => { setRange(r); if (r?.from && r?.to) setCalendarOpen(false); }}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => handlePreset(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                preset === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          )
        ))}
      </div>

      {/* Transaction list */}
      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRepeater key={i} />
          ))}
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("No transactions to display")}
          </p>
        </div>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
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