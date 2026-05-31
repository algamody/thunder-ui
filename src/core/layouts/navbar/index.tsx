import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { useTheme } from "@/components/theme-provider"
import {
  IconArrowsExchange,
  IconDotsVertical,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
  type TablerIcon,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import Logo from "/logo.png"
import { Link, useLocation } from "react-router"
import React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavMenu } from "./nav-menu"
import { appName } from "@/core/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { use } from "@/core/hooks/use"
import { getAuthUrl, getInitials, transformImage } from "@/core/lib/utils"
import { useLogout } from "@/core/protected"
import { SubNav } from "./sub-nav"
import { ThunderSDK } from "thunder-sdk"

export type TNav = {
  title: string
  icon?: TablerIcon
  path?: string
  parent?: string
}

function allowDisplay(display?: boolean | (() => boolean)) {
  if (typeof display === "function") return display()
  return display ?? true
}

function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label="Toggle menu"
      onClick={toggleSidebar}
    >
      <IconMenu2 className="size-4" />
    </Button>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const logout = useLogout()

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const { routes, subRoutes } = React.useMemo(() => {
    const routes: TNav[] = []
    const subRoutes: TNav[] = []

    for (const route of router.routes as TRouteObject[]) {
      if (!allowDisplay(route.display)) continue

      for (const child of route.children ?? []) {
        if (!allowDisplay(child.display)) continue

        const parentPath = child.path ?? "/"

        routes.push({
          title: child.name || "Unnamed Route",
          icon: child.icon,
          path: parentPath,
        })

        for (const subChild of child.children ?? []) {
          if (!allowDisplay(subChild.display)) continue

          subRoutes.push({
            title: subChild.name || "Unnamed Route",
            icon: subChild.icon,
            path: subChild.path,
            parent: parentPath,
          })
        }
      }
    }

    return { routes, subRoutes: Object.groupBy(subRoutes, (i) => i.parent!) }
  }, [router.routes])

  const [, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon" variant="floating">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-md py-0! ring-transparent group-data-[collapsible=icon]:size-8! hover:bg-transparent! group-data-[collapsible=icon]:[&>img]:block">
                <img
                  src={Logo}
                  alt="Logo"
                  className="hidden h-5 w-auto shrink-0"
                />
                <span className="text-base font-semibold">Main Menu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu items={routes} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg grayscale">
                        <AvatarImage
                          src={transformImage(me?.image)}
                          alt={me?.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(me?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{me?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {me?.email}
                        </span>
                      </div>
                      <IconDotsVertical className="ml-auto size-4" />
                    </SidebarMenuButton>
                  }
                ></DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={transformImage(me?.image)}
                            alt={me?.name}
                          />
                          <AvatarFallback className="rounded-lg">
                            {getInitials(me?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">
                            {me?.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {me?.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => {
                        const authUrl = getAuthUrl()

                        authUrl.searchParams.set(
                          "returnUri",
                          window.location.href
                        )

                        window.location.href = authUrl.toString()
                      }}
                    >
                      <IconUserCircle className="size-4" />
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link to="/select-tenant/#list" />}
                    >
                      <IconArrowsExchange className="size-4" />
                      Change tenant
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconNotification className="size-4" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={logout}>
                      <IconLogout className="size-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh overflow-hidden p-3 md:p-2">
        <div className="@container/main relative flex h-full w-full flex-1 flex-col gap-2 rounded-xl border-border xl:border">
          <header className="mx-auto w-full max-w-6xl">
            <div className="mx-auto flex items-center gap-3 py-2">
              {/* Logo / Brand */}
              <div className="flex shrink-0 items-center gap-3">
                {/* <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" /> */}
                <span className="text-base font-semibold capitalize">
                  {appName()}
                </span>
              </div>

              {/* Right Actions */}
              <div className="ml-auto flex items-center gap-3">
                <Button
                  className="hidden sm:block"
                  onClick={toggleTheme}
                  variant="outline"
                  size="sm"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <IconSun className="size-4" />
                  ) : (
                    <IconMoon className="size-4" />
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={logout}
                  id="logout-button"
                  aria-label="Logout"
                >
                  <IconLogout className="size-4" /> Logout
                </Button>

                <SidebarTrigger />
              </div>
            </div>

            {subNavItems?.length ? <SubNav navMenu={subNavItems} /> : null}
          </header>

          {/* Main Content */}
          <main className="page-transition relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 pt-5 pb-3">
            {/* You can use Breadcrumb component here */}
            <Breadcrumb />

            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
