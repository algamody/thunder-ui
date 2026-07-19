"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Clipboard } from "@capacitor/clipboard";
import { Keyboard } from "@capacitor/keyboard";
import { Share } from "@capacitor/share";
import { IconCheck, IconCopy, IconShare2 } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";

type TReceiveForm = { amount: string };

/** How long a generated code stays scannable before the sender must ask for a new one. */
const QR_EXPIRY_SECONDS = 90;

/**
 * `wallets.ts` only exposes metadata/signTransfer/transfer/count/get today —
 * there's no "create receive request" endpoint yet. This payload (and its
 * requestId) is generated client-side as a placeholder. Once the backend adds
 * one — ideally mirroring signTransfer's sign step, returning its own
 * requestId + amount + expiry — replace `onSubmit` below with that call and
 * drop the client-generated id, since a client-signed amount can't be trusted
 * to actually move money.
 */
type ReceiveQrPayload = { requestId: string; amount: number; currency: string };

export function ReceiveForm({
  open,
  onOpenChange,
  currency = "LYD",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"input" | "qr">("input");
  const [payload, setPayload] = useState<ReceiveQrPayload | null>(null);
  const [kbHeight, setKbHeight] = useState(0);

  useEffect(() => {
    let showListener: any;
    let hideListener: any;

    const setupKeyboard = async () => {
      try {
        showListener = await Keyboard.addListener("keyboardWillShow", (info) => {
          setKbHeight(info.keyboardHeight);
        });
        hideListener = await Keyboard.addListener("keyboardWillHide", () => {
          setKbHeight(0);
        });
      } catch (e) {
        // Ignore if plugin not available on web
      }
    };

    setupKeyboard();

    return () => {
      if (showListener) showListener.remove();
      if (hideListener) hideListener.remove();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TReceiveForm>();

  const close = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("input");
      setPayload(null);
      reset();
    }, 300);
  };

  const onSubmit = (vals: TReceiveForm) => {
    setPayload({ requestId: uuidv4(), amount: Number(vals.amount) * 100, currency });
    setStep("qr");
  };

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent
        className="mx-auto w-full max-w-md p-4 transition-[padding] duration-300 ease-out"
        style={{ paddingBottom: kbHeight > 0 ? `calc(1rem + ${kbHeight}px)` : undefined }}
      >
        <DrawerHeader className="px-0 pt-0">
          <DrawerTitle>{t("Request Money")}</DrawerTitle>
        </DrawerHeader>

        {step === "input" && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{t("Amount")}</FieldLabel>
                <Input
                  type="number"
                  placeholder="0"
                  {...register("amount", { required: true, min: 1 })}
                />
                {errors.amount && <FieldError>{t("Invalid amount")}</FieldError>}
              </Field>
            </FieldGroup>
            <Button type="submit" className="mt-2">
              {t("Generate QR Code")}
            </Button>
          </form>
        )}

        {step === "qr" && payload && (
          <QrPreview
            payload={payload}
            onRequestNewCode={() => setStep("input")}
            onDone={close}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function QrPreview({
  payload,
  onRequestNewCode,
  onDone,
}: {
  payload: ReceiveQrPayload;
  onRequestNewCode: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [copied, setCopied] = useState(false);
  const encodedPayload = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    setSecondsLeft(QR_EXPIRY_SECONDS);
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [payload.requestId]);

  const expired = secondsLeft === 0;
  const formattedAmount = (payload.amount / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleCopy = useCallback(async () => {
    await Clipboard.write({ string: encodedPayload });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [encodedPayload]);

  const handleShare = useCallback(async () => {
    await Share.share({ title: t("Payment request"), text: encodedPayload });
  }, [encodedPayload, t]);

  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <p className="text-sm text-muted-foreground">
        {t("Anyone who scans this code sends")} {formattedAmount} {payload.currency}{" "}
        {t("to your wallet.")}
      </p>

      <div className="relative flex items-center justify-center rounded-3xl border border-border bg-card p-5">
        <QRCodeSVG value={encodedPayload} size={220} className={expired ? "opacity-20" : undefined} />
        {expired && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="sm" variant="secondary" onClick={onRequestNewCode}>
              {t("Generate a new code")}
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {expired ? t("This code has expired") : `${t("Expires in")} ${secondsLeft}s`}
      </p>

      <div className="grid w-full grid-cols-2 gap-2">
        <Button variant="outline" disabled={expired} onClick={handleShare}>
          <IconShare2 />
          {t("Share")}
        </Button>
        <Button variant="outline" disabled={expired} onClick={handleCopy}>
          {copied ? <IconCheck /> : <IconCopy />}
          {copied ? t("Copied") : t("Copy code")}
        </Button>
      </div>

      <Button className="w-full mt-2" onClick={onDone}>
        {t("Done")}
      </Button>
    </div>
  );
}