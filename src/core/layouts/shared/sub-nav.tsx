import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconAlertCircle, type TablerIcon } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import React from "react";

import { cn } from "@/lib/utils";

export type TNav = {
  title: string;
  icon?: TablerIcon;
  path?: string;
  parent?: string;
  priority?: number | (() => number);
};

export function SubNav({
  navMenu,
  compact,
}: {
  navMenu: TNav[];
  /** Mobile-only: for exactly 2 items, render the first as a main pill and the
   *  rest as small side icon buttons instead of an equal-width tab strip. */
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const tabRef = React.useRef<HTMLDivElement>(null);

  const { tenantId, activeParent } = React.useMemo(() => {
    const [tenantId, activeParent] = location.pathname
      .split("/")
      .filter(Boolean);

    return {
      tenantId,
      activeParent,
    };
  }, [location.pathname]);

  const activeTab = React.useMemo(() => {
    if (!tenantId || !activeParent) return "";

    return (
      navMenu.find((nav) =>
        location.pathname.startsWith(`/${tenantId}/${activeParent}/${nav.path}`)
      )?.path ?? ""
    );
  }, [tenantId, activeParent, location.pathname, navMenu]);

  React.useEffect(() => {
    if (!activeTab) return;
    setTimeout(() => {
      const frame = requestAnimationFrame(() => {
        const triggerEl = tabRef.current?.querySelector(
          `button[data-value="${CSS.escape(activeTab)}"]`,
        ) as HTMLElement | null;

        triggerEl?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      });

      return () => cancelAnimationFrame(frame);
    }, 500);
  }, [activeTab]);

  if (!tenantId || !activeParent) return null;

  const go = (path?: string) =>
    navigate(`/${tenantId}/${activeParent}/${path}`, { viewTransition: true });

  // Mobile compact: one item is the main tab; the "subscriptions" item becomes a
  // single toggle button that redirects to that section (and back).
  if (compact && navMenu.length === 2) {
    const side = navMenu.find((n) =>
      /subscription/i.test(`${n.path}${n.title}`)
    ) ??
      navMenu[1];
    const main = navMenu.find((n) => n !== side) ?? navMenu[0];
    const MainIcon = main.icon ?? IconAlertCircle;
    const SideIcon = side.icon ?? IconAlertCircle;
    const onSide = activeTab === side.path;

    return (
      <div className="flex w-full items-center gap-2">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold text-foreground">
          <MainIcon className="size-4 shrink-0" />
          <span className="truncate">{t(main.title)}</span>
        </div>

        <button
          type="button"
          onClick={() => go(onSide ? main.path : side.path)}
          aria-label={t(side.title)}
          aria-pressed={onSide}
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
            onSide
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <SideIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <Tabs
      ref={tabRef}
      value={activeTab ?? ""}
      onValueChange={(path) => {
        navigate(`/${tenantId}/${activeParent}/${path}`, {
          viewTransition: true,
        });
      }}
      className="no-scrollbar overflow-x-auto scroll-mask-x-from-90%"
    >
      <TabsList variant="line" className="gap-x-3">
        {navMenu.map((nav) => (
          <TabsTrigger
            key={nav.title}
            value={nav.path}
            data-value={nav.path}
            className="group-data-[variant=line]/tabs-list:data-active:after:rounded-xl px-0"
          >
            {nav.icon ? <nav.icon /> : <IconAlertCircle />}
            {t(nav.title)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
