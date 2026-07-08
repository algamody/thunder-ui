import { Link, useLocation } from "react-router"
import {
  Breadcrumb as _Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"
import { IconBrandGoogleHome } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useLayout } from "@/core/layouts/layout-provider"
import type { TRouteObject } from "@/core/router"

type TBreadcrumbState = {
  name?: string
}

/**
 * Walks the route tree and builds a map of static path segment -> route name.
 * Dynamic segments (":id", ":tenant", etc.) are skipped since they don't
 * carry a translatable name.
 */
function buildSegmentNameMap(routes: TRouteObject[]): Record<string, string> {
  const map: Record<string, string> = {}

  const walk = (nodes: TRouteObject[]) => {
    nodes.forEach((node) => {
      if (node.path && !node.path.startsWith(":") && node.name) {
        // route.path can itself contain nested segments, only take the last one
        const segment = node.path.split("/").filter(Boolean).at(-1)
        if (segment) map[segment] = node.name
      }
      if (node.children) walk(node.children as TRouteObject[])
    })
  }

  walk(routes)
  return map
}

export function Breadcrumb() {
  const location = useLocation()
  const { router } = useLayout()
  const { t } = useTranslation()

  const parts = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  )

  const segmentNameMap = React.useMemo(
    () => buildSegmentNameMap(router.routes as TRouteObject[]),
    [router.routes]
  )

  if (parts.length <= 1) return null
  const state = location.state as TBreadcrumbState | null

  const lastPart = parts.at(-1)!
  const lastLabel = state?.name
    ? t(state.name)
    : t(segmentNameMap[lastPart] ?? lastPart)

  const crumbs = parts.slice(0, -1)

  return (
    <_Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const to = "/" + parts.slice(0, index + 1).join("/")

          return (
            <React.Fragment key={to}>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link to={to} replace viewTransition />}
                >
                  {index === 0 ? (
                    <IconBrandGoogleHome className="size-4" />
                  ) : (
                    t(segmentNameMap[crumb] ?? crumb)
                  )}
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
            </React.Fragment>
          )
        })}

        <BreadcrumbItem>
          <BreadcrumbPage>{lastLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </_Breadcrumb>
  )
}