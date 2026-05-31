import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { use } from "@/core/hooks/use"

import Logo from "/logo.png"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAuthUrl, getInitials, transformImage } from "@/core/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonRepeater } from "@/core/custom/SkeletonRepeater"
import TenantForm from "./form"
import { IconAlertCircle, IconUser } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Navigate, useLocation, useNavigate } from "react-router"
import { ThunderSDK } from "thunder-sdk"

export function SelectTenant() {
  const navigate = useNavigate()
  const { hash } = useLocation()

  const tenants = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.tenantMemberships.get({
        signal,
        query: {},
        params: {},
      })
    },
    []
  )

  const { data, error, isLoading } = use(tenants)

  if (data?.results.length === 1 && hash !== "#list")
    return <Navigate to={`/${data?.results[0].tenant._id}`} />

  return (
    <div className="flex h-full min-h-svh w-full flex-col items-center justify-center gap-3 p-2">
      {error ? (
        <Alert variant="destructive" className="max-w-md">
          <IconAlertCircle />
          <AlertTitle>{error.name}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}
      {isLoading ? (
        <CardSkeleton />
      ) : data?.results.length ? (
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <div className="flex shrink-0 items-center gap-3">
              <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" />
            </div>
            <CardTitle>Select Tenant</CardTitle>
            <CardDescription>Choose a tenant to proceed</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-50 w-full">
              {data?.results.map(({ tenant }) => (
                <Item
                  variant="muted"
                  size="xs"
                  key={tenant._id as string}
                  className="mb-1 first:rounded-b-lg last:rounded-t-lg"
                >
                  <ItemMedia variant="default">
                    <Avatar size="lg">
                      <AvatarImage
                        src={transformImage(tenant.logo)}
                        alt={tenant.name}
                      />
                      <AvatarFallback className="bg-muted-foreground/10">
                        {getInitials(tenant.name)}
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{tenant.name}</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant={"link"}
                      onClick={() => {
                        const authUrl = getAuthUrl()

                        authUrl.searchParams.set("tab", "members")
                        authUrl.searchParams.set("tenant", tenant._id as string)

                        window.location.href = authUrl.toString()
                      }}
                    >
                      Members
                    </Button>
                    <Button onClick={() => navigate(`/${tenant._id}`)}>
                      Select
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ScrollArea>
          </CardContent>
          <CardFooter className="text-center">
            <small className="text-muted-foreground">
              Tenant selection is required so that you can access the
              appropriate resources and settings.
            </small>
          </CardFooter>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconUser className="size-4" />
            </div>

            <CardTitle>Create Tenant</CardTitle>
            <CardDescription>
              Please fill the form to create a new tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-none">
      <CardHeader className="flex flex-col items-center justify-center gap-2 text-center">
        <Skeleton className="size-10 min-w-10 rounded-full bg-muted-foreground/10" />
        <Skeleton className="h-4 w-full max-w-20 bg-muted-foreground/10" />
        <Skeleton className="h-4 w-full max-w-30 bg-muted-foreground/10" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-50 w-full">
          <SkeletonRepeater count={3}>
            <Item
              variant="muted"
              size="xs"
              className="first:rounded-b-lg last:rounded-t-lg"
            >
              <Skeleton className="size-10 min-w-10 rounded-full bg-muted-foreground/10" />
              <div className="flex flex-1 flex-col">
                <Skeleton className="my-0.5 h-4 max-w-30 bg-muted-foreground/10" />
              </div>
              <Skeleton className="h-7 w-14 bg-muted-foreground/10" />
            </Item>
          </SkeletonRepeater>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center justify-center">
        <Skeleton className="h-4 w-full max-w-50 bg-muted-foreground/10" />
      </CardFooter>
    </Card>
  )
}
