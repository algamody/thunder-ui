/**
 * JSON schema sample 1
 *
 * {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        avatar: { type: "string", format: "uri", fieldHint: "avatar" },
        fname: {
          type: "string",
          maxLength: 50,
          group: "fullName",
          label: "First Name",
        },
        mname: {
          group: "fullName",
          label: "Middle Name",
          type: "string",
          maxLength: 50,
        },
        lname: {
          group: "fullName",
          label: "Last Name",
          type: "string",
          maxLength: 50,
        },
        gender: { type: "string", enum: ["male", "female", "other"] },
        dob: { label: "Date of birth", type: "string", format: "date-time" },
        email: {
          type: "string",
          format: "email",
          pattern:
            "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        },
        phone: {
          type: "string",
          format: "e164",
          pattern: "^\\+[1-9]\\d{6,14}$",
        },
        employeeCode: {
          type: "number",
          minimum: 1,
          maximum: 999999999999999,
          label: "Employee Code",
        },
        bloodGroup: {
          type: "string",
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        },
        ethnicity: {
          type: "string",
          enum: [
            "Asian",
            "Black or African",
            "Hispanic or Latino",
            "Middle Eastern or North African",
            "Native American or Alaska Native",
            "Native Hawaiian or Pacific Islander",
            "White",
            "Mixed or Multiple",
            "Other",
            "Prefer not to say",
          ],
        },
        religion: {
          type: "string",
          enum: [
            "Islam",
            "Christianity",
            "Hinduism",
            "Buddhism",
            "Judaism",
            "Sikhism",
            "Bahai",
            "Jainism",
            "Shinto",
            "Taoism",
            "Traditional / Folk",
            "Atheism",
            "Agnosticism",
            "Other",
            "Prefer not to say",
          ],
        },
        qualification: {
          type: "string",
          enum: [
            "None",
            "Primary",
            "Secondary / High School",
            "Intermediate",
            "Diploma",
            "Bachelor's Degree",
            "Master's Degree",
            "Doctorate / PhD",
            "Professional Certification",
            "Other",
          ],
        },
        maritalStatus: {
          type: "string",
          enum: ["Single", "Married", "Widowed", "Divorced"],
        },
        tags: { default: [], type: "array", items: { type: "string" } },
        country: {
          group: "address",
          groupTitle: "Address",
          groupDescription: "Provide the address details of the employee",
          type: "string",
          maxLength: 50,
        },
        state: { type: "string", maxLength: 50, group: "address" },
        city: { type: "string", maxLength: 50, group: "address" },
        address_1: { type: "string", maxLength: 300, group: "address" },
        address_2: { type: "string", maxLength: 300, group: "address" },
        zip: { group: "address", type: "string", maxLength: 50 },
        identity: {
          type: "array",
          items: {
            type: "object",
            properties: {
              kind: {
                type: "string",
                enum: ["passport", "cnic", "driving-license"],
              },
              description: { type: "string", maxLength: 150 },
              documents: {
                type: "array",
                items: {
                  type: "string",
                  format: "uri",
                  label: "Identity documents",
                  fieldHint: "upload",
                },
              },
            },
            required: ["kind", "documents"],
          },
        },
        id: {
          type: "object",
          properties: {
            identity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  kind: {
                    type: "string",
                    enum: ["passport", "cnic", "driving-license"],
                  },
                  description: { type: "string", maxLength: 150 },
                  documents: {
                    type: "array",
                    items: {
                      type: "array",
                      items: {
                        type: "string",
                        format: "uri",
                        label: "Identity documents",
                        fieldHint: "upload",
                      },
                    },
                  },
                },
                required: ["kind", "documents"],
              },
            },
          },
        },
        documents: {
          type: "array",
          items: {
            type: "string",
            format: "uri",
            label: "Other documents",
            fieldHint: "upload",
          },
        },
        bankDetails: {
          type: "object",
          properties: {
            bankName: { type: "string", maxLength: 100 },
            accountName: { type: "string", maxLength: 50 },
            accountNumber: { type: "string", maxLength: 120 },
            iban: { type: "string", minLength: 15, maxLength: 34 },
            swiftCode: { type: "string", minLength: 8, maxLength: 11 },
            routingNumber: { type: "string", minLength: 5, maxLength: 20 },
            address: { type: "string", maxLength: 300 },
          },
          required: ["bankName", "accountName", "accountNumber"],
          groupTitle: "Bank details",
          groupDescription: "Employee's receiving bank account",
        },
        contract: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: [
                "full-time",
                "part-time",
                "fixed-term",
                "zero-hour",
                "freelancer",
                "contract",
                "internship",
              ],
              label: "Contract Kind",
            },
            hiredAt: {
              description: "Hiring time before officially joining",
              type: "string",
              format: "date-time",
            },
            joinedAt: {
              description: "Start the payroll period",
              type: "string",
              format: "date-time",
            },
            probationExpiry: {
              description: "Probation ending time",
              type: "string",
              format: "date-time",
            },
            resignedAt: {
              description: "Last payroll period",
              type: "string",
              format: "date-time",
            },
            terminatedAt: {
              description: "Last payroll period",
              type: "string",
              format: "date-time",
            },
            endedAt: {
              description: "When the contract is ended",
              type: "string",
              format: "date-time",
            },
            expiresAt: {
              description: "When the contract expires/ends",
              type: "string",
              format: "date-time",
            },
            department: { tsType: "string", ref: "departments" },
            designation: { tsType: "string", ref: "designations" },
            team: { tsType: "string", ref: "teams" },
            workLocation: { tsType: "string", ref: "workLocations" },
            reportingTo: {
              tsType: "string",
              ref: "employees",
              refLabel: ["fname", "mname", "lname"],
            },
            rosters: {
              type: "array",
              items: { tsType: "string", ref: "rosters" },
            },
            wage: {
              type: "object",
              properties: {
                period: {
                  type: "string",
                  enum: ["weekly", "bi-weekly", "semi-monthly", "monthly"],
                },
                effectiveFrom: {
                  description: "Usually same as the joinedAt time",
                  type: "string",
                  format: "date-time",
                },
                amount: { type: "number" },
                prorate: {
                  default: true,
                  description: "Prorate will not work for hourly period",
                  type: "boolean",
                },
                allowances: { type: "array", items: { tsType: "string" } },
                deductions: { type: "array", items: { tsType: "string" } },
              },
              required: ["period", "effectiveFrom", "amount"],
              groupTitle: "Wage details",
              groupDescription: "Define the wage of this employee",
            },
          },
          required: [
            "kind",
            "hiredAt",
            "joinedAt",
            "probationExpiry",
            "department",
            "designation",
            "wage",
          ],
          groupTitle: "Contract",
          groupDescription: "Define the contract of this employee",
        },
      },
      required: ["fname", "phone", "employeeCode", "id", "documents"],
    }
 */

