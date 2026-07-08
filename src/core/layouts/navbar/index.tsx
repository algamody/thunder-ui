import { Breadcrumb } from "@/core/layouts/shared/breadcrumb"
import { useLayout } from "@/core/layouts/layout-provider"
import { useTheme } from "@/components/theme-provider"
import {
  IconArrowsExchange,
  IconCheck,
  IconDotsVertical,
  IconLogout,
  IconMenu2,
  IconMoon,
  IconNotification,
  IconSun,
  IconUserCircle,
  IconWorld,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import LogoDark from "/logo-dark.png"
import LogoLight from "/logo-light.png"
import { Link, useLocation, useNavigate } from "react-router"
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
import { appName, getNavRoutes } from "@/core/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useIsMobile } from "@/hooks/use-mobile"
import { use } from "@/core/hooks/use"
import { getAuthUrl, getInitials, transformImage } from "@/core/lib/utils"
import { useLogout } from "@/core/protected"
import { SubNav } from "../shared/sub-nav"
import { ThunderSDK } from "thunder-sdk"
import { Container } from "@/core/custom/Container"
import { useTranslation } from "react-i18next"

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
  const navigate = useNavigate()
  const { router } = useLayout()
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()
  const isMobile = useIsMobile()
  const logout = useLogout()
  const { t, i18n } = useTranslation()

  const isRtl = i18n.language === "ar"

  const _me = React.useCallback(
    async ({ signal }: { signal?: AbortSignal }) => {
      return await ThunderSDK.me.get({ signal })
    },
    []
  )

  const { data: me } = use(_me)

  const { routes, subRoutes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes]
  )

  const [, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes]
  )

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleNavigate = React.useCallback(
    (path: string) => {
      setTimeout(() => navigate(path, { viewTransition: true }), 300)
    },
    [navigate, isMobile]
  )

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar
        side={isRtl ? "right" : "left"}
        collapsible="icon"
        variant="floating"
        className="bg-background"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-md py-0! ring-transparent group-data-[collapsible=icon]:size-8! hover:bg-transparent! group-data-[collapsible=icon]:[&>img]:block">
                <img
                  src={resolvedTheme === "dark" ? LogoDark : LogoLight}
                  alt="Logo"
                  className="hidden h-5 w-auto shrink-0"
                />
                <span className="text-base font-semibold">
                  {t("Main Menu")}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMenu items={routes} onChange={handleNavigate} />
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
                      <div className="grid flex-1 text-start text-sm leading-tight">
                        <span className="truncate font-medium">{me?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {me?.email}
                        </span>
                      </div>
                      <IconDotsVertical className="ms-auto size-4" />
                    </SidebarMenuButton>
                  }
                ></DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : isRtl ? "left" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={transformImage(me?.image)}
                            alt={me?.name}
                          />
                          <AvatarFallback className="rounded-lg">
                            {getInitials(me?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-start text-sm leading-tight">
                          <span className="truncate font-medium">
                            {me?.name ?? "Unamed"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {me?.email ?? "N/A"}
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
                      {t("Account")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link to="/select-tenant/#list" />}
                    >
                      <IconArrowsExchange className="size-4" />
                      {t("Change tenant")}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconNotification className="size-4" />
                      {t("Notifications")}
                    </DropdownMenuItem>

                    {/* language sub menu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <IconWorld className="size-4" />
                        {t("Language")}
                      </DropdownMenuSubTrigger>

                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>

                          <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                            <span className="flex-1">{t("English")}</span>
                            {i18n.language === "en" && <IconCheck className="size-4" />}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => i18n.changeLanguage("ar")}>
                            <span className="flex-1">{t("Arabic")}</span>
                            {i18n.language === "ar" && <IconCheck className="size-4" />}
                          </DropdownMenuItem>

                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>



                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={logout}>
                      <IconLogout className="size-4" />
                      {t("Log out")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="h-svh overflow-hidden md:p-2">
        <div className="@container/main relative flex h-full w-full flex-1 flex-col gap-2 rounded-xl border-border xl:border">
          <Container as="header">
            <div className="mx-auto flex items-center gap-3 py-2">
              {/* Logo / Brand */}
              <div className="flex shrink-0 items-center gap-3">
                {/* <img src={Logo} alt="Logo" className="h-5 w-auto shrink-0" /> */}
                <span className="text-base font-semibold capitalize">
                  {appName()}
                </span>
              </div>

              {/* Right Actions */}
              <div className="ms-auto flex items-center gap-3">
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  size="icon"
                  aria-label="Toggle theme"
                >
                  {resolvedTheme === "dark" ? (
                    <IconSun className="size-4" />
                  ) : (
                    <IconMoon className="size-4" />
                  )}
                </Button>

                <Button
                  className="hidden md:inline-flex"
                  variant="destructive"
                  onClick={logout}
                  aria-label="Logout"
                >
                  <IconLogout className="size-4" />
                  {t("Logout")}
                </Button>
                <Button
                  className="inline-flex md:hidden"
                  variant="destructive"
                  onClick={logout}
                  size={"icon"}
                  aria-label="Logout"
                >
                  <IconLogout className="size-4" />
                </Button>

                <SidebarTrigger />
              </div>
            </div>

            {subNavItems && (subNavItems?.length ?? 0) > 1 ? <SubNav navMenu={subNavItems} /> : null}
          </Container>

          {/* Main Content */}
          <main className="page-transition relative mx-auto flex min-h-0 w-full flex-1 flex-col gap-3 pb-3">
            {/* You can use Breadcrumb component here */}
            <Container>
              <Breadcrumb />
            </Container>

            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}