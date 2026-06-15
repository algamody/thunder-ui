import React from "react"
import { Virtuoso } from "react-virtuoso"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Container } from "./container"

export function AttendanceCard({ data, fetcher }: any) {
  React.useEffect(() => {
    fetcher?.({})
  }, [fetcher])

  return (
    <Virtuoso
      className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto mask-y-from-98%"
      data={data}
      itemContent={(_, v) => (
        <Container key={v._id} className="flex h-full w-full flex-col gap-3">
          <Card>
            <CardHeader>{v.employeeCode}</CardHeader>
            <CardContent>
              <p>{v.punchAt}</p>
              <p>{v.timezone}</p>
            </CardContent>
          </Card>
        </Container>
      )}
    />
  )
}
