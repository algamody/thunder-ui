/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { hash } from "ohash"
import { ThunderSDK } from "thunder-sdk"
import { DataTable } from "../custom/Datatable"
import { cards } from "@/overrides/crud/cards"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Link, useNavigate } from "react-router"
import { use } from "../hooks/use"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  IconAlertCircle,
  IconEdit,
  IconLayoutGrid,
  IconTable,
  IconTableColumn,
  IconTrash,
  IconX,
  IconXMark,
} from "@tabler/icons-react"
import { TableSkeleton } from "../custom/TableSkeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ActionBar } from "../custom/ActionBar"
import { ConfirmationDialog } from "../custom/ConfirmationDialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { fieldsFromModuleMetadata } from "./FormPage"
import { JSONSchemaToFields, type TField } from "../lib/jsonSchemaToFields"
import { Checkbox } from "@/components/ui/checkbox"
import { getLocalUrl, transformImage } from "../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Filters, type TFilterValue } from "./filters"
import { filterToMongo } from "./filters/lib/filterToMongo"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Container } from "@/components/container"
import { Pagination } from "@/components/pagination"

const columnFromModuleMetadata = async (metadata: any, resolveRef = false) => {
  const fields = await fieldsFromModuleMetadata(metadata, {
    type: "output",
    resolveRef,
  })

  return JSONSchemaToFields.flatten(fields, { excludeArray: true })
}

const prepareColumns = (
  fields: TField[],
  group?: string
): ColumnDef<unknown, any>[] =>
  fields
    .filter((field) => field.type !== "hidden")
    .map((field) => {
      const isAvatar = field.type === "url" && field.fieldHint === "avatar"

      return {
        header: field.label ?? field.name!,
        accessorKey: field.name!,
        size: isAvatar ? 120 : 220,
        minSize: 120,
        cell: ({ getValue }) => {
          if (field.ref) {
            return (
              <Button
                variant={"link"}
                size="sm"
                className="p-0"
                nativeButton={false}
                render={
                  <Link
                    to={getLocalUrl(
                      [
                        group?.toLowerCase().replace(" ", "-"),
                        field.ref,
                        getValue(),
                      ]
                        .filter(Boolean)
                        .join("/")
                    ).toString()}
                  >
                    {getValue()}
                  </Link>
                }
              ></Button>
            )
          }

          if (isAvatar) {
            return (
              <Avatar>
                <AvatarImage src={transformImage(getValue())} />
                <AvatarFallback>AV</AvatarFallback>
              </Avatar>
            )
          }

          if (field.type === "date") {
            const value = getValue()

            if (value)
              return new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(value))
          }

          const value = getValue()

          if (value instanceof Array) {
            return value.join(", ")
          }

          if (typeof value === "object") {
            return Object.keys(value ?? {}).length === 0 ? (
              "N/A"
            ) : (
              <Popover>
                <PopoverTrigger
                  render={
                    <button>
                      <Badge>View {field.label ?? field.name}</Badge>
                    </button>
                  }
                />
                <PopoverContent>
                  <ScrollArea>
                    <pre>{JSON.stringify(value, null, 2)}</pre>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )
          }

          return value ?? "N/A"
        },
      }
    })

export interface IListPageProps {
  group?: string
  name: string
}

