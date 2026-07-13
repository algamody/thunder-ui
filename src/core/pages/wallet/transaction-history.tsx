"use client";
import type { ThunderSDK } from "thunder-sdk";
import {
  IconArrowNarrowUp,
  IconArrowDownDashed,
  // IconRepeat,
  // IconCreditCardPay,
} from "@tabler/icons-react";
import React from "react";
import type { ComponentType } from "react";
import { use } from "@/core/hooks/use";
import { getWalletLedgers } from "@/core/endpoints/wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateForInput } from "@/core/lib/utils";
import { useTranslation } from "react-i18next";

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
  return `${sign}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency.toUpperCase()}`;
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function TransactionHistory() {
  const ledgerRequest = React.useMemo(
    () => getWalletLedgers({ sort: { createdAt: -1 }}),
    []
  );

  const { data, isLoading } = use(ledgerRequest);
  const { t } = useTranslation()
  const transactions = (data?.results as TWalletLedger[] ?? []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t("Transactions")}</h3>
      </div>

      {isLoading && (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <TransactionSkeleton key={i} />
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
