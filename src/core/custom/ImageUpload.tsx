import {
  useFileUpload,
  formatBytes,
  type FileMetadata,
  type FileWithPreview,
} from "@/core/hooks/use-file-upload"
import { Button } from "@/components/ui/button"
import React from "react"
import { Spinner } from "@/components/ui/spinner"
import { IconPhoto, IconUpload, IconX, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"

export function ImageUpload({
  onUpload,
  onRemove,
  multi = false,
  initialFile,
  initialFiles,
  ...props
}: {
  multi?: boolean
  initialFile?: FileMetadata
  initialFiles?: FileMetadata[]
  onUpload: (file: FileWithPreview, signal: AbortSignal) => Promise<void>
  onRemove?: (id: string) => void
} & React.ComponentProps<"input">) {
  const [busy, setBusy] = React.useState(false)
  const signalRef = React.useRef<AbortController>(null)

  const initFiles = React.useMemo(() => {
    if (initialFiles?.length) return initialFiles
    if (initialFile) return [initialFile]
    return []
  }, [initialFile, initialFiles])

  const MAX_SIZE = 2 * 1024 * 1024
  const MAX_SIZE_LABEL = formatBytes(MAX_SIZE)

  const [
    { files, isDragging, errors },
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
    initialFiles: initFiles.length ? initFiles : undefined,
    multiple: multi,
    maxSize: MAX_SIZE,
    accept: "image/*",
    onFilesAdded: (addedFiles) => {
      for (const f of addedFiles) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBusy(true)
        signalRef.current = new AbortController()
        onUpload(f, signalRef.current.signal).finally(() => setBusy(false))
      }
    },
  })


  // Show toast when file validation errors occur (e.g. file too large)
  React.useEffect(() => {
    if (errors.length > 0) {
      toast.error(errors[0])
    }
  }, [errors])

  // Show a reminder toast when user drags a file over the drop zone
  const dragToastShown = React.useRef(false)
  const handleDragEnterWithAlert = (e: React.DragEvent<HTMLElement>) => {
    handleDragEnter(e)
    if (!dragToastShown.current) {
      dragToastShown.current = true
      toast.info(`Maximum file size is ${MAX_SIZE_LABEL}`, { duration: 2000 })
    }
  }
  const handleDragLeaveWithReset = (e: React.DragEvent<HTMLElement>) => {
    handleDragLeave(e)
    // Only reset when truly leaving the container, not when crossing child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      dragToastShown.current = false
    }
  }
  const handleDropWithReset = (e: React.DragEvent<HTMLElement>) => {
    handleDrop(e)
    dragToastShown.current = false
  }

  if (multi) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
            >
              {f.preview ? (
                <img
                  src={f.preview}
                  alt={f.file?.name ?? "uploaded"}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <IconPhoto className="size-5 opacity-40" />
                </div>
              )}
              <Button
                type="button"
                aria-label="Remove image"
                size="icon-xs"
                className="absolute -top-1 -end-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  removeFile(f.id)
                  onRemove?.(f.id)
                  signalRef.current?.abort()
                }}
              >
                <IconX className="size-3.5" />
              </Button>
            </div>
          ))}

          {/* Add-more card */}
          <button
            type="button"
            className="flex size-20 items-center justify-center rounded-lg border border-dashed border-input transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging=true]:bg-accent/50"
            onClick={openFileDialog}
            onDragEnter={handleDragEnterWithAlert}
            onDragLeave={handleDragLeaveWithReset}
            onDragOver={handleDragOver}
            onDrop={handleDropWithReset}
            data-dragging={isDragging || undefined}
            disabled={busy}
          >
            {busy ? (
              <Spinner />
            ) : (
              <IconUpload className="size-4 opacity-60" />
            )}
          </button>
        </div>

        <input
          {...props}
          {...getInputProps()}
          aria-label="Upload image files"
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
        />

        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <IconInfoCircle className="size-3 shrink-0" />
          Max file size: {MAX_SIZE_LABEL}
        </p>
      </div>
    )
  }

  const file = files[0]
  const previewUrl = file?.preview || null

  return (
    <>
      <button
        type="button"
        aria-label={previewUrl ? "Change image" : "Upload image"}
        className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-input transition-colors outline-none hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[img]:border-none data-[dragging=true]:bg-accent/50"
        data-dragging={isDragging || undefined}
        onClick={openFileDialog}
        onDragEnter={handleDragEnterWithAlert}
        onDragLeave={handleDragLeaveWithReset}
        onDragOver={handleDragOver}
        onDrop={handleDropWithReset}
        disabled={busy}
      >
        {busy ? (
          <Spinner />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={file?.file?.name ?? "Uploaded image"}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1" aria-hidden="true">
            <IconPhoto className="size-6 opacity-40" />
            <span className="text-xs text-muted-foreground">
              Click to upload or drag and drop
            </span>
            <span className="text-[11px] text-muted-foreground/70">
              Max file size: {MAX_SIZE_LABEL}
            </span>
          </div>
        )}
      </button>

      {previewUrl && (
        <div className="mt-1 flex justify-end">
          <Button
            type="button"
            aria-label="Remove image"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => {
              removeFile(file!.id)
              onRemove?.(file!.id)
              signalRef.current?.abort()
            }}
          >
            <IconX className="me-1 size-3" />
            Remove
          </Button>
        </div>
      )}

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