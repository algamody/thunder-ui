"use client";
import type { ThunderSDK } from "thunder-sdk";
import {
  IconArrowNarrowUp,
  IconArrowDownDashed,
  IconCalendar 
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

const TYPE_LABELS: Record<TWalletLedger["type"], string> = {
  credit: "Received",
  debit: "Sent",
};

function formatAmount(amount: number, type: TWalletLedger["type"], currency: string) {
  const sign = type === "credit" ? "+" : "-";
  return `${sign}${(amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency.toUpperCase()}`;
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
  const { t } = useTranslation();
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
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("Transactions")}</h3>
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
            const description = typeof tx.description === "string"
              ? tx.description
              : tx.purpose ?? tx.reference;

            return (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {TYPE_LABELS[txType]}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-medium ${txType === "credit" ? "text-green" : "text-foreground"}`}
                  >
                    {formatAmount(tx.amount, txType, tx.currency)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-success">✓</span>
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