import z from "zod";

export const FieldTypes = [
  "text",
  "number",
  "boolean",
  "date",
  "email",
  "url",
  "hidden",
] as const;

export type TFieldType = (typeof FieldTypes)[number];
export type TField = {
  type: TFieldType | "array" | "object";
  group?: string;
  groupClassName?: string;
  className?: string;
  groupStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  fields?: Array<TField>;
  name?: string;
  parentName?: string;
  defaultValue?: unknown;
  label?: string;
  placeholder?: string;
  description?: string;
  multi?: boolean;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  required?: boolean;
  enum?: string[] | Array<{ label: string; value: unknown }>;
  pattern?: string;
  example?: string;
  ref?: string;
  refLabel?: string | string[];
  refValue?: string;
  fieldHint?: string;
  const?: unknown;
  canFilter?: boolean;
  requirementKey?: string;
};

export class JSONSchemaToFields {
  protected static resolveFieldType(type: string, format?: string): TFieldType {
    switch (format) {
      case "uri": {
        return "url";
      }

      case "date-time": {
        return "date";
      }

      case "email": {
        return "email";
      }

      default: {
        return FieldTypes.includes(type as TFieldType)
          ? (type as TFieldType)
          : "text";
      }
    }
  }

  protected static jsonFieldSchema = z
    .object({
      type: z.string().default("string"),
      group: z.string().optional(),
      groupClassName: z.string().optional(),
      className: z.string().optional(),
      groupStyle: z.record(z.string(), z.string()).optional(),
      style: z.record(z.string(), z.string()).optional(),
      default: z.unknown().optional(),
      label: z.string().optional(),
      minItems: z.number().optional(),
      maxItems: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      enum: z.array(z.string()).optional(),
      pattern: z.string().optional(),
      placeholder: z.string().optional(),
      description: z.string().optional(),
      example: z.string().optional(),
      ref: z.string().optional(),
      refLabel: z.union([z.string(), z.string().array()]).optional(),
      refValue: z.string().optional(),
      fieldHint: z.string().optional(),
      const: z.any(),
      canFilter: z.boolean().optional(),
      requirementKey: z.string().optional(),
    })
    .loose();

