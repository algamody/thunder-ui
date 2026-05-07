import {
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/core/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import React from "react"
import { Spinner } from "@/components/ui/spinner"
import { IconUser, IconX } from "@tabler/icons-react"

export function AvatarUpload({
  onUpload,
  onRemove,
  initialFile,
  showCancel = true,
  ...props
}: {
  showCancel?: boolean
  initialFile?: FileMetadata
  onUpload: (file: FileWithPreview, signal: AbortSignal) => Promise<void>
  onRemove?: () => void
} & React.ComponentProps<"input">) {
  const [busy, setBusy] = React.useState(false)
  const signalRef = React.useRef<AbortController>(null)

  const [
    { files, isDragging },
    {
      removeFile,
      openFileDialog,
      getInputProps,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
    },
  ] = useFileUpload({
    initialFiles: initialFile && [initialFile],
    multiple: false,
    maxSize: 5 * 1024 * 1024,
    accept: "image/*",
  })

  const file = files[0]
  const previewUrl = file?.preview || null

  React.useEffect(() => {
    if (file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusy(true)
      signalRef.current = new AbortController()
      onUpload(file, signalRef.current.signal).finally(() => setBusy(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  return (
    <>
      {/* Drop area */}
      <div className="relative max-w-fit">
        <button
          aria-label={previewUrl ? "Change image" : "Upload image"}
          className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-input transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none data-[dragging=true]:bg-accent/50"
          data-dragging={isDragging || undefined}
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          type="button"
          disabled={busy}
        >
          {busy ? (
            <Spinner />
          ) : previewUrl ? (
            <img
              alt={files[0]?.file?.name || "Uploaded image"}
              className="size-full object-cover"
              height={64}
              src={previewUrl}
              style={{ objectFit: "cover" }}
              width={64}
            />
          ) : (
            <div aria-hidden="true">
              <IconUser className="size-4 opacity-60" />
            </div>
          )}
        </button>
        {previewUrl && showCancel && (
          <Button
            aria-label="Remove image"
            size="icon-xs"
            className="absolute -top-1 -right-1"
            onClick={() => {
              removeFile(files[0]?.id)
              signalRef.current?.abort()
              onRemove?.()
            }}
          >
            <IconX className="size-3.5" />
          </Button>
        )}
      </div>
      <input
        {...props}
        {...getInputProps()}
        aria-label="Upload image file"
        className="sr-only"
        tabIndex={-1}
        disabled={busy}
      />
    </>
  )
}
