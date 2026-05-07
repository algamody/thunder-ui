import { ThunderSDK } from "thunder-sdk"
import { upload } from "@imagekit/react"

export const handleUpload = async (
  file: File,
  opts?: {
    path?: string | string[]
    filename?: string
    signal?: AbortSignal
    onProgress?: (percentage: number) => void
  }
) => {
  const path = opts?.path instanceof Array ? opts.path.join("/") : opts?.path
  // Authenticate imagekit token
  const { signature, expire, token, publicKey } =
    await ThunderSDK.imageKit.auth()
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
  })
}

export const handleDelete = async (url: string) => {
  return await ThunderSDK.imageKit.deleteFile({
    body: { url },
  });
}

export function transformImage(
  url?: string | null,
  opts?: { width: number; height: number }
) {
  return [url, `?tr=w-${opts?.width ?? 100},h-${opts?.height ?? 100}`].join("")
}

export function getInitials(name?: string) {
  const [first, ...last] = name || "unamed"
  return !last
    ? first.substring(0, 2).toUpperCase()
    : `${first[0].toUpperCase()}${last[0].toUpperCase()}`
}
