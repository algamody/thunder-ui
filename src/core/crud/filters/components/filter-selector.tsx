/* eslint-disable react-hooks/static-components */
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { TField } from "@/core/lib/jsonSchemaToFields"
import { IconArrowRight, IconFilter } from "@tabler/icons-react"
import React from "react"
import { filterIcon, useFilters } from ".."
import { FilterValueController } from "./filter-value"

export function FilterSelector() {
  const { fields, filters, onChange } = useFilters()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [property, setProperty] = React.useState<string>("")

  const hasFilters = !!filters

  const field = React.useMemo(
    () => fields.find((f) => f.name === property),
    [property, fields]
  )

  const content = React.useMemo(
    () =>
      property && field ? (
        <FilterValueController
          field={field}
          filters={filters}
          onChange={onChange}
        />
      ) : (
        <Command
          loop
          filter={(value, search, keywords) => {
            const extendValue = `${value} ${keywords?.join(" ")}`
            return extendValue.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0
          }}
        >
          <CommandInput ref={inputRef} placeholder="Search..." />
          <CommandEmpty>No filters found.</CommandEmpty>
          <CommandList className="max-h-fit scroll-mask-y-from-90%">
            <CommandGroup>
              {fields
                .filter(
                  (v) =>
                    !["url", "hidden", "object", "array"].includes(v.type) &&
                    v.canFilter
                )
                .map((field) => (
                  <FilterableColumn
                    key={field.name}
                    field={field}
                    data-selected={property === field.name}
                    onSelect={setProperty}
                  />
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      ),
    [fields, property, field, filters, onChange]
  )

  return (
    <Popover onOpenChangeComplete={(open) => !open && setProperty("")}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconFilter className="size-4" />
            {!hasFilters && <span>Filter</span>}
          </Button>
        }
      ></PopoverTrigger>
      <PopoverContent className="max-h-100 w-fit p-0!" align="start">
        {content}
      </PopoverContent>
    </Popover>
  )
}

export function FilterableColumn({
  field,
  onSelect,
  ...rest
}: {
  field: TField
  onSelect: (name: string) => void
} & React.ComponentProps<typeof CommandItem>) {
  const itemRef = React.useRef<HTMLDivElement>(null)

  const Icon = filterIcon(field)

  return (
    <CommandItem
      {...rest}
      ref={itemRef}
      value={field.name}
      keywords={[field.name, field.label].filter(Boolean) as string[]}
      onSelect={onSelect}
      className="group"
    >
      <Icon strokeWidth={2.25} className="size-4" />
      <span>{field.label ?? field.name}</span>

      <CommandShortcut className="opacity-0 group-aria-selected:opacity-100">
        <IconArrowRight className="size-4" />
      </CommandShortcut>
    </CommandItem>
  )
}
