/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { createBrowserRouter } from "react-router";
import { Toaster } from "sonner";

import { Layout as NavbarLayout } from "@/core/layouts/navbar";
import { Layout as MobileLayout } from "@/core/layouts/mobile";
import { Layout as SidebarLayout } from "@/core/layouts/sidebar";
// import Sheets from "@/components/globalSheet"

export interface ILayoutContext {
  router: ReturnType<typeof createBrowserRouter>;
}

const LayoutContext = React.createContext<ILayoutContext | null>(null);

export interface ILayoutProps {
  layout?: React.ComponentType<{
    children: React.ReactNode;
  }>;
  router: ReturnType<typeof createBrowserRouter>;
  children: React.ReactNode;
}

export function LayoutProvider({ children, layout, router }: ILayoutProps) {
  const Layout = layout ??
    (() => {
      switch (import.meta.env.VITE_APP_LAYOUT) {
        case "mobile":
          return MobileLayout;

        case "sidebar":
          return SidebarLayout;

        default:
          return NavbarLayout;
      }
    })();

  return (
    <LayoutContext.Provider value={{ router }}>
      <Layout>{children}</Layout>

      {
        /* Global sheet host (cart, shipping info, etc.) — mounted once here so
          SheetRef works on every page, not just inside the store shell. */
      }
      {/* <Sheets /> */}

      <Toaster
        theme={"light"}
        position="bottom-center"
        toastOptions={{
          className: "!items-start !gap-3 !rounded-4xl !p-5",
          classNames: {
            icon: "[&>svg]:!size-7 [&>svg]:mt-2",
            title: "!text-lg",
            description: "!text-sm !text-muted-foreground",
            actionButton: "!p-4 !h-6 !rounded-full capitalize",
          },
        }}
      />
    </LayoutContext.Provider>
  );
}

export const useLayout = () => {
  const context = React.useContext(LayoutContext);

  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }

  return context;
};
