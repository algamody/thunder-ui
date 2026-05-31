import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface TableSkeletonProps {
  numCols?: number
  numRows?: number
}

export function TableSkeleton({
  numRows = 10,
  numCols = 10,
}: TableSkeletonProps) {
  const rows = Array.from(Array(numRows).keys())
  const cols = Array.from(Array(numCols).keys())

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-xl border">
      <div className="relative min-h-0 w-full flex-1 [&>div]:h-full [&>div]:overflow-y-auto">
        <Table className="w-full">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              {cols.map((_, index) => (
                <TableHead key={index}>
                  {index === 0 ? (
                    <Skeleton className="h-5 w-5 rounded-sm" />
                  ) : (
                    <Skeleton className="h-5 w-24" />
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((_, index) => (
              <TableRow key={index} className="h-12 hover:bg-transparent">
                {cols.map((_, index2) => (
                  <TableCell key={index2}>
                    {index2 === 0 ? (
                      <Skeleton className="h-5 w-5 rounded-sm" />
                    ) : (
                      <Skeleton className="h-5" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={cols.length}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
