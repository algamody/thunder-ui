import React from "react"
import { useNavigate } from "react-router"
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconDotsCircleHorizontal,
  IconLanguage,
  IconLogout,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import {
  Sheet,
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
import { useTranslation } from "react-i18next"
import i18next from "i18next"

export function MoreSheet({
  overflowItems,
  activeParent,
}: {
  overflowItems: TNav[]
  activeParent?: string
}) {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const logout = useLogout()
  const { t } = useTranslation()

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

  const handleNavigate = (path: string) => {
    setOpen(false)
    setTimeout(() => navigate(path, { viewTransition: true }), 300)
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
        <span className="text-[11px] leading-none font-medium">
          {t("More")}
        </span>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[85svh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="gap-3 p-4">
          <SheetTitle className="sr-only">{t("Menu")}</SheetTitle>
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 rounded-lg">
              <AvatarImage src={transformImage(me?.image)} alt={me?.name} />
              <AvatarFallback className="rounded-lg">
                {getInitials(me?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {me?.name ?? t("Unnamed")}
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
                  <Button
                    key={item.title}
                    variant={active ? "secondary" : "ghost"}
                    className="justify-start"
                    onClick={() => handleNavigate(item.path || "#")}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Button>
                )
              })}
              <Separator className="my-2" />
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => {
              const authUrl = getAuthUrl()
              authUrl.searchParams.set("returnUri", window.location.href)
              window.location.href = authUrl.toString()
            }}
            className="justify-start"
          >
            <IconUserCircle className="size-5 shrink-0" />
            <span>{t("Account")}</span>
          </Button>

          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => handleNavigate("/select-tenant/#list")}
          >
            <IconArrowsExchange className="size-5 shrink-0" />
            <span>{t("Change tenant")}</span>
          </Button>

          <Button variant="ghost" className="justify-start">
            <IconNotification className="size-5 shrink-0" />
            <span>{t("Notifications")}</span>
          </Button>

          {/* change language */}
          <Button
            variant="ghost"
            onClick={() => i18next.changeLanguage(i18next.language === "en" ? "ar" : "en")}
            className="justify-between"
          >
            <div className="flex items-center gap-3">
              <IconLanguage className="size-5 shrink-0" />
              <span>
                {i18next.language === "en" ? t("English") : t("Arabic")}
              </span>
            </div>

            <IconArrowsExchange className="size-4 text-muted-foreground" />
          </Button>


          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="justify-start"
          >
            {resolvedTheme === "dark" ? (
              <IconSun className="size-5 shrink-0" />
            ) : (
              <IconMoon className="size-5 shrink-0" />
            )}
            <span>
              {resolvedTheme === "dark"
                ? t("Light mode")
                : t("Dark mode")}
            </span>
          </Button>
        </div>

        <Separator />

        <div className="p-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={logout}
            aria-label="Logout"
          >
            <IconLogout className="size-4" />   {t("Log out")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
