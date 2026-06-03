import React from "react"
import { Link, useLocation } from "react-router"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { ThunderSDK } from "thunder-sdk"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { use } from "@/core/hooks/use"
import { appName, getInitials, getNavRoutes, transformImage } from "@/core/lib/utils"
import { BottomTabs } from "./bottom-tabs"
import { SubNav } from "../shared/sub-nav"
import { useLayout } from "../layout-provider"

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const { subRoutes } = React.useMemo(() => getNavRoutes(router.routes), [router.routes])

  const [, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-4">
          <Avatar className="h-8 w-8 rounded-lg" render={<Link to="overview" />}>
            <AvatarImage src={transformImage(me?.image)} alt={me?.name} />
            <AvatarFallback className="rounded-lg text-xs">
              {getInitials(me?.name)}
            </AvatarFallback>
          </Avatar>

          <span className="truncate text-base font-semibold capitalize">
            {appName()}
          </span>

          <Button
            onClick={toggleTheme}
            variant="outline"
            size="icon"
            className="ml-auto"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <IconSun className="size-4" />
            ) : (
              <IconMoon className="size-4" />
            )}
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          {subNavItems?.length ? <SubNav navMenu={subNavItems} /> : null}
        </div>
      </header>

      <main className="page-transition-mobile relative flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-4 pb-24">
          {children}
        </div>
      </main>

      <BottomTabs variant="floating" />{/* change to "default" for the full-width bar */}
    </div >
  )
}
