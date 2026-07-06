import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useLoading } from "@/core/context/LoaderProvider"
import { AvatarUpload } from "@/core/custom/AvatarUpload"
import { use } from "@/core/hooks/use"
import { handleUpload } from "@/core/lib/utils"
import React from "react"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { ThunderSDK } from "thunder-sdk"
import { useTranslation } from "react-i18next"

const DefaultForm = {
  _id: undefined,
  logo: undefined,
  name: "",
} as { _id?: string; logo?: string; name: string }

export default function TenantForm({
  data,
  footerContent,
  afterSubmitSuccess,
}: {
  data?: { logo?: string; name: string }
  afterSubmitSuccess?: () => void
  footerContent?: () => React.ReactNode
}) {
  const { setLoading } = useLoading()
  const { t } = useTranslation()

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const { control, register, handleSubmit, formState } = useForm<
    typeof DefaultForm
  >({
    defaultValues: { ...DefaultForm, ...data },
  })

  const onSubmit: SubmitHandler<typeof DefaultForm> = async (form) => {
    setLoading(true)

    const { _id, ...rest } = form

    if (_id) {
      await ThunderSDK.tenants
        .update({ body: rest, params: { id: _id } })
        .finally(() => setLoading(false))
    } else
      await ThunderSDK.tenants
        .create({ body: rest })
        .finally(() => setLoading(false))

    afterSubmitSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field className="flex w-full items-center justify-center">
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <AvatarUpload
                id="logo"
                initialFile={
                  field.value
                    ? {
                        id: field.value,
                        type: "logo",
                        name: field.value,
                        url: field.value,
                        size: 0,
                      }
                    : undefined
                }
                onUpload={async ({ file }, signal) => {
                  if (file instanceof File && me) {
                    setLoading(true)
                    const res = await handleUpload(file, {
                      path: [me._id as string, "tenant"],
                      signal,
                    }).finally(() => setLoading(false))
                    field.onChange(res.url)
                  }
                }}
              />
            )}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="fname">{t("Tenant Name")}</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder={"e.g John Doe"}
            {...register("name", {
              required: "Tenant name is required!",
            })}
          />

          <FieldError>{formState.errors.name?.message}</FieldError>
        </Field>

        <Field>
          <Button type="submit" disabled={formState.isSubmitting}>
            {data ? "Update tenant" : "Create tenant"}
          </Button>

          {footerContent?.()}
        </Field>
      </FieldGroup>
    </form>
  )
}
