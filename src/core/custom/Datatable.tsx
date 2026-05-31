/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React from "react"
import {
  type Column,
  type Table as TTable,
  flexRender,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
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

interface DataTableProps {
  table: TTable<unknown>
}

const getPinningStyles = (column: Column<any>): React.CSSProperties => {
  const isPinned = column.getIsPinned()
  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}

export function DataTable({ table }: DataTableProps) {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-xl border">
      <div className="relative min-h-0 w-full flex-1 [&>div]:h-full [&>div]:overflow-y-auto">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-accent *:[tr]:first:*:[th]:first:rounded-ss-xl *:[tr]:last:*:[th]:last:rounded-se-xl">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b-2! border-background"
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
                      className="relative truncate py-0 data-pinned:bg-background/90 data-pinned:backdrop-blur-xs"
                      data-last-col={
                        isLastLeftPinned
                          ? "left"
                          : isFirstRightPinned
                            ? "right"
                            : undefined
                      }
                      data-pinned={isPinned || undefined}
                      {...{
                        colSpan: header.colSpan,
                        style: {
                          width: header.getSize(),
                          ...getPinningStyles(column),
                        },
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
                              aria-label={`Unpin ${header.column.columnDef.header as string} column`}
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
                              title={`Unpin ${header.column.columnDef.header as string} column`}
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
                                    aria-label={`Pin options for ${header.column.columnDef.header as string} column`}
                                    className="size-7 shadow-none"
                                    size="icon"
                                    title={`Pin options for ${header.column.columnDef.header as string} column`}
                                    variant="ghost"
                                  >
                                    <IconDots
                                      aria-hidden="true"
                                      className="opacity-60"
                                      size={16}
                                    />
                                  </Button>
                                }
                              ></DropdownMenuTrigger>
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
                          {...{
                            className:
                              "group absolute top-0 h-full cursor-col-resize select-none touch-none -right-0 z-10 flex items-center justify-center before:absolute before:w-px before:inset-y-0 before:translate-x-px transition ease-in-out duration-300",
                            onDoubleClick: () => header.column.resetSize(),
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                          }}
                        >
                          <div className="h-6 w-1 rounded-md bg-border group-hover:bg-muted-foreground/70"></div>
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="group h-10 data-[state=selected]:bg-primary/10"
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
                      className="group relative truncate border-b! py-0.5 align-middle group-data-[state=selected]:border-background data-pinned:border-primary! data-pinned:bg-background/90 data-pinned:backdrop-blur-xs"
                      data-last-col={
                        isLastLeftPinned
                          ? "left"
                          : isFirstRightPinned
                            ? "right"
                            : undefined
                      }
                      data-pinned={isPinned || undefined}
                      style={{
                        width: cell.column.getSize(),
                        ...getPinningStyles(column),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter className="sticky bottom-0 z-10 bg-muted/30 backdrop-blur-sm">
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
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
            ))}
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