export function ListPage({ group, name }: IListPageProps) {
  const navigate = useNavigate()

  const DEFAULT_LIMIT = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT
  const [filters, setFilters] = React.useState<TFilterValue>()
  const [fields, setFields] = React.useState<TField[]>([])
  const [page, setPage] = React.useState(0)

  const Cards = cards[name as keyof typeof cards]
  const [view, setView] = React.useState(Cards ? "cards" : "table")

  const isCard = view === "cards" && !!Cards

  const _get = React.useCallback(
    (query: Record<string, unknown> = {}) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return ThunderSDK.useCaching(
        [name, view, query && hash(query)],
        async ({ signal }) =>
          (await ThunderSDK.getModule(name).get({
            signal,
            query,
          })) as { results: unknown[] },
        { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
      )
    },
    [name, view]
  )

  const _count = React.useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return ThunderSDK.useCaching(
      [name, "count"],
      async ({ signal }) =>
        (await ThunderSDK.getModule(name).count({
          signal,
        })) as { count: number },
      { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
    )
  }, [name])

  const [projection, setProjection] = React.useState<Record<string, 1>>({})
  const [sorting, setSorting] = React.useState<Record<string, 1 | -1>>({})

  const get = React.useMemo(
    () =>
      _get({
        filters: filters
          ? filterToMongo(filters, {
              typeResolver: (key) => {
                const field = fields.find((v) => v.name === key)

                return field?.ref ? "objectId" : undefined
              },
            })
          : undefined,
        ...(isCard
          ? {
              offset: page * DEFAULT_LIMIT,
              limit: DEFAULT_LIMIT,
            }
          : {}),
        project: Object.keys(projection).length ? projection : undefined,
        sort: Object.keys(sorting).length ? sorting : undefined,
      }),
    [_get, filters, projection, sorting, fields, page]
  )

  const count = React.useMemo(() => _count(), [_count])

  const {
    data: countData,
    error: countError,
    isLoading: countLoading,
    refetch: countRefetch,
  } = use(count, {
    manualTrigger: isCard,
  })

  const {
    data: getData,
    error: getError,
    isLoading: getLoading,
    refetch: getRefetch,
  } = use(get, {
    manualTrigger: isCard, // if Cards component exists, we want to manually trigger the fetch after columns are set, to avoid fetching data twice
  })

  const error = countError || getError
  const isLoading = getLoading

  const refetch = React.useCallback(() => {
    countRefetch()
    return getRefetch()
  }, [countRefetch, getRefetch])

  const fetcher = React.useCallback(
    (project?: Record<string, 1>, sort?: Record<string, 1 | -1>) => {
      if (project && Object.keys(project).length) setProjection(project)
      if (sort && Object.keys(sort).length) setSorting(sort)

      refetch()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refetch]
  )

  const allowCreate = React.useMemo(
    () => ThunderSDK.isPermitted(ThunderSDK.getModule(name).create),
    [name]
  )

  const metadata = React.useMemo(() => ThunderSDK.getMetadata(name), [name])

  const table = useReactTable(
    React.useMemo(
      () => ({
        data: getData?.results ?? [],
        columns: [
          {
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={
                  table.getIsAllRowsSelected() || table.getIsSomeRowsSelected()
                }
                onCheckedChange={(value) => {
                  table.toggleAllRowsSelected(!!value)
                }}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={(value) => {
                  row.toggleSelected(!!value)
                }}
                onClick={(event) => event.stopPropagation()}
                aria-label="Select row"
              />
            ),
            size: 30,
            enableSorting: false,
            enableHiding: false,
            enableResizing: false,
            enablePinning: false,
          },
          ...prepareColumns(fields, group),
        ],
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
      }),
      [getData, fields, group]
    )
  )

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const totalPages = React.useMemo(
    () => Math.ceil(countData?.count ?? 0 / DEFAULT_LIMIT),
    [countData]
  )

  React.useEffect(() => {
    ;(async () => {
      setFields(await columnFromModuleMetadata(metadata))
      setFields(await columnFromModuleMetadata(metadata, true))
    })()
  }, [metadata])

  return (
    <div className={"relative flex h-full min-h-0 flex-1 flex-col gap-3"}>
      {error && (
        <Container className="mb-2">
          <Alert variant="destructive">
            <IconAlertCircle />
            <AlertTitle>Error Occurred!</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </Container>
      )}
      <Container className="flex flex-wrap-reverse items-center justify-between gap-2 lg:flex-nowrap">
        <Filters fields={fields} filters={filters} onChange={setFilters} />

        <div className="flex flex-1 shrink-0 grow items-center justify-end gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-18" />
              <Skeleton className="h-9 w-18" />
            </>
          ) : (
            <>
              {getData?.results.length && !isCard ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="icon">
                        <IconTableColumn />
                      </Button>
                    }
                  ></DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="no-scrollbar max-h-100 overflow-auto"
                  >
                    <DropdownMenuCheckboxItem
                      checked={table.getIsAllColumnsVisible()}
                      onCheckedChange={(value) =>
                        table.toggleAllColumnsVisible(!!value)
                      }
                    >
                      Select all
                    </DropdownMenuCheckboxItem>
                    {table
                      .getAllColumns()
                      .filter((col) => col.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            <span className="line-clamp-1 truncate">
                              {column.columnDef.header as string}
                            </span>
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {allowCreate && (
                <Button onClick={() => navigate("form")}>Create</Button>
              )}
              {!!Cards && (
                <ToggleGroup
                  value={view}
                  onValueChange={(v) => v && setView(v)}
                >
                  <ToggleGroupItem value="cards" aria-label="Cards view">
                    <IconLayoutGrid className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <IconTable className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </>
          )}
        </div>
      </Container>

      <ActionBar
        containerClassName="absolute bottom-10 left-3 right-3 max-w-md mx-auto z-20 shadow-sm"
        data-open={!!selectedRows.length}
      >
        <div className="flex w-full items-center justify-between gap-2 rounded-full border bg-background p-3 dark:bg-black">
          <p className="text-sm md:ltr:ml-3 md:rtl:mr-3">
            {selectedRows.length} <span className="font-medium">selected</span>
          </p>

          <div className="flex items-center gap-2">
            {selectedRows.length === 1 && (
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => {
                  const row = selectedRows.map((row) => row.original)[0] as any

                  navigate(`form/${row._id}`)
                }}
              >
                <IconEdit />
              </Button>
            )}

            <ConfirmationDialog
              trigger={
                <Button size="sm" variant="destructive">
                  <IconTrash />
                </Button>
              }
              onConfirm={async (dismiss) => {
                const ids = selectedRows.map((row: any) => row.original._id)
                for (const id of ids) {
                  await ThunderSDK.getModule(name).del({
                    params: { id },
                  })
                }
                table.resetRowSelection()
                get.invalidate()
                dismiss()
              }}
            />

            <Button
              size="icon-sm"
              variant="secondary"
              onClick={() => table.resetRowSelection()}
              aria-label="Clear selection"
            >
              <IconX />
            </Button>
          </div>
        </div>
      </ActionBar>

      {isCard ? (
        <>
          <Cards
            isLoading={isLoading}
            data={getData?.results ?? []}
            fetcher={fetcher}
            selectedIds={selectedRows.map((v) => (v.original as any)._id)}
            toggleSelect={(id) => {
              const row = table
                .getRowModel()
                .rows.find((v) => (v.original as any)._id === id)

              if (row) row.toggleSelected()
              else table.toggleAllRowsSelected()
            }}
          />

          {countLoading && !countData ? (
            <div className="flex items-center justify-center">
              <Skeleton className="h-9 w-sm" />
            </div>
          ) : countData?.count ? (
            <Pagination
              active={page}
              limit={DEFAULT_LIMIT}
              total={countData.count ?? 0}
              onChange={(page) => {
                setPage(page)
              }}
            />
          ) : null}
        </>
      ) : null}

      {!isCard ? (
        <Container className="flex h-full min-h-0 flex-1 flex-col gap-3">
          {isLoading ? (
            <TableSkeleton />
          ) : getData?.results.length === 0 && !isLoading ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-destructive/10">
                  <IconXMark className="text-destructive" />
                </EmptyMedia>
                <EmptyTitle>No results!</EmptyTitle>
                <EmptyDescription>
                  adjust or clear filters to reveal issues.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <DataTable
              table={table}
              // endReached={() => {
              //   if (page <= totalPages) setPage(page + 1)
              // }}
            />
          )}
        </Container>
      ) : null}
    </div>
  )
}
