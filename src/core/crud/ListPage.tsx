/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react"
import { hash } from "ohash"
import { ThunderSDK } from "thunder-sdk"
import type { TFilters } from "thunder-sdk/types"
import { DataTable } from "../custom/Datatable"
import { cards } from "@/overrides/crud/cards"
import {
  type ColumnDef,
  getCoreRowModel,
  useReactTable,
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
import { getLocalUrl, isMobileLayout, transformImage } from "../lib/utils"
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
import { Container } from "@/core/custom/Container"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Refresher } from "@/components/refresher"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
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
  group?: string,
  t?: any
): ColumnDef<unknown, any>[] =>
  fields
    .filter((field) => field.type !== "hidden")
    .map((field) => {
      const isAvatar = field.type === "url" && field.fieldHint === "avatar"

      return {
        header: field.label ? t(field.label) : field.name ? t(field.name) : "",
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

            if (value) {
              return new Intl.DateTimeFormat(i18next.language, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(value))
            }
          }

          const value = getValue()

          if (value instanceof Array) {
            return value.join(", ")
          }

          if (typeof value === "object") {
            return Object.keys(value ?? {}).length === 0 ? (
              t("N/A")
            ) : (
              <Popover>
                <PopoverTrigger
                  render={
                    <button>
                      <Badge>
                        {t("View")}{" "}
                        {field.label ? t(field.label) : t(field.name!)}
                      </Badge>
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

          return value ?? t("N/A")
        },
      }
    })

export interface IListPageProps {
  group?: string
  name: string
}

const DEFAULT_LIMIT = import.meta.env.VITE_DEFAULT_PAGINATION_LIMIT ?? 100

export function ListPage({ group, name }: IListPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [fetchCount, setFetchCount] = React.useState(0)
  const [fetchController, setFetchController] =
    React.useState<AbortController | null>(null)

  const [filters, setFilters] = React.useState<TFilters>()
  const [subFilters, setSubFilters] = React.useState<TFilterValue>()
  const [project, setProject] = React.useState<Record<string, 1 | -1>>({})
  const [sort, setSort] = React.useState<Record<string, 1 | -1>>({})

  const [fields, setFields] = React.useState<TField[]>([])
  const [page, setPage] = React.useState(0)

  const Cards = cards[name as keyof typeof cards]
  const [view, setView] = React.useState(Cards ? "cards" : "table")

  const isCard = view === "cards" && !!Cards

  const query = React.useMemo(
    () => ({
      filters: filters,
      subFilters: subFilters
        ? filterToMongo(subFilters, {
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
      project: Object.keys(project).length ? project : undefined,
      sort: Object.keys(sort).length ? sort : undefined,
    }),
    [filters, subFilters, isCard, project, sort, page]
  )

  const countQuery = React.useMemo(() => ({ filters: query.filters, subFilters: query.subFilters }), [query])

  const countQueryHash = React.useMemo(() => hash(countQuery), [countQuery])

  const count = ThunderSDK.useCaching(
    [name, "count", countQueryHash],
    async ({ signal }) =>
      (await ThunderSDK.getModule(name).count({
        signal,
        query: countQuery,
      })) as { count: number },
    { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
  )

  const {
    data: countData,
    error: countError,
    isLoading: countLoading,
    refetch: refetchCount,
  } = use(count, {
    manualTrigger: isCard,
  })

  const queryHash = React.useMemo(() => hash(query), [query])

  const get = ThunderSDK.useCaching(
    [name, view, queryHash],
    async ({ signal }) =>
      (await ThunderSDK.getModule(name).get({
        signal,
        query,
      })) as { results: unknown[] },
    { cacheTTL: parseInt(import.meta.env.VITE_DEFAULT_CACHE_TTL ?? "1") }
  )

  const {
    data: getData,
    error: getError,
    isLoading: getLoading,
    refetch: refetchGet,
  } = use(get, {
    manualTrigger: isCard,
  })

  const error = countError || getError
  const isLoading = !!!getData?.results.length && getLoading
  const isRefetching = getLoading

  const fetcher = React.useCallback(
    (project?: Record<string, 1>, sort?: Record<string, 1 | -1>) => {
      if (project && Object.keys(project).length) setProject(project)
      if (sort && Object.keys(sort).length) setSort(sort)

      const controller = new AbortController()

      setFetchCount((i) => i + 1)
      setFetchController(controller)

      return controller
    },
    []
  )

  React.useEffect(() => {
    if (fetchCount && fetchController) {
      refetchCount({ controller: fetchController })
      refetchGet({ controller: fetchController })
    }
  }, [fetchCount, query])

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
          ...prepareColumns(fields, group, t),
        ],
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        enableRowSelection: true,
      }),
      [getData, fields, group, t]
    )
  )

  const selectedRows = table.getFilteredSelectedRowModel().rows

  React.useEffect(() => {
    ; (async () => {
      setFields(await columnFromModuleMetadata(metadata))
      setFields(await columnFromModuleMetadata(metadata, true))
    })()
  }, [metadata])

  const totalPages = React.useMemo(
    () => Math.ceil((countData?.count ?? 0) / DEFAULT_LIMIT),
    [countData]
  )

  return (
    <React.Fragment>
      <Refresher
        onRefresh={() => {
          return Promise.allSettled([refetchCount(), refetchGet()])
        }}
      >
        <div
          className={"relative flex h-full min-h-0 flex-1 flex-col gap-3 pt-2"}
        >
          {error && (
            <Container className="mb-2">
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertTitle>{t("Error occurred!")}</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            </Container>
          )}
          <Container className="flex flex-wrap-reverse items-center justify-between gap-3 lg:flex-nowrap">
            <Filters fields={fields} filters={subFilters} onChange={setSubFilters} />

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
                          {t("Select all")}
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
                    <Button onClick={() => navigate("form")}>
                      {t("Create")}
                    </Button>
                  )}
                  {!!Cards && (
                    <ToggleGroup
                      value={view}
                      onValueChange={(view) => {
                        setView(view)

                        if (view === "table") {
                          setFetchCount(0)
                          setFetchController(null)
                          setProject({})
                          setSort({})
                        }
                      }}
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

          {isCard ? (
            <>
              <Cards
                isLoading={isLoading}
                isRefetching={isRefetching}
                data={getData?.results ?? []}
                setFilters={setFilters}
                setProject={setProject}
                setSort={setSort}
                setPage={setPage}
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

              {isMobileLayout() && totalPages > 1 && selectedRows.length > 0 && (
                <div className="h-20"></div>
              )}
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
                    <EmptyTitle>{t("No results!")}</EmptyTitle>
                    <EmptyDescription>
                      {t("Adjust or clear filters to reveal issues.")}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <DataTable table={table} />
              )}

              {isMobileLayout() && selectedRows.length > 0 && <div className="h-20"></div>}
            </Container>
          ) : null}
        </div>

        <ActionBar
          containerClassName={cn(
            "fixed inset-x-3 z-20 mx-auto max-w-md shadow-sm",
            isMobileLayout() ? "bottom-21" : "bottom-4 sm:bottom-12"
          )}
          data-open={!!selectedRows.length}
        >
          <div className="flex w-full items-center justify-between gap-2 rounded-full border bg-background p-3 dark:bg-black">
            <p className="text-sm md:ltr:ml-3 md:rtl:mr-3">
              {selectedRows.length}{" "}
              <span className="font-medium">{t("selected")}</span>
            </p>

            <div className="flex items-center gap-2">
              {selectedRows.length === 1 && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  onClick={() => {
                    const row = selectedRows.map(
                      (row) => row.original
                    )[0] as any
                    const fallbackName =
                      row.name || row.title || row.label || ""

                    navigate(`form/${row._id}`, {
                      state: { name: fallbackName },
                    })
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
                  toast.success(t("Deleted successfully."))
                  table.resetRowSelection()
                  await get.invalidate()
                  dismiss()
                }}
              />

              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => table.resetRowSelection()}
                aria-label="Clear selection"
              >
                <IconX />
              </Button>
            </div>
          </div>
        </ActionBar>
      </Refresher>
    </React.Fragment>
  )
}
