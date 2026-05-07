/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react"
import { useParams, useLocation, useNavigate } from "react-router"
import { ThunderSDK } from "thunder-sdk"
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"

import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields"
import RenderInput from "./form/RenderInput"

const fieldsFromModuleMetadata = async (metadata: any) => {
  if (!metadata) return []

  if (typeof metadata.crud?.insertSchema !== "object") return []

  // Convert json schema to fields data
  const results = await JSONSchemaToFields.toFields(
    undefined,
    metadata.crud.insertSchema
  )

  console.log("Fields:", results)

  return results
}

JSONSchemaToFields.resolveRef = async (ref, field) => {
  const createProjection = () => {
    const fields =
      field.refLabel instanceof Array
      ? field.refLabel
        : [field.refLabel, "label", "name", "title"].filter(Boolean)

    return Object.fromEntries(fields.map((field) => [field, 1]))
  }

  const { results } = (await ThunderSDK.getModule(ref).get({
    query: {
      project: createProjection(),
    },
  })) as {
    results: any[]
  }

  const resolveLabel = (item: any) => {
    if (field.refLabel instanceof Array) {
      return field.refLabel
        .map((prop) => item[prop])
        .filter(Boolean)
        .join(" ")
    }

    return (
      (field.refLabel && item[field.refLabel]) ||
      item.label ||
      item.name ||
      item.title
    )
  }

  const resolveValue = (item: any) => {
    if (field.refValue) {
      return item[field.refValue]
    }

    return item._id
  }

  return results.map((item: any) => ({
    label: resolveLabel(item),
    value: resolveValue(item),
  }))
}

export interface IFormPageProps {
  name: string
}

export function FormPage({ name }: IFormPageProps) {
  const { id } = useParams<{ id?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isEditMode = !!id
  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])
  const methods = useForm<any>({
    defaultValues: isEditMode ? location.state?.record : undefined,
  })
  const [fields, setFields] = React.useState<TField[]>([])

  React.useEffect(() => {
    ;(async () => {
      setFields(await fieldsFromModuleMetadata(metadata))
    })()
  }, [metadata])

  const onSubmit: SubmitHandler<any> = async (body) => {
    if (isEditMode) {
      await ThunderSDK.getModule(name).update({
        params: { id },
        body,
      })
    } else {
      await ThunderSDK.getModule(name).create({
        body,
      })
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <FormProvider {...methods}>
        <form
          className="mx-auto w-full max-w-md pb-24"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>{isEditMode ? "Update" : "Create"}</FieldLegend>
              <FieldDescription>
                {isEditMode
                  ? `Update the ${name} entry below.`
                  : `Fill the form below to create a new ${name} entry. All fields are required`}
              </FieldDescription>
            </FieldSet>

            {fields.map((field, index) => (
              <RenderInput
                key={`${field.name}_${index}`}
                name={field.name!}
                field={field}
              />
            ))}

            <FieldSet>
              <FieldGroup>
                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    disabled={methods.formState.isSubmitting || !fields.length}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </FormProvider>
    </div>
  )
}
