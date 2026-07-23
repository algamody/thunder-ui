/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useNavigate, useParams } from "react-router";
import { ThunderSDK } from "thunder-sdk";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields";
import { forms } from "@/overrides/crud/forms";
import { RenderFieldGroup } from "./form/RenderFieldGroup";
import { Container } from "@/core/custom/Container";
import { toast } from "sonner";

export const fieldsFromModuleMetadata = async (
  metadata: any,
  opts: {
    type: "insert" | "update" | "output";
    resolveRef?: boolean;
  },
) => {
  if (!metadata) return [];

  if (typeof metadata.crud !== "object") return [];

  const schema = (() => {
    switch (opts.type) {
      case "insert":
        return metadata.crud.insertSchema ?? metadata.crud.schema;

      case "update":
        return metadata.crud.updateSchema ?? metadata.crud.insertSchema;

      default:
        return metadata.crud.schema;
    }
  })();

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(undefined, schema, {
    resolveRef: opts.resolveRef,
  });

  console.log("Fields:", results);

  return results;
};

JSONSchemaToFields.resolveRef = async (ref, field) => {
  const createProjection = () => {
    const fields = field.refLabel instanceof Array
      ? field.refLabel
      : [field.refLabel, "label", "name", "title"].filter(Boolean);

    return Object.fromEntries(fields.map((field) => [field, 1]));
  };

  const { results } = await ThunderSDK.useCache(
    async () =>
      (await ThunderSDK.getModule(ref).get({
        query: {
          project: createProjection(),
        },
      })) as {
        results: any[];
      },
    {
      cacheKey: [ref, "get"],
      cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1"),
    },
  );

  const resolveLabel = (item: any) => {
    if (field.refLabel instanceof Array) {
      return field.refLabel
        .map((prop) => item[prop])
        .filter(Boolean)
        .join(" ");
    }

    return (
      (field.refLabel && item[field.refLabel]) ||
      item.label ||
      item.name ||
      item.title
    );
  };

  const resolveValue = (item: any) => {
    if (field.refValue) {
      return item[field.refValue];
    }

    return item._id;
  };

  return results.map((item: any) => {
    const value = resolveValue(item);

    return {
      label: resolveLabel(item) || value,
      value,
    };
  });
};

export interface IFormPageProps {
  group?: string;
  name: string;
}

export function FormPage({ name }: IFormPageProps) {
  const CustomForm = forms[name as keyof typeof forms];

  if (CustomForm) return <CustomForm />;

  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();

  const navigate = useNavigate();

  const isEditMode = !!id;
  const methods = useForm<any>({
    shouldUnregister: true
  });

  const [isRecordLoading, setIsRecordLoading] = React.useState(true);

  React.useEffect(() => {
    if (isEditMode) {
      void (async () => {
        setIsRecordLoading(true);

        const { results } = (await ThunderSDK.getModule(name)
          .get({
            params: { id },
          })
          .finally(() => {
            setIsRecordLoading(false);
          })) as { results: any[] };

        if (results.length === 0) {
          navigate(-1);
          return;
        }

        methods.reset(results[0]);
      })();
    }
  }, [id, isEditMode, methods, name, navigate]);

  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name]);

  const [isFieldsLoading, setIsFieldsLoading] = React.useState(true);
  const [fields, setFields] = React.useState<TField[]>([]);

  React.useEffect(() => {
    (async () => {
      setIsFieldsLoading(true);

      const fields = await fieldsFromModuleMetadata(metadata, {
        type: isEditMode ? "update" : "insert",
        resolveRef: true,
      });

      setFields(fields);
      setIsFieldsLoading(false);
    })();
  }, [isEditMode, metadata]);

  const isFormLoading = isFieldsLoading || (isEditMode && isRecordLoading);
  const onSubmit: SubmitHandler<any> = async (body) => {
    try {
      if (isEditMode) {
        await ThunderSDK.getModule(name).update({
          params: { id },
          body,
        });
        toast.success(t("{{name}} updated successfully.", { name }));
      } else {
        await ThunderSDK.getModule(name).create({
          body,
        });
        toast.success(t("{{name}} created successfully.", { name }));
      }

      navigate(-1);
    } catch (error) {
      toast.error(
        isEditMode
          ? t("Failed to update {{name}}.", { name })
          : t("Failed to create {{name}}.", { name })
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%">
      <Container>
        <FormProvider {...methods}>
          <form
            className="mx-auto w-full max-w-md pb-24"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <FieldSet>
                <FieldLegend>{isEditMode ? t("Update") : t("Create")}</FieldLegend>
                <FieldDescription>
                  {isEditMode
                    ? t("Update the {{name}} entry below.", { name })
                    : t(
                        "Fill the form below to create a new {{name}} entry. All fields are required",
                        { name }
                      )}
                </FieldDescription>
              </FieldSet>

              {isFormLoading
                ? (
                  <Skeleton className="py-8 text-center text-sm text-muted-foreground">
                    {isEditMode ? t("Loading record...") : t("Loading form...")}
                  </Skeleton>
                )
                : <RenderFieldGroup fields={fields[0].fields ?? []} />}

              <FieldSet>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <Button
                      type="submit"
                      disabled={methods.formState.isSubmitting || isFormLoading}
                    >
                      {t("Submit")}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate(-1)}
                    >
                      {t("Cancel")}
                    </Button>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </form>
        </FormProvider>
      </Container>
    </div>
  );
}