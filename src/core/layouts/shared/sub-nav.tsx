import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconAlertCircle, type TablerIcon } from "@tabler/icons-react";
import { useLocation, useNavigate } from "react-router";
import React from "react";

export type TNav = {
  title: string;
  icon?: TablerIcon;
  path?: string;
  parent?: string;
  index?: number | (() => number);
};

export function SubNav({ navMenu }: { navMenu: TNav[] }) {
  const navigate = useNavigate();
  const location = useLocation();
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
            {nav.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
