import {
  type FileMetadata,
  type FileWithPreview,
  useFileUpload,
} from "@/core/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import React from "react";
import { Spinner } from "@/components/ui/spinner";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";

export function ImageUpload({
  onUpload,
  onRemove,
  multi = false,
  initialFiles,
  ...props
}: {
  multi?: boolean;
  initialFiles?: FileMetadata[];
  onUpload: (file: FileWithPreview, signal: AbortSignal) => Promise<void>;
  onRemove?: (url: string) => Promise<void>;
} & React.ComponentProps<"input">) {
  const [busy, setBusy] = React.useState(false);
  const signalRef = React.useRef<AbortController>(null);

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
    initialFiles: initialFiles?.length ? initialFiles : undefined,
    multiple: multi,
    maxSize: 5 * 1024 * 1024,
    accept: "image/*",
    onFilesAdded: (addedFiles) => {
      for (const f of addedFiles) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBusy(true);
        signalRef.current = new AbortController();
        onUpload(f, signalRef.current.signal).finally(() => setBusy(false));
      }
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
          >
            {file.preview
              ? (
                <img
                  src={file.preview}
                  alt={file.file?.name ?? "uploaded"}
                  className="size-full object-cover"
                />
              )
              : (
                <div className="flex size-full items-center justify-center">
                  <IconPhoto className="size-5 opacity-40" />
                </div>
              )}
            <Button
              type="button"
              aria-label="Remove image"
              size="icon-xs"
              className="absolute -top-1 -right-1 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={async () => {
                signalRef.current?.abort();
                const fileUrl = "url" in file.file
                  ? file.file.url
                  : (file.file as any).url;
                await onRemove?.(fileUrl);
                removeFile(file.id);
              }}
            >
              <IconX className="size-3.5" />
            </Button>
          </div>
        ))}

        <button
          type="button"
          className="flex size-20 items-center justify-center rounded-lg border border-dashed border-input transition-colors hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[dragging=true]:bg-accent/50"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          disabled={busy}
        >
          {busy ? <Spinner /> : <IconUpload className="size-4 opacity-60" />}
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
    </div>
  );
}
