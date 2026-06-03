import React from "react"
import { Link } from "react-router"
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconDotsCircleHorizontal,
  IconLogout,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { use } from "@/core/hooks/use"
import { useLogout } from "@/core/protected"
import { getAuthUrl, getInitials, transformImage } from "@/core/lib/utils"
import { cn } from "@/lib/utils"
import type { TNav } from "./bottom-tabs"

export function MoreSheet({
  overflowItems,
  activeParent,
}: {
  overflowItems: TNav[]
  activeParent?: string
}) {
  const [open, setOpen] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const logout = useLogout()

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const isMoreActive = React.useMemo(
    () => overflowItems.some((item) => item.path && item.path === activeParent),
    [overflowItems, activeParent]
  )

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors",
              isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          />
        }
      >
        <IconDotsCircleHorizontal className="size-5 shrink-0" />
        <span className="text-[11px] leading-none font-medium">More</span>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85svh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="gap-3 p-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 rounded-lg">
              <AvatarImage src={transformImage(me?.image)} alt={me?.name} />
              <AvatarFallback className="rounded-lg">
                {getInitials(me?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {me?.name ?? "Unnamed"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {me?.email ?? "N/A"}
              </span>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        <div className="flex flex-col gap-1 overflow-y-auto p-3">
          {overflowItems.length > 0 && (
            <>
              {overflowItems.map((item) => {
                const Icon = item.icon ?? IconAlertCircle
                const active = !!item.path && item.path === activeParent

                return (
                  <SheetClose
                    key={item.title}
                    render={
                      <Link to={item.path || "#"} viewTransition />
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent/60"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </SheetClose>
                )
              })}
              <Separator className="my-2" />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              const authUrl = getAuthUrl()
              authUrl.searchParams.set("returnUri", window.location.href)
              window.location.href = authUrl.toString()
            }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
          >
            <IconUserCircle className="size-5 shrink-0" />
            <span>Account</span>
          </button>

          <SheetClose
            render={<Link to="/select-tenant/#list" />}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
          >
            <IconArrowsExchange className="size-5 shrink-0" />
            <span>Change tenant</span>
          </SheetClose>

          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
          >
            <IconNotification className="size-5 shrink-0" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/60"
          >
            {resolvedTheme === "dark" ? (
              <IconSun className="size-5 shrink-0" />
            ) : (
              <IconMoon className="size-5 shrink-0" />
            )}
            <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>

        <Separator />

        <div className="p-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={logout}
            aria-label="Logout"
          >
            <IconLogout className="size-4" /> Log out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
