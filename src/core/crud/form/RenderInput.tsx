/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { Controller, useFormContext, type Control } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import type { TField } from "@/core/lib/jsonSchemaToFields"

import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dropdown } from "../../custom/Dropdown"
import { Multiselect } from "../../custom/Multiselect"
import { Tag, TagInput } from "../../custom/TagInput"
import { MarkdownEditorField } from "@/core/custom/MarkdownEditor"
import { AvatarUpload } from "../../custom/AvatarUpload"
import { ImageUpload } from "../../custom/ImageUpload"
import { formatDateForInput, handleUpload } from "../../lib/utils"
import RenderArray from "./RenderArray"
import RenderObject from "./RenderObject"

export type TRenderInputProps = {
  name: string
  field: TField
}

export default function RenderInput({ name, field }: TRenderInputProps) {
  if (field.type === "array") return <RenderArray name={name} field={field} />
  if (field.type === "object") return <RenderObject name={name} field={field} />

  const { t } = useTranslation()
  const id = React.useMemo(() => crypto.randomUUID(), [])
  const {
    control,
    formState: { errors },
    watch,
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

  if (field.requirementKey) {
    const value = watch(field.requirementKey)

    if (value !== name) return
  }

  if (field.type === "hidden" && (!field.required || !!field.const)) return null

  return (
    <Field className={field.className} style={field.style}>
      {field.type === "hidden" ? null : (
        <FieldLabel htmlFor={id}>
          {field.label ?? t(name)}
          {field.required ? "" : ` (${t("optional")})`}
        </FieldLabel>
      )}
      {renderField({
        id,
        name,
        field,
        control,
        t,
      })}
      {field.type === "hidden" ? null : (
        <FieldDescription>{field.description}</FieldDescription>
      )}
      <FieldError>{getError(name)}</FieldError>
    </Field>
  )
}

export const renderField = ({
  id,
  name,
  field,
  control,
  t,
}: {
  id: string
  name: string
  field: TField
  control: Control<any, any, any>
  t: TFunction
}) => {
  if (field.type === "text" && field.fieldHint === "markdown") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <MarkdownEditorField
            value={def.field.value}
            onChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (field.type === "url" && !field.multi && field.fieldHint === "avatar") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <AvatarUpload
            id={id}
            initialFile={
              def.field.value && typeof def.field.value === "string"
                ? {
                    id: def.field.value,
                    type: "avatar",
                    name: def.field.value,
                    url: def.field.value,
                    size: 0,
                  }
                : undefined
            }
            onUpload={async ({ file }, signal) => {
              if (file instanceof File) {
                const res = await handleUpload(file, { signal })
                def.field.onChange(res.url)
              }
            }}
            onRemove={() => {
              def.field.onChange(null)
            }}
          />
        )}
      />
    )
  }

  if (field.type === "url" && field.fieldHint === "upload") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => {
          const currentValue = def.field.value

          const initialFile =
            !field.multi && typeof currentValue === "string" && currentValue
              ? {
                  id: currentValue,
                  type: "image",
                  name: currentValue,
                  url: currentValue,
                  size: 0,
                }
              : undefined

          const initialFiles =
            field.multi && Array.isArray(currentValue)
              ? currentValue
                  .filter((v: any) => typeof v === "string" && v)
                  .map((v: string) => ({
                    id: v,
                    type: "image",
                    name: v,
                    url: v,
                    size: 0,
                  }))
              : undefined

          return (
            <ImageUpload
              id={id}
              multi={field.multi}
              initialFile={initialFile}
              initialFiles={initialFiles}
              onUpload={async ({ file }, signal) => {
                if (file instanceof File) {
                  const res = await handleUpload(file, { signal })
                  if (field.multi) {
                    const prev = Array.isArray(def.field.value)
                      ? def.field.value
                      : []
                    def.field.onChange([...prev, res.url])
                  } else {
                    def.field.onChange(res.url)
                  }
                }
              }}
              onRemove={(removedId) => {
                if (field.multi) {
                  const prev = Array.isArray(def.field.value)
                    ? def.field.value
                    : []
                  def.field.onChange(
                    prev.filter((url: string) => url !== removedId)
                  )
                } else {
                  def.field.onChange(null)
                }
              }}
            />
          )
        }}
      />
    )
  }

  if (field.type === "boolean")
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <Switch
            id={id}
            checked={def.field.value ?? false}
            onCheckedChange={def.field.onChange}
          />
        )}
      />
    )

  if (field.enum) {
    return field.multi ? (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <Multiselect
            id={id}
            multiple
            autoHighlight
            items={field.enum}
            value={def.field.value}
            onValueChange={def.field.onChange}
          />
        )}
      />
    ) : (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <Dropdown
            id={id}
            items={(field.enum ?? []).map((value) =>
              typeof value === "object" && value
                ? value
                : { value, label: value }
            )}
            value={def.field.value ?? ""}
            onValueChange={def.field.onChange}
          />
        )}
      />
    )
  }

  if (["text", "number", "url", "email", "phone"].includes(field.type)) {
    if (field.multi) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && t("This field is required!") }}
          render={(def) => (
            <Tag
              id={id}
              values={def.field.value}
              onValueChange={def.field.onChange}
              type={field.type}
            >
              <TagInput />
            </Tag>
          )}
        />
      )
    }

    if (field.type === "text" && (!field.maxLength || field.maxLength > 100)) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && t("This field is required!") }}
          render={(def) => (
            <Textarea
              id={id}
              placeholder={field.example ?? field.name}
              minLength={field.minLength}
              maxLength={field.maxLength}
              value={def.field.value ?? ""}
              onChange={(e) => def.field.onChange(e.target.value)}
            />
          )}
        />
      )
    }
  }

  if (field.type === "date") {
    if (field.fieldHint === "datetime-local") {
      return (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && t("This field is required!") }}
          render={(def) => (
            <Input
              id={id}
              type="datetime-local"
              placeholder={field.example ?? field.name}
              defaultValue={formatDateForInput(def.field.value, true)}
              onChange={(e) => def.field.onChange(new Date(e.target.value))}
            />
          )}
        />
      )
    }

    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && t("This field is required!") }}
        render={(def) => (
          <Input
            id={id}
            type={field.type}
            placeholder={field.example ?? field.name}
            defaultValue={formatDateForInput(def.field.value)}
            onChange={(e) => def.field.onChange(new Date(e.target.value))}
          />
        )}
      />
    )
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: field.required && t("This field is required!") }}
      render={(def) => (
        <Input
          id={id}
          type={field.type}
          placeholder={field.example ?? field.name}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.pattern}
          value={def.field.value ?? ""}
          onChange={(e) =>
            def.field.onChange(
              field.type === "number" ? e.target.valueAsNumber : e.target.value
            )
          }
        />
      )}
    />
  )
}