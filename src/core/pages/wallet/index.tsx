"use client";
// beui.dev/components/blocks/wallet-card

import {IconEye , IconEyeOff } from "@tabler/icons-react";
import React, { useState } from "react";
import { ActionSwapText } from "./action-swap.tsx";
// import { CurrencySwitcher } from "./currency-switcher";
 import { WalletActions } from "./actions.tsx";
import { TransactionHistory } from "./transaction-history.tsx";
import { BalanceDelta } from "./balance-delta.tsx";
import { SendForm } from "./forms/transfer-form.tsx";
import { ReceiveForm } from "./forms/receive-form.tsx";
import { Refresher } from "@/components/refresher";
import { Container } from "@/core/custom/Container";
import { use } from "@/core/hooks/use";
import { getWallets } from "@/core/endpoints/wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next"
import { ThunderSDK } from "thunder-sdk";

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

// يرجع الرقم بس (مع الإشارة والفواصل) معزول كـ LTR — بدون العملة، عشان
// حروف العملة العربية ما تنعكسش لو انحطت جوه نفس الـ isolate block.
function formatNumberOnly(amount: number) {
  const numberStr = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${LRI}${numberStr}${PDI}`;
}

/**
 * Composed wallet overview card: a currency switcher whose trigger morphs open
 * into a full-width panel, a search icon that morphs into a search bar, a
 * rolling balance with a transient change indicator, and Send / Deposit
 * actions. Actions and search are plain callbacks — the resulting flow is left
 * to the consumer.
 */
export function Wallet() {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [isMounting, setIsMounting] = React.useState(true);
  const { t, i18n } = useTranslation()
  const walletRequest = React.useMemo(() => getWallets(), []);
  const { data: walletData, isLoading, refetch } = use(walletRequest);

  const wallet = (walletData?.results ?? [])[0] as
    | { balance: number; previousBalance: number; currency: string }
    | undefined;

  const balance = (wallet?.balance ?? 0) / 100;
  const previousBalance = (wallet?.previousBalance ?? 0) / 100;
  const defaultChange = balance - previousBalance;

  const currencyLabel = getCurrencyLabel(wallet?.currency ?? "LYD", i18n.language);
  const shownAmount = formatNumberOnly(balance);
  const maskedBalance = "*".repeat(5);
  const amountClassName = cn(
    "text-3xl font-semibold",
    !isMounting && !balanceHidden && balance < 0
      ? "text-red-600 dark:text-red-400"
      : "text-foreground",
  );


React.useEffect(() => {
  const timer = setTimeout(() => setIsMounting(false), 50); 
  return () => clearTimeout(timer);
}, []);

  function onReceive(): void {
    setReceiveOpen(true);
  }

  function onSend(): void {
    setSendOpen(true);
  }

  function onDeposit(): void {
    throw new Error("Function not implemented.");
  }
  // function onSwap(): void {
  //   throw new Error("Function not implemented.");
  // }
  // function onBuy(): void {
  //   throw new Error("Function not implemented.");
  // }

  return (
    <Refresher onRefresh={async () => { await refetch(); }}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
        <Container className="relative flex w-full flex-col gap-3">
          {/* relative anchor so the switcher + search panels span the whole row */}
          <div className="relative flex items-center justify-between gap-2">
            {/* <CurrencySwitcher
              currencies={currencies}
              activeCurrency={activeCurrency}
              onSelect={handleCurrencyChange}
            /> */}
          </div>

          <div className="mt-8 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">{t("Balance")}</p>
              <button
                type="button"
                onClick={() => setBalanceHidden((h) => !h)}
                aria-label={balanceHidden ? "Show balance" : "Hide balance"}
                aria-pressed={balanceHidden}
                className="text-muted-foreground outline-none transition-colors hover:text-foreground"
              >
                {balanceHidden ? (
                  <IconEyeOff className="h-3.5 w-3.5" />
                ) : (
                  <IconEye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {isLoading ? (
              <Skeleton className="mt-1 h-9 w-40" />
            ) : (
              <div className="flex items-baseline justify-center gap-1.5">
                {/*
                  العملة (نص عربي عادي زي "د.ل") لازم تفضل برّا الـ dir="ltr"
                  container، لأن أي نص عربي جوه إجبار LTR + split حرف-حرف
                  (أنيميشن cascade) ينعكس ترتيب حروفه. فصلناها كعنصر مستقل
                  يورث اتجاه الصفحة الطبيعي، وحطينا بس الرقم جوه الـ isolate.
                */}
                {i18n.language?.startsWith("ar") ? (
                  <>
                    <div dir="ltr" style={{ unicodeBidi: "isolate" }}>
                      <ActionSwapText
                        value={isMounting ? "" : (balanceHidden ? "hidden" : shownAmount)}
                        animation="cascade"
                        className={amountClassName}
                      >
                        {isMounting || balanceHidden ? maskedBalance : shownAmount}
                      </ActionSwapText>
                    </div>
                    {!isMounting && !balanceHidden && (
                      <span className={amountClassName}>{currencyLabel}</span>
                    )}
                  </>
                ) : (
                  <>
                    {!isMounting && !balanceHidden && (
                      <span className={amountClassName}>{currencyLabel}</span>
                    )}
                    <div dir="ltr" style={{ unicodeBidi: "isolate" }}>
                      <ActionSwapText
                        value={isMounting ? "" : (balanceHidden ? "hidden" : shownAmount)}
                        animation="cascade"
                        className={amountClassName}
                      >
                        {isMounting || balanceHidden ? maskedBalance : shownAmount}
                      </ActionSwapText>
                    </div>
                  </>
                )}
              </div>
            )}

            {balanceHidden ? (
              <div className="mt-2 flex h-7 items-center justify-center">
                <span className="translate-y-0.75 text-sm font-semibold text-muted-foreground leading-none tracking-[0.3em]">
                
                </span>
              </div>
            ) : isLoading ? (
              <div className="mt-2 flex h-7 items-center justify-center">
                <Skeleton className="h-5 w-24" />
              </div>
            ) : (
              <BalanceDelta balance={balance} initialChange={defaultChange !== 0 ? defaultChange : undefined} />
            )}
          </div>
          
          {ThunderSDK.isPermitted(ThunderSDK.wallets.transfer) && (
            <div className="mt-8">
              <WalletActions
                onReceive={onReceive}
                onSend={onSend}
                onDeposit={onDeposit}
                // onSwap={onSwap}
                // onBuy={onBuy}
              />
            </div>  
          )}

          <div className="mt-6">
            <TransactionHistory />
          </div>
        </Container>

        {/* Send money drawer */}
        <SendForm open={sendOpen} onOpenChange={setSendOpen} />

        {/* Receive money drawer */}
        <ReceiveForm
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
          currency={wallet?.currency?.toUpperCase()}
        />
      </div>
    </Refresher>
  );
}