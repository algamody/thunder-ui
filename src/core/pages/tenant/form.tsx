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

const DefaultForm = {
  logo: undefined,
  name: "",
}

export default function TenantForm() {
  const { setLoading } = useLoading()

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
    defaultValues: DefaultForm,
  })

  const onSubmit: SubmitHandler<typeof DefaultForm> = async (form) => {
    setLoading(true)

    await ThunderSDK.tenants
      .create({ body: form })
      .finally(() => setLoading(false))
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
          <FieldLabel htmlFor="fname">Tenant Name</FieldLabel>
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
            Create tenant
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
