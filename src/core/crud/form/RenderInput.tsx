/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { type Control, Controller, useFormContext } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { TField } from "@/core/lib/jsonSchemaToFields";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown } from "../../custom/Dropdown";
import { Multiselect } from "../../custom/Multiselect";
import { Tag, TagInput, TagInputBadges } from "../../custom/TagInput";
import { AvatarUpload } from "../../custom/AvatarUpload";
import { ImageUpload } from "../../custom/ImageUpload";
import { handleDelete, handleUpload } from "../../lib/utils";
import RenderArray from "./RenderArray";
import RenderObject from "./RenderObject";


export type TRenderInputProps = {
  name: string;
  field: TField;
};

export default function RenderInput({ name, field }: TRenderInputProps) {
  if (field.type === "array") return <RenderArray name={name} field={field} />;
  if (field.type === "object") {
    return <RenderObject name={name} field={field} />;
  }

  const id = React.useMemo(() => crypto.randomUUID(), []);
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const getError = React.useCallback(
    (name?: string) => {
      if (!name) return;

      const parts = name.split(".");

      let error: any;

      for (const p of parts) {
        error = error?.[p] ?? errors[p];
      }

      return String(error?.message ?? "");
    },
    [errors],
  );

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {field.label ?? name}
        {field.required ? "" : " (optional)"}
      </FieldLabel>
      {renderField({
        id,
        name,
        field,
        control,
      })}
      <FieldDescription>{field.description}</FieldDescription>
      <FieldError>{getError(name)}</FieldError>
    </Field>
  );
}

const formatDateForInput = (value: Date | string | null | undefined) => {
  if (!value) return "";

  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const renderField = ({
  id,
  name,
  field,
  control,
}: {
  id: string;
  name: string;
  field: TField;
  control: Control<any, any, any>;
}) => {
  if (field.type === "url" && !field.multi && field.fieldHint === "avatar") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <AvatarUpload
            id={id}
            initialFile={def.field.value && typeof def.field.value === "string"
              ? {
                id: def.field.value,
                type: "avatar",
                name: def.field.value,
                url: def.field.value,
                size: 0,
              }
              : undefined}
            onUpload={async ({ file }, signal) => {
              if (file instanceof File) {
                const res = await handleUpload(file, { signal });
                (file as any).url = res.url;
                def.field.onChange(res.url);
              }
            }}
            onRemove={() => {
              const currentUrl = def.field.value;
              def.field.onChange(null);
              if (
                currentUrl && typeof currentUrl === "string" &&
                currentUrl.startsWith("http")
              ) {
                handleDelete(currentUrl).catch(console.error);
              }
            }}
          />
        )}
      />
    );
  }

  if (field.type === "url" && field.fieldHint === "upload") {
    return (
      <Controller
        name={field.name!}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => {
          const currentValue = def.field.value;

          const initialFiles = (field.multi ? currentValue : [currentValue])
            ?.filter(Boolean)
            .map((v: string) => ({
              id: v,
              type: "image",
              name: v,
              url: v,
              size: 0,
            }));

          return (
            <ImageUpload
              id={id}
              multi={field.multi}
              initialFiles={initialFiles}
              onUpload={async ({ file }, signal) => {
                if (file instanceof File) {
                  const res = await handleUpload(file, { signal });
                  (file as any).url = res.url;
                  if (field.multi) {
                    const prev = Array.isArray(def.field.value)
                      ? def.field.value
                      : [];
                    def.field.onChange([...prev, res.url]);
                  } else {
                    def.field.onChange(res.url);
                  }
                }
              }}
              onRemove={async (url) => {
                await handleDelete(url);
                def.field.onChange(null);
        
              }}
            />
          );
        }}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required && "This field is required!" }}
        render={(def) => (
          <Switch
            id={id}
            checked={def.field.value ?? false}
            onCheckedChange={def.field.onChange}
          />
        )}
      />
    );
  }

  if (field.enum) {
    return field.multi
      ? (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
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
      )
      : (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
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
      );
  }

  if (["text", "number", "url", "email", "phone"].includes(field.type)) {
    if (field.multi) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
          render={(def) => (
            <Tag
              id={id}
              values={def.field.value}
              onValueChange={def.field.onChange}
              type={field.type}
            >
              <TagInput />
              <TagInputBadges />
            </Tag>
          )}
        />
      );
    }

    if (field.type === "text" && (!field.maxLength || field.maxLength > 100)) {
      return (
        <Controller
          name={name}
          control={control}
          rules={{ required: field.required && "This field is required!" }}
          render={(def) => (
            <Textarea
              id={id}
              placeholder={field.example ?? field.name}
              maxLength={field.maxLength}
              value={def.field.value ?? ""}
              onChange={(e) => def.field.onChange(e.target.value)}
            />
          )}
        />
      );
    }
  }

  return (
    <Controller
      name={name}
      control={control}
      rules={{ required: field.required && "This field is required!" }}
      render={(def) => {
        const value = field.type === "date"
          ? formatDateForInput(def.field.value)
          : (def.field.value ?? "");

        return (
          <Input
            id={id}
            type={field.type}
            placeholder={field.example ?? field.name}
            maxLength={field.maxLength}
            value={value}
            onChange={(e) =>
              def.field.onChange(
                field.type === "number"
                  ? e.target.valueAsNumber
                  : e.target.value,
              )}
          />
        );
      }}
    />
  );
};
