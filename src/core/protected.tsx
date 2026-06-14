/* eslint-disable react-refresh/only-export-components */
import { Button } from "@/components/ui/button"
import React from "react"
import { ThunderSDK } from "thunder-sdk"
import { LoadingScreen } from "./custom/LoadingScreen"
import { IconBug, IconLoader, IconLogin } from "@tabler/icons-react"
import { useNavigate, useParams } from "react-router"
import { refreshThunder } from "./lib/thunder"
import { getAuthUrl } from "./lib/utils"
import { isAxiosError } from "axios"
import { useAuth, useOptionalAuth } from "./context/AuthProvider"
import { useLoading } from "./context/LoaderProvider"
import { Spinner } from "@/components/ui/spinner"

function ProtectedWithOAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const auth = useAuth()
  const { isLoading, setLoading } = useLoading()
  const logout = useLogout()

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      ThunderSDK.plugins.essentials.registerAuthInterceptors(
        async () => auth.user?.access_token ?? null,
        async () => {
          await auth.userManager.signinSilent()
        }
      )

      ThunderSDK.plugins.essentials
        .registerPermissions()
        .then(() => {
          setReady(true)
        })
        .catch((error) => {
          setError(error)
        })
    }

    return () => {
      ThunderSDK.plugins.essentials.unregisterAuthInterceptors()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated])

  const systemError = auth.error ?? error
  const requireSignIn = !auth.isAuthenticated && !auth.isLoading && !systemError
  const loadingPermissions = !requireSignIn && !ready

  const handleSignIn = () => {
    setLoading(true)
    auth.userManager.signinRedirect().finally(() => setLoading(false))
  }

  const handleLogout = async () => {
    await logout()

    setReady(false)
  }

  const handleSignInAgain = () => {
    handleLogout()
    handleSignIn()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (requireSignIn) {
    return (
      <LoadingScreen
        title="Sign in to continue"
        icon={IconLogin}
        description="Click the following button to sign into your account"
      >
        <Button onClick={handleSignIn}>
          {isLoading && <Spinner />}
          Sign In
        </Button>
      </LoadingScreen>
    )
  }

  if (systemError) {
    return (
      <LoadingScreen
        title="Something went wrong!"
        icon={IconBug}
        description={
          systemError?.message ??
          "An unexpected error has been encountered! Please contact support."
        }
      >
        <Button variant="outline" onClick={handleSignInAgain}>
          {isLoading && <Spinner />} Sign in again?
        </Button>
        <Button onClick={handleRefresh}>Retry</Button>
      </LoadingScreen>
    )
  }

  if (loadingPermissions)
    return (
      <LoadingScreen
        title="Getting things ready!"
        icon={IconLoader}
        description="We are loading your permissions..."
      >
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </LoadingScreen>
    )

  return children
}

function ProtectedWithSession({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false)
  const [loggedIn, setLoggedIn] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  const navigate = useNavigate()

  const sessionIsLoggedIn = React.useCallback(async () => {
    try {
      const res = await fetch(
        new URL(
          "/auth/api/get-session",
          import.meta.env.VITE_API_BASE_URL || window.location.origin
        )
      )

      return (await res.json()) !== null
    } catch {
      // Ignore errors
    }

    return false
  }, [])

  React.useEffect(() => {
    void (async () => {
      if (await sessionIsLoggedIn()) {
        void ThunderSDK.plugins.essentials
          .registerPermissions()
          .then(() => {
            setReady(true)
          })
          .catch(async (error) => {
            if (isAxiosError(error) && error.response?.status === 403) {
              await navigate("/select-tenant/#list")

              return
            }

            setError(error)
          })
      } else {
        setLoggedIn(false)
      }
    })()
  }, [navigate, sessionIsLoggedIn])

  if (!loggedIn) {
    return (
      <LoadingScreen
        title="Sign in to continue"
        icon={IconLogin}
        description="Click the following button to sign into your account"
      >
        <Button
          onClick={() => {
            window.location.href =
              "/auth?redirect=" + (import.meta.env.BASE_URL || "/")
          }}
        >
          Sign In
        </Button>
      </LoadingScreen>
    )
  }

  const gotoAccount = () => {
    const authUrl = getAuthUrl()

    authUrl.searchParams.set("returnUri", window.location.href)

    window.location.href = authUrl.toString()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (error) {
    return (
      <LoadingScreen
        title="Something went wrong!"
        icon={IconBug}
        description={
          error?.message ??
          "An unexpected error has been encountered! Please contact support."
        }
      >
        <Button variant="outline" onClick={gotoAccount}>
          Goto Account
        </Button>
        <Button onClick={handleRefresh}>Retry</Button>
      </LoadingScreen>
    )
  }

  if (!ready)
    return (
      <LoadingScreen
        title="Getting things ready!"
        icon={IconLoader}
        description="We are loading your permissions..."
      ></LoadingScreen>
    )

  return children
}

export function Protected({ children }: { children: React.ReactNode }) {
  const { tenant } = useParams<{ tenant: string }>()

  React.useEffect(() => {
    if (tenant) ThunderSDK.plugins.essentials.setTenant(tenant)

    return () => ThunderSDK.plugins.essentials.removeTenant()
  }, [tenant])

  return import.meta.env.VITE_OAUTH_CLIENT_ID ? (
    <ProtectedWithOAuth>{children}</ProtectedWithOAuth>
  ) : (
    <ProtectedWithSession>{children}</ProtectedWithSession>
  )
}

export function useLogout() {
  const auth = useOptionalAuth()

  return async () => {
    if (import.meta.env.VITE_OAUTH_CLIENT_ID) {
      auth?.userManager.removeUser()
      auth?.userManager.revokeTokens(["refresh_token", "access_token"])
    } else {
      try {
        await fetch(
          new URL(
            "/auth/api/sign-out",
            import.meta.env.VITE_API_BASE_URL || window.location.origin
          ),
          {
            method: "POST",
            body: "{}",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      } catch {
        // Ignore errors
      }
    }

    await refreshThunder()

    window.location.href = import.meta.env.BASE_URL || "/"
  }
}
