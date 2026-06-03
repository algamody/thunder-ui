import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router"
import { AuthProvider } from "react-oidc-context"

/** You can change the following layout from "sidebar" to some other layout */
import { Layout } from "@/core/layouts/mobile"
import { LayoutProvider } from "@/core/layouts/layout-provider"

/** Create a router with the core routes as the child routes of the root path */
import { coreRoutes, type TRouteObject } from "@/core/router"
import { Protected } from "@/core/protected"
import { LoadingProvider } from "@/core/context/LoaderProvider"
import { SelectTenant } from "@/core/pages/tenant/select-tenant"
import { NotFound } from "./core/layouts/shared/not-found"
import { resolveUrl } from "./core/lib/utils"

const router = createBrowserRouter(
  [
    {
      name: "Root",
      path: "/",
      display: false,
      Component: () => (
        <Protected>
          <Outlet />
        </Protected>
      ),
      errorElement: <NotFound />,
      children: [
        {
          index: true,
          Component: () => <Navigate to="/select-tenant" />,
        },
        {
          path: "select-tenant",
          Component: () => <SelectTenant />,
        },
      ],
    },
    {
      name: "App",
      path: "/:tenant",
      Component: () => (
        <Protected>
          <LayoutProvider layout={Layout} router={router}>
            <Outlet />
          </LayoutProvider>
        </Protected>
      ),
      children: coreRoutes,
    },

    // You can add your custom routes here, they will not be affected by the core routes
  ] as TRouteObject[],
  {
    basename: import.meta.env.BASE_URL,
  }
)

export function App() {
  const currentUri = resolveUrl().toString()
  const children = <RouterProvider router={router} />

  return (
    <LoadingProvider>
      {import.meta.env.VITE_OAUTH_CLIENT_ID ? (
        <AuthProvider
          authority={
            import.meta.env.VITE_OAUTH_SERVER_URL || window.location.origin
          }
          client_id={import.meta.env.VITE_OAUTH_CLIENT_ID}
          redirect_uri={currentUri + window.location.search}
          scope={import.meta.env.VITE_OAUTH_SCOPE}
          post_logout_redirect_uri={currentUri}
          onSigninCallback={() => {
            const url = new URL(window.location.href)

            url.searchParams.delete("code")
            url.searchParams.delete("state")
            url.searchParams.delete("session_state")
            url.searchParams.delete("iss")

            window.history.replaceState(
              {},
              document.title,
              url.pathname + url.search + url.hash
            )
          }}
        >
          {children}
        </AuthProvider>
      ) : (
        children
      )}
    </LoadingProvider>
  )
}

export default App
