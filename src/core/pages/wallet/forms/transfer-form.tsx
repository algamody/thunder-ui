"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ThunderSDK } from "thunder-sdk";
import { IconCheck, IconCopy, IconArrowNarrowUp } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getInitials } from "@/core/lib/utils";

type TSendForm = { receiver: string; amount: string; description: string };
export function SendForm({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"input" | "review" | "success">("input");
  const [signData, setSignData] = useState<any>(null);
  const [ref, setRef] = useState<string>("");
  const [error, setError] = useState("");



  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TSendForm>();

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setStep("input"); setSignData(null); setRef(""); setError(""); reset(); }, 300);
  };

  const onSubmit = async (vals: TSendForm) => {
    setError("");
    try {
      const res = await ThunderSDK.wallets.signTransfer({
        query: { receiver: vals.receiver, amount: Number(vals.amount) * 100, description: vals.description || undefined },
      });
      setSignData(res);
      setStep("review");
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to sign transfer");
    }
  };

  const confirm = async () => {
    setError("");
    try {
      const res = await ThunderSDK.wallets.transfer({ body: { token: signData.challenge.token } });
      setRef(res.transaction.reference);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
      toast.error("Transfer failed");
    }
  };

  return (
    <Drawer open={open} onOpenChange={close}>
      <DrawerContent className="mx-auto w-full max-w-md p-4">
        <DrawerHeader className="px-0 pt-0"><DrawerTitle>{t("Send Money")}</DrawerTitle></DrawerHeader>
        
        {step === "input" && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>{t("Add Recipient")}</FieldLabel>
                <Input placeholder={t("Email or Phone")} {...register("receiver", { required: true })} />
                {errors.receiver && <FieldError>{t("Required")}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>{t("Amount")}</FieldLabel>
                <Input type="number" placeholder="0" {...register("amount", { required: true, min: 1 })} />
                {errors.amount && <FieldError>{t("Invalid amount")}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>{t("Description (Optional)")}</FieldLabel>
                <Textarea rows={2} {...register("description")} />
              </Field>
            </FieldGroup>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? <Spinner /> : t("Continue")}
            </Button>
          </form>
        )}

        {step === "review" && signData && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <Avatar size="lg">
                  {signData.sender.image && <AvatarImage src={signData.sender.image} />}
                  <AvatarFallback>{getInitials(signData.sender.name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{signData.sender.name}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 pb-5">
                <div className="h-px w-12 bg-border" />
                <IconArrowNarrowUp className="h-4 w-4 rotate-90 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Avatar size="lg">
                  {signData.receiver.image && <AvatarImage src={signData.receiver.image} />}
                  <AvatarFallback>{getInitials(signData.receiver.name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{signData.receiver.name}</span>
              </div>
            </div>

            <div className="rounded-xl border p-3 text-sm flex flex-col gap-2">
              <div className="flex justify-between"><span>{t("Amount")}</span><span className="font-medium">{signData.transactionDetails.amount / 100} {signData.transactionDetails.currency}</span></div>
              <div className="flex justify-between"><span>{t("Fee")}</span><span className="font-medium">{signData.transactionDetails.fee > 0 ? `${signData.transactionDetails.fee / 100} ${signData.transactionDetails.currency}` : t("Free")}</span></div>
              <hr className="my-1 border-border" />
              <div className="flex justify-between font-bold"><span>{t("Total")}</span><span>{(signData.transactionDetails.amount + signData.transactionDetails.fee) / 100} {signData.transactionDetails.currency}</span></div>
            </div>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("input")}>{t("Back")}</Button>
              <Button className="flex-1" onClick={confirm}>{t("Confirm")}</Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><IconCheck /></div>
            <h3 className="text-lg font-semibold">{t("Transfer Successful")}</h3>
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="font-mono">{ref}</span>
              <IconCopy className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => navigator.clipboard.writeText(ref)} />
            </div>
            <Button className="w-full mt-4" onClick={close}>{t("Done")}</Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
