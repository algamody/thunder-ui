import { ThunderSDK } from "thunder-sdk";
import { upload } from "@imagekit/react";
import Package from "../../../package.json";
import type { TRouteObject } from "../router";
import type { TNav } from "../layouts/shared/sub-nav";

import { converter, formatHex } from "culori";

export function appName() {
  return Package.name
    .replace("-", " ")
    .split(" ")
    .map((v) => ([2, 3].includes(v.length) ? v.toUpperCase() : v))
    .join(" ");
}

export const handleUpload = async (
  file: File,
  opts?: {
    path?: string | string[];
    filename?: string;
    signal?: AbortSignal;
    onProgress?: (percentage: number) => void;
  },
) => {
  const path = opts?.path instanceof Array ? opts.path.join("/") : opts?.path;
  // Authenticate imagekit token
  const { signature, expire, token, publicKey } = await ThunderSDK.imageKit
    .auth();
  // Call the ImageKit SDK upload function with the required parameters and callbacks.
  return await upload({
    // Authentication parameters
    expire,
    token,
    signature,
    publicKey,
    file,
    fileName: [path?.replace(/^\/|\/$/g, ""), opts?.filename ?? file.name]
      .filter(Boolean)
      .join("/"), // Optionally set a custom file name
    // Progress callback to update upload progress state
    onProgress: (event) =>
      opts?.onProgress?.((event.loaded / event.total) * 100),
    // Abort signal to allow cancellation of the upload if needed.
    abortSignal: opts?.signal,
  });
};

export function transformImage(
  src?: string | null,
  opts?: { width: number; height: number },
) {
  if (src) {
    const tr = `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`;

    try {
      const url = new URL(src);

      url.searchParams.set(
        "tr",
        `w-${opts?.width ?? 100},h-${opts?.height ?? 100}`,
      );

      return url.toString();
    } catch {
      return [src, "?tr=", tr].join("");
    }
  }
}

export function getInitials(name?: string) {
  const [first, ...last] = name || "unamed";
  return !last
    ? first.substring(0, 2).toUpperCase()
    : `${first[0].toUpperCase()}${last[0].toUpperCase()}`;
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "");

  if (path) {
    return new URL([baseUrl, path.trim().replace(/^\//, "")].join("/"));
  }

  return new URL(baseUrl);
}

export function getLocalUrl(path?: string) {
  return resolveUrl(
    [ThunderSDK.plugins.essentials.getTenant(), path?.trim().replace(/^\//, "")]
      .filter(Boolean)
      .join("/"),
  );
}

export function getAuthUrl() {
  return new URL(
    "/auth?returnUri=" + window.location.href,
    import.meta.env.VITE_API_BASE_URL || window.location.origin,
  );
}

export function formatDateForInput(
  value: Date | string | null | undefined,
  time = false,
) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (time) {
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  return `${year}-${month}-${day}`;
}

export function allowDisplayRoute(display?: boolean | (() => boolean)) {
  if (typeof display === "function") return display();
  return display ?? true;
}

export function getRouteSortIndex(
  route?: Pick<TRouteObject, "priority">,
): number {
  const priority = route?.priority;

  if (typeof priority === "number") {
    return Number.isFinite(priority) ? priority : 0;
  }

  if (typeof priority === "function") {
    const result = priority();
    return typeof result === "number" && Number.isFinite(result) ? result : 0;
  }

  return 0;
}

export function sortRoutes<T extends TRouteObject>(routes: T[]): T[] {
  return routes
    .map((route, originalIndex) => ({
      route,
      originalIndex,
      sortIndex: getRouteSortIndex(route),
    }))
    .sort((a, b) => {
      if (a.sortIndex !== b.sortIndex) {
        return a.sortIndex - b.sortIndex;
      }

      return a.originalIndex - b.originalIndex;
    })
    .map(({ route }) => route);
}

export function getNavRoutes(router: TRouteObject[]) {
  const routes: TNav[] = [];
  const subRoutes: TNav[] = [];

  for (const route of sortRoutes(router)) {
    if (!allowDisplayRoute(route.display)) continue;

    const children = sortRoutes((route.children ?? []) as TRouteObject[]);

    for (const child of children) {
      if (!allowDisplayRoute(child.display)) continue;

      const parentPath = child.path ?? "/";

      routes.push({
        title: child.name || "Unnamed Route",
        icon: child.icon,
        path: parentPath,
      });

      const childRoutes = sortRoutes((child.children ?? []) as TRouteObject[]);

      for (const subChild of childRoutes) {
        if (!allowDisplayRoute(subChild.display)) continue;

        subRoutes.push({
          title: subChild.name || "Unnamed Route",
          icon: subChild.icon,
          path: subChild.path,
          parent: parentPath,
        });
      }
    }
  }

  const subRoutesByParent = Object.groupBy(subRoutes, (item) => item.parent!);

  return {
    routes,
    subRoutes: subRoutesByParent,
  };
}

const toRgb = converter("rgb");

export function rgbToHex(oklch: string) {
  const rgb = toRgb(oklch);

  if (!rgb) {
    throw new Error("Invalid OKLCH color");
  }

  return formatHex(rgb);
}

export function isMobileLayout() {
  return ["mobile"].includes(import.meta.env.VITE_APP_LAYOUT);
}
