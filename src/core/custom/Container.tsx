import { cn } from "@/lib/utils"

type HTMLTag = keyof React.JSX.IntrinsicElements

export function Container({
  className,
  as: Tag = "div",
  ...rest
}: React.ComponentProps<HTMLTag> & { as?: HTMLTag }) {
  const Component = Tag as React.ElementType

  return (
    <Component
      className={cn("mx-auto w-full max-w-6xl p-3 md:p-2", className)}
      {...rest}
    />
  )
}
