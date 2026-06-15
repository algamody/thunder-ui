/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React from "react"
import {
  type Column,
  type Table as TTable,
  flexRender,
} from "@tanstack/react-table"
import {
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  IconArrowBarToLeft,
  IconArrowBarToRight,
  IconDots,
  IconPinnedOff,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableVirtuoso } from "react-virtuoso"

interface DataTableProps {
  table: TTable<unknown>
  endReached?: (index: number) => void
}

const getPinningStyles = (column: Column<any>): React.CSSProperties => {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 10 : 0,
  }
}

export function DataTable({ table, endReached }: DataTableProps) {
  const rows = table.getRowModel().rows

  return (
    <TableVirtuoso
      className="flex h-full min-h-0 w-full flex-1"
      totalCount={rows.length}
      fixedItemHeight={40}
      increaseViewportBy={{
        top: 400,
        bottom: 400,
      }}
      endReached={endReached}
      computeItemKey={(index) => rows[index]?.id ?? index}
      components={{
        Scroller: (props) => {
          return (
            <div
              {...props}
              className="relative h-full min-h-0 w-full overflow-auto rounded-xl border"
            />
          )
        },
        Table: ({ style, ...props }) => {
          return (
            <table
              {...props}
              style={{
                ...style,
                minWidth: table.getTotalSize(),
              }}
              data-slot="table"
              className="h-full w-full table-fixed caption-bottom text-sm"
            />
          )
        },
        TableRow: (props) => {
          const index = props["data-index"]
          const row = rows[index]!

          return (
            <TableRow
              {...props}
              data-state={row.getIsSelected() && "selected"}
              className="group min-h-10 w-full"
            >
              {row.getVisibleCells().map((cell) => {
                const { column } = cell
                const isPinned = column.getIsPinned()
                const isLastLeftPinned =
                  isPinned === "left" && column.getIsLastColumn("left")
                const isFirstRightPinned =
                  isPinned === "right" && column.getIsFirstColumn("right")

                return (
                  <TableCell
                    key={cell.id}
                    className="relative truncate bg-background py-0.5 align-middle group-data-[state=selected]:border-background data-pinned:border-primary!"
                    data-last-col={
                      isLastLeftPinned
                        ? "left"
                        : isFirstRightPinned
                          ? "right"
                          : undefined
                    }
                    style={{
                      width: cell.column.getSize(),
                      ...getPinningStyles(column),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        },
      }}
      fixedFooterContent={() => {
        return table.getFooterGroups().map((footerGroup) => (
          <TableRow
            key={footerGroup.id}
            className="bg-muted/30 backdrop-blur-sm"
          >
            {footerGroup.headers.map((header) => (
              <TableCell key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                    )}
              </TableCell>
            ))}
          </TableRow>
        ))
      }}
      fixedHeaderContent={() => {
        return table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="border-background bg-background/90 backdrop-blur-sm"
          >
            {headerGroup.headers.map((header) => {
              const { column } = header
              const isPinned = column.getIsPinned()
              const isLastLeftPinned =
                isPinned === "left" && column.getIsLastColumn("left")
              const isFirstRightPinned =
                isPinned === "right" && column.getIsFirstColumn("right")

              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className="relative truncate py-0 data-pinned:bg-background/90 data-pinned:backdrop-blur-xs"
                  data-last-col={
                    isLastLeftPinned
                      ? "left"
                      : isFirstRightPinned
                        ? "right"
                        : undefined
                  }
                  data-pinned={isPinned || undefined}
                  style={{
                    width: header.getSize(),
                    ...getPinningStyles(column),
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </span>

                    {!header.isPlaceholder &&
                      header.column.getCanPin() &&
                      (header.column.getIsPinned() ? (
                        <Button
                          aria-label={`Unpin ${
                            header.column.columnDef.header as string
                          } column`}
                          onClick={() => {
                            header.column.pin(false)

                            table.setColumnPinning((old) => {
                              return {
                                ...old,
                                left: old.left?.filter(
                                  (v) =>
                                    v !== "select" && v !== header.column.id
                                ),
                              }
                            })
                          }}
                          size="icon"
                          title={`Unpin ${
                            header.column.columnDef.header as string
                          } column`}
                          variant="ghost"
                        >
                          <IconPinnedOff
                            aria-hidden="true"
                            className="text-sidebar-primary"
                            size={16}
                          />
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                aria-label={`Pin options for ${
                                  header.column.columnDef.header as string
                                } column`}
                                className="size-7 shadow-none"
                                size="icon"
                                title={`Pin options for ${
                                  header.column.columnDef.header as string
                                } column`}
                                variant="ghost"
                              >
                                <IconDots
                                  aria-hidden="true"
                                  className="opacity-60"
                                  size={16}
                                />
                              </Button>
                            }
                          />

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                table.setColumnPinning((old) => {
                                  const left = old.left ?? []

                                  return {
                                    ...old,
                                    left: [
                                      "select",
                                      ...left.filter(
                                        (id) =>
                                          id !== "select" &&
                                          id !== header.column.id
                                      ),
                                      header.column.id,
                                    ],
                                  }
                                })
                              }
                            >
                              <IconArrowBarToLeft
                                aria-hidden="true"
                                className="opacity-60"
                                size={16}
                              />
                              Stick to left
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => header.column.pin("right")}
                            >
                              <IconArrowBarToRight
                                aria-hidden="true"
                                className="opacity-60"
                                size={16}
                              />
                              Stick to right
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}
                  </div>

                  {header.column.getCanResize() && (
                    <div
                      className="group absolute top-0 right-0 z-10 flex h-full cursor-col-resize touch-none items-center justify-center transition duration-300 ease-in-out select-none before:absolute before:inset-y-0 before:w-px before:translate-x-px"
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                    >
                      <div className="h-6 w-1 rounded-md bg-border group-hover:bg-muted-foreground/70" />
                    </div>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))
      }}
    />
  )
}
