/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import RenderInput from "./RenderInput"
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { RenderFieldGroup } from "./RenderFieldGroup"
import { IconTrashX } from "@tabler/icons-react"

export type TRenderArrayProp = {
  name: string
  field: TField
}

export default function RenderArray({ name, field }: TRenderArrayProp) {
  if (field.type !== "array") return <RenderInput name={name} field={field} />

  const { t } = useTranslation()
  const {
    control,
    formState: { errors },
    watch
  } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    rules: {
      required: field.required && t("You need to add one!"),
    },
  })

  const getError = React.useCallback(
    (name?: string) => {
      if (!name) return

      const parts = name.split(".")

      let error: any

      for (const p of parts) {
        error = error?.[p] ?? errors[p]
      }

      return String(error?.root?.message ?? "")
    },
    [errors]
  )

  if (field.requirementKey) {
    const value = watch(field.requirementKey)

    if (value !== name) return
  }

  return (
    <FieldGroup>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>{field.label ?? field.name}</FieldLegend>
        {field.description && (
          <FieldDescription>{field.description}</FieldDescription>
        )}
        <FieldError>{getError(name)}</FieldError>
      </FieldSet>

      <FieldSet>
        {fields.map(({ id }, index) => {
          return (
            <FieldGroup key={id}>
              <div className="grid grid-flow-col grid-cols-5">
                <div className="col-span-4">
                  <RenderFieldGroup
                    fields={field.fields ?? []}
                    fieldName={(subField) =>
                      [name, index, subField.name]
                        .filter((i) => i !== undefined)
                        .join(".")
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    size={"icon"}
                    variant={"destructive"}
                    onClick={() => remove(index)}
                  >
                    <IconTrashX />
                  </Button>
                </div>
              </div>
            </FieldGroup>
          )
        })}

        <FieldGroup>
          <Button onClick={() => append({})}>{t("Add")}</Button>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  )
}