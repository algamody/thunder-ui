import type { TablerIcon } from "@tabler/icons-react";
import type { TRouteObject } from "./router";

export type TCardProps = {
  isLoading: boolean;
  data: unknown[];
  fetcher: (projection?: Record<string, 1>) => void;
  selectedIds: string[];
  toggleSelect: (id?: string) => void;
};

export type TCardsOverride = Record<
  string,
  React.ComponentType<TCardProps>
>;

export type TListPageProps = { group?: string; name: string };

export type TListPagesOverride = Record<
  string,
  React.ComponentType<TListPageProps>
>;

export type TViewProps = { data: unknown };

export type TViewsOverride = Record<
  string,
  React.ComponentType<TViewProps>
>;

export type TFormsOverride = Record<string, React.ComponentType>;

export type TIconsOverride = Record<string, TablerIcon>;

export type TRoutesOverride = Record<
  string,
  TRouteObject & { merge?: boolean }
>;
