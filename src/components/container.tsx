import { cn } from "@/lib/utils"

export function Container({ className, ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl p-3 md:p-2", className)}
      {...rest}
    ></div>
  )
}
