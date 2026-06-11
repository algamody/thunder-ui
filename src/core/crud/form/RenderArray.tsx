/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import React from "react"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { useFieldArray, useFormContext } from "react-hook-form"
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

export type TRenderArrayProp = {
  name: string
  field: TField
}

export default function RenderArray({ name, field }: TRenderArrayProp) {
  if (field.type !== "array") return <RenderInput name={name} field={field} />

  const {
    control,
    formState: { errors },
  } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name,
    rules: {
      required: field.required && "You need to add one!",
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
              <RenderFieldGroup
                fields={field.fields ?? []}
                fieldName={(subField) =>
                  [name, index, subField.name]
                    .filter((i) => i !== undefined)
                    .join(".")
                }
              />
              {/* {(field.fields ?? []).map((subField, subIndex) => {
                const fieldName = [name, index, subField.name]
                  .filter((i) => i !== undefined)
                  .join(".")

                return (
                  <RenderInput
                    key={`${fieldName}_${subIndex}`}
                    name={fieldName}
                    field={subField}
                  />
                )
              })} */}

              <Button variant={"destructive"} onClick={() => remove(index)}>
                Remove
              </Button>
            </FieldGroup>
          )
        })}

        <FieldGroup>
          <Button onClick={() => append({})}>Add</Button>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  )
}
