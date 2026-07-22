"use client";

import { IconCheck , IconCopy  } from "@tabler/icons-react";
import { useState } from "react";
import { ActionSwapIcon } from "@/core/pages/wallet/action-swap";
import { cn } from "@/lib/utils";

/**
 * Copies `value` to the clipboard and swaps the copy icon for a check via the
 * library's ActionSwapIcon. Stops click propagation so it can sit inside a
 * selectable row.
 */
export function CopyButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard may be unavailable (insecure context) — swap anyway
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy address"}
      onClick={(e) => {
        e.stopPropagation();
        copy();
      }}
      className={cn(
        "inline-flex h-4 w-5 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <ActionSwapIcon
        value={copied ? "check" : "copy"}
        animation="cascade"
        className="h-3 w-4"
      >
        {copied ? (
          <IconCheck className="h-3.5 w-3.5 text-success" />
        ) : (
          <IconCopy className="h-2.5 w-3" />
        )}
      </ActionSwapIcon>
    </button>
  );
}
