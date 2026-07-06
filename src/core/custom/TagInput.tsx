import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconTrash, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import React from "react"
import { InputGroup } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export type TTagValue = "text" | "number" | "url" | "email" | "phone"

type TagInputProps = {
  values?: TTagValue[]
  onValueChange?: (value: TTagValue[]) => void
} & React.ComponentProps<typeof Input>

const TagInputContext = React.createContext<TagInputProps | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useTag() {
  const ctx = React.useContext(TagInputContext) as TagInputProps | null
  if (!ctx) throw new Error("Must be used inside TagInputProvider")
  return ctx
}

export function Tag({
  children,
  ...props
}: TagInputProps & { children: React.ReactNode }) {
  return (
    <TagInputContext.Provider value={props}>
      {children}
    </TagInputContext.Provider>
  )
}

export function TagInput() {
  const { t } = useTranslation()
  const { values, onValueChange, ...inputProps } = useTag()

  return (
    <InputGroup className="flex min-h-fit flex-col items-start gap-3">
      {values?.length ? (
        <div className="flex grow flex-wrap justify-start gap-2 p-2 pb-0">
          {values.map((tag, idx) => (
            <Badge key={idx}>
              {tag}{" "}
              <li
                className="cursor-pointer list-none"
                onClick={() => onValueChange?.(values.filter((v) => v !== tag))}
              >
                <IconX className="size-4" />
              </li>
            </Badge>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "flex w-full items-center justify-between gap-1 pe-2",
          values?.length ? "pb-1" : ""
        )}
      >
        <Input
          {...inputProps}
          placeholder={t("Enter your tag...")}
          className="bg-transparent! focus-visible:border-transparent! focus-visible:ring-3 focus-visible:ring-transparent!"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()

              if (!e.currentTarget.checkValidity()) {
                e.currentTarget.reportValidity()

                return
              }

              const value = (
                inputProps.type === "number"
                  ? e.currentTarget.valueAsNumber
                  : e.currentTarget.value
              ) as TTagValue
              onValueChange?.([...new Set([value, ...(values ?? [])])])

              e.currentTarget.value = ""
            }
          }}
        />

        <Button
          size="icon-xs"
          variant="destructive"
          onClick={() => onValueChange?.([])}
        >
          <IconTrash />
        </Button>
      </div>
    </InputGroup>
  )
}