  protected static _toFields(
    name: string | undefined,
    schema: unknown,
    hints?: Partial<TField>,
  ): TField[] {
    if (typeof schema !== "object" || schema === null) {
      throw new Error("Cannot construct form fields from an invalid schema!");
    }

    const type = "type" in schema && typeof schema.type === "string"
      ? schema.type
      : "string";

    if (
      type === "object" &&
      "properties" in schema &&
      typeof schema.properties === "object" &&
      schema.properties !== null
    ) {
      return [
        {
          ...hints,
          ...schema,
          name,
          type: "object",
          fields: Object.entries(schema.properties).flatMap(([prop, def]) =>
            this._toFields(prop, def, {
              parentName: name,
              ...("required" in schema && schema.required instanceof Array
                ? { required: schema.required.includes(prop) }
                : {}),
            })
          ),
        },
      ];
    }

    if (type === "array") {
      if (
        "items" in schema && typeof schema.items === "object" &&
        schema.items !== null
      ) {
        if (
          "type" in schema.items &&
          ["object", "array"].includes(schema.items.type as string)
        ) {
          return [
            {
              ...hints,
              ...schema,
              name,
              type: "array",
              fields: this._toFields(undefined, schema.items, {
                parentName: name,
              }),
            },
          ];
        }

        return this._toFields(name, schema.items, {
          ...hints,
          ...schema,
          multi: true,
        });
      }

      if (
        "prefixItems" in schema && typeof schema.prefixItems === "object" &&
        schema.prefixItems !== null &&
        schema.prefixItems instanceof Array
      ) {
        return schema.prefixItems.flatMap((items, index) =>
          this._toFields(`${name}.${index}`, items, {
            parentName: name,
          })
        );
      }
    }

    const field = {
      ...hints,
      ...schema,
      name,
      type: this.resolveFieldType(
        type,
        "format" in schema && typeof schema.format === "string"
          ? schema.format
          : undefined,
      ),
    };

    return [field];
  }

  static resolveRef?: (
    ref: string,
    field: TField,
  ) => Promise<Array<{ label: string; value: unknown }>>;

  protected static async resolveField(field: TField): Promise<TField> {
    if (typeof field.ref === "string") {
      if (typeof this.resolveRef !== "function") {
        throw new Error("Unable to resolve reference! No implementation!");
      }

      field.enum = await this.resolveRef(field.ref, field);
    }

    return field;
  }

  protected static async resolveDeepFields(
    fields: TField[],
  ): Promise<TField[]> {
    return await Promise.all(
      fields.map(async (field) => {
        if (["array", "object"].includes(field.type)) {
          field.fields = await this.resolveDeepFields(field.fields ?? []);
        }

        return await this.resolveField(field);
      }),
    );
  }

  static async toFields(
    name: string | undefined,
    schema: unknown,
    opts?: {
      resolveRef?: boolean;
    },
  ): Promise<TField[]> {
    const fields = this._toFields(name, schema);

    if (!opts?.resolveRef) return fields;

    return await this.resolveDeepFields(fields);
  }

  static flatten(fields: TField[], opts?: {
    parentName?: string;
    excludeArray?: boolean;
  }): TField[] {
    return fields.flatMap((field) => {
      if (opts?.excludeArray && field.type === "array") return [];

      if (field.fields instanceof Array && field.fields.length) {
        return this.flatten(
          field.fields,
          {
            ...opts,
            parentName: [
              opts?.parentName,
              field.name,
              field.type === "array" ? "0" : undefined,
            ]
              .filter(Boolean).join("."),
          },
        );
      }

      delete field.parentName;

      field.name = [opts?.parentName, field.name].filter(Boolean).join(".");

      return field;
    });
  }
}
