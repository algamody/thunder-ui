/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { useFormContext } from "react-hook-form"
import Field from "./RenderInput"
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"
import RenderInput from "./RenderInput"
import { RenderFieldGroup } from "./RenderFieldGroup"

export type TRenderObjectProp = {
  name: string
  field: TField
}

export default function RenderObject({ name, field }: TRenderObjectProp) {
  if (field.type !== "object") return <RenderInput name={name} field={field} />

  const {
    formState: { errors },
  } = useFormContext()

  const getError = React.useCallback(
    (name?: string) => {
      if (!name) return

      const parts = name.split(".")

      let error: any

      for (const p of parts) {
        error = error?.[p] ?? errors[p]
      }

      return String(error?.message ?? "")
    },
    [errors]
  )

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
        <RenderFieldGroup
          fields={field.fields ?? []}
          fieldName={(subField) =>
            [name, subField.name].filter(Boolean).join(".")
          }
        />
        {/* <FieldGroup>
          {(field.fields ?? []).map((subField, index) => {
            const fieldName = [name, subField.name].filter(Boolean).join(".")

            return (
              <Field
                key={`${fieldName}_${index}`}
                name={fieldName}
                field={subField}
              />
            )
          })}
        </FieldGroup> */}
      </FieldSet>
    </FieldGroup>
  )
}
