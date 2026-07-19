"use client";

import { IconArrowDownDashed , IconArrowNarrowUp , IconCreditCardPay , IconQrcode ,
  // IconRepeat 
 } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { SPRING_PRESS } from "@/lib/ease";

type WalletAction = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
};

/**
 * Row of primary wallet actions rendered icon-over-label, with a spring press.
 */
export function WalletActions({
  onReceive,
  onSend,
  onDeposit,
  // onSwap,
  onBuy,
}: {
  onReceive?: () => void;
  onSend?: () => void;
  onDeposit?: () => void;
  // onSwap?: () => void;
  onBuy?: () => void;
}) {
  const reduce = useReducedMotion();
  const { t } = useTranslation();

  const actions: WalletAction[] = [
    { key: "receive", label: t("Receive"), icon: IconQrcode, onClick: onReceive },
    { key: "send", label: t("Send"), icon: IconArrowNarrowUp, onClick: onSend },
    { key: "deposit", label: t("Deposit"), icon: IconArrowDownDashed, onClick: onDeposit },
    // { key: "swap", label: t("Swap"), icon: IconRepeat, onClick: onSwap },
    { key: "buy", label: t("Buy"), icon: IconCreditCardPay, onClick: onBuy },
  ];

  return (
    <div className="flex items-start justify-between gap-2">
      {actions.map(({ key, label, icon: Icon, onClick }) => (
        <motion.button
          key={key}
          type="button"
          onClick={onClick}
          whileTap={reduce ? undefined : { scale: 0.94 }}
          transition={SPRING_PRESS}
          className="flex flex-1 flex-col items-center gap-2 outline-none"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}