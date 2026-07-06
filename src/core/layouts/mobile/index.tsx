import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { IconArrowLeft, IconSettings } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { getNavRoutes } from "@/core/lib/utils";
import { BottomTabs } from "./bottom-tabs";
import { SubNav } from "../shared/sub-nav";
import { useLayout } from "../layout-provider";
import { Container } from "@/core/custom/Container";
import { cn } from "@/lib/utils";
// import { ShippingBanner } from "@/store/customer/shipping-banner"

export function Layout({ children }: { children: React.ReactNode }) {
  const { router } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();

  const { subRoutes } = React.useMemo(
    () => getNavRoutes(router.routes),
    [router.routes],
  );

  const [tenantId, activeParent] = React.useMemo(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname],
  );

  const subNavItems = React.useMemo(
    () => subRoutes[activeParent],
    [activeParent, subRoutes],
  );

  const isHome = !activeParent || activeParent === "overview";
  const logoSrc = `${import.meta.env.BASE_URL}${
    resolvedTheme === "dark" ? "logo-dark.png" : "logo-light.png"
  }`;

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <header
        className={cn(
          "sticky top-0 z-40 bg-background/95 pt-safe-t backdrop-blur-sm supports-backdrop-filter:bg-background/80",
          !subNavItems?.length && "border-b border-border",
        )}
      >
        <Container className="relative flex h-14 items-center justify-between">
          {/* leading — back on sub-pages, spacer on home */}
          {isHome ? <span className="size-9" /> : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label={t("Back")}
            >
              <IconArrowLeft className="rtl:rotate-180" />
            </Button>
          )}

          {/* centered logo */}
          <Link
            to="overview"
            aria-label={t("Doze")}
            className="absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
          >
            <img src={logoSrc} alt={t("Doze")} className="h-7 w-auto" />
          </Link>

          {/* trailing — settings (hidden while already on settings) */}
          {activeParent === "settings" ? <span className="size-9" /> : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate(`/${tenantId}/settings`, { viewTransition: true })}
              aria-label={t("Settings")}
            >
              <IconSettings className="size-5" />
            </Button>
          )}
        </Container>

        {subNavItems?.length
          ? (
            <Container className="flex items-center gap-3 px-4 pt-0 pb-3">
              <SubNav navMenu={subNavItems} compact />
            </Container>
          )
          : null}
      </header>

      {/* {isHome ? <ShippingBanner /> : null} */}

      <main className="page-transition relative flex min-h-0 w-full flex-1 flex-col gap-3 pb-[calc(5rem+var(--spacing-safe-b))]">
        {children}
      </main>

      <BottomTabs variant="floating" />
      {/* change to "default" for the full-width bar */}
    </div>
  );
}
