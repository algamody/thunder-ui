import type { TField } from "@/core/lib/jsonSchemaToFields"
import React from "react"
import RenderInput from "./RenderInput"
import { FieldGroup } from "@/components/ui/field"

export type TRenderFieldGroupProp = {
  fields: TField[]
  fieldName?: (field: TField, index: number) => string
}

export function RenderFieldGroup({ fields, fieldName }: TRenderFieldGroupProp) {
  const groups = React.useMemo(() => fieldsByGroup(fields), [fields])

  return (
    <>
      {groups.map(({ group, fields }, index) => (
        <FieldGroup
          key={`${group}_${index}`}
          className={fields[0]?.groupClassName}
          style={fields[0]?.groupStyle}
        >
          {fields.map((field, index) => {
            const name = fieldName?.(field, index) ?? field.name!
            return (
              <RenderInput key={`${name}_${index}`} name={name} field={field} />
            )
          })}
        </FieldGroup>
      ))}
    </>
  )
}

const fieldsByGroup = (fields: TField[]) => {
  const groupedFields: Array<{ group?: string; fields: TField[] }> = [
    { group: undefined, fields: [] },
  ]

  let currentGroup: string | undefined = undefined

  for (const field of fields) {
    if (field.group !== currentGroup) {
      currentGroup = field.group
      groupedFields.push({ group: currentGroup, fields: [] })
    }

    groupedFields[groupedFields.length - 1].fields.push(field)
  }

  return groupedFields
}
