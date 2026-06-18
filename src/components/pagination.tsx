import {
  Pagination as _Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "./ui/select"
import React, { useMemo } from "react"

function calculatePaginationRange(
  active: number,
  totalItems: number,
  itemsPerPage: number,
  pagesToDisplay: number,
  startFrom: 0 | 1
): { label: number; value: number }[] {
  if (totalItems <= 0 || itemsPerPage <= 0 || pagesToDisplay <= 0) return []

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const maxActive = totalPages - 1
  const safeActive = Math.min(Math.max(active, 0), maxActive)

  const visiblePages = Math.min(pagesToDisplay, totalPages)

  const groupIndex = Math.floor(safeActive / visiblePages)

  const startValue = groupIndex * visiblePages
  const endValue = Math.min(startValue + visiblePages - 1, totalPages - 1)

  return Array.from({ length: endValue - startValue + 1 }, (_, i) => {
    const value = startValue + i

    return {
      label: value + startFrom,
      value,
    }
  })
}

export function Pagination({
  active,
  total,
  limit = 20,
  paginationItemsToDisplay = 3,
  onChange,
}: {
  active: number
  total: number
  limit?: number
  paginationItemsToDisplay?: number
  onChange: (page: number) => void
}) {
  const startFrom = 1
  const totalPages = React.useMemo(() => {
    return Array.from({ length: Math.ceil(total / limit) }, (_, i) => ({
      label: i + startFrom,
      value: i,
    }))
  }, [total, limit])

  const range = useMemo(
    () =>
      calculatePaginationRange(
        active,
        total,
        limit,
        paginationItemsToDisplay,
        startFrom
      ),
    [active, total, limit, paginationItemsToDisplay]
  )

  const handleChange = React.useCallback(
    (page: number) => {
      onChange(Math.min(Math.max(page, 0), total))
    },
    [total]
  )

  return totalPages.length > 1 ? (
    <_Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handleChange(Math.max(active - 1, 0))}
          />
        </PaginationItem>
        {range.map((page) => (
          <PaginationItem key={page.value} value={page.value}>
            <PaginationLink
              className={page.value === active ? "bg-primary text-white" : ""}
              onClick={() => handleChange(page.value)}
            >
              {page.label}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <Select
            items={totalPages}
            onValueChange={(value) => handleChange(Number(value))}
          >
            <SelectTrigger className="w-full max-w-48">
              <PaginationEllipsis />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              <SelectGroup>
                <SelectLabel>Pages</SelectLabel>
                {totalPages.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() =>
              handleChange(Math.min(active + 1, totalPages.length - 1))
            }
          />
        </PaginationItem>
      </PaginationContent>
    </_Pagination>
  ) : null
}
