import { ThunderSDK } from "thunder-sdk";
import { upload } from "@imagekit/react";
import Package from "../../../package.json";

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
  url?: string | null,
  opts?: { width: number; height: number },
) {
  return [url, `?tr=w-${opts?.width ?? 100},h-${opts?.height ?? 100}`].join("");
}

export function getInitials(name?: string) {
  const [first, ...last] = name || "unamed";
  return !last
    ? first.substring(0, 2).toUpperCase()
    : `${first[0].toUpperCase()}${last[0].toUpperCase()}`;
}

export const handleDelete = async (url: string) => {
  return await ThunderSDK.imageKit.deleteFile({
    body: { url },
  });
}

export function resolveUrl(path?: string) {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
    .toString()
    .replace(/\/$/, "");

  if (path) {
    return [baseUrl, path.trim().replace(/^\//, "")].join("/");
  }

  return baseUrl;
}

export function getAuthUrl() {
  return new URL(
    "/auth?returnUri=" + window.location.href,
    import.meta.env.VITE_API_BASE_URL || window.location.origin,
  );
}

export function formatDateForInput(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}