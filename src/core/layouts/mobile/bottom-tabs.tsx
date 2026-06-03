import React from "react"
import { Link, useLocation } from "react-router"
import { IconAlertCircle, type TablerIcon } from "@tabler/icons-react"
import { cva, type VariantProps } from "class-variance-authority"

import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"
import { allowDisplayRoute } from "@/core/lib/utils"
import { cn } from "@/lib/utils"
import { MoreSheet } from "./more-sheet"

export type TNav = {
  title: string
  icon?: TablerIcon
  path?: string
}

/** Number of primary tabs shown before the "More" tab. */
const MAX_TABS = 4

const bottomTabsVariants = cva(
  "fixed bottom-0 z-50 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80",
  {
    variants: {
      variant: {
        default:
          "inset-x-0 border-t border-border pb-[env(safe-area-inset-bottom)]",
        floating:
          "inset-x-0 mx-auto mb-[max(1rem,env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function useNavItems() {
  const { router } = useLayout()

  return React.useMemo(() => {
    const items: TNav[] = []

    for (const route of router.routes as TRouteObject[]) {
      if (!allowDisplayRoute(route.display)) continue

      for (const child of route.children ?? []) {
        if (!allowDisplayRoute(child.display)) continue

        items.push({
          title: child.name || "Unnamed Route",
          icon: child.icon,
          path: child.path,
        })
      }
    }

    return items
  }, [router.routes])
}

function TabLink({ item, active }: { item: TNav; active: boolean }) {
  const Icon = item.icon ?? IconAlertCircle

  return (
    <Link
      to={item.path || "#"}
      viewTransition
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="max-w-full truncate text-[11px] leading-none font-medium">
        {item.title}
      </span>
    </Link>
  )
}

export function BottomTabs({
  variant,
}: VariantProps<typeof bottomTabsVariants>) {
  const location = useLocation()
  const navItems = useNavItems()

  const { primary, overflow } = React.useMemo(
    () => ({
      primary: navItems.slice(0, MAX_TABS),
      overflow: navItems.slice(MAX_TABS),
    }),
    [navItems]
  )

  const activeParent = React.useMemo(() => {
    const [, parent] = location.pathname.split("/").filter(Boolean)
    return parent
  }, [location.pathname])

  return (
    <nav className={cn(bottomTabsVariants({ variant }))}>
      <div className="mx-auto flex h-16 w-full max-w-3xl items-stretch">
        {primary.map((item) => (
          <TabLink
            key={item.title}
            item={item}
            active={!!item.path && activeParent === item.path}
          />
        ))}
        <MoreSheet
          overflowItems={overflow}
          activeParent={activeParent}
        />
      </div>
    </nav>
  )
}
