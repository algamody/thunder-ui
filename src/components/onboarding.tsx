import { IconArrowRight, IconChevronsRight } from "@tabler/icons-react"
import { Button } from "./ui/button"
import { Dialog, DialogContent } from "./ui/dialog"
import { Progress } from "./ui/progress"
import React from "react"
import { cn } from "@/lib/utils"
import { Preferences } from "@capacitor/preferences"
import { useAuth } from "@/core/context/AuthProvider"

const Screens = [
  {
    title: "Thunder UI",
    description: "Connect with thunder ui to fasten your UI process.",
    image: "/logo.png",
  },
  {
    title: "Thunder UI 2",
    description: "Connect with thunder ui to fasten your UI process.",
    image: "/logo.png",
  },
  {
    title: "Thunder UI 3",
    description: "Connect with thunder ui to fasten your UI process.",
    image: "/logo.png",
  },
]

export function Onboarding() {
  const auth = useAuth()
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = React.useState(0)

  const isLastScreen = current === Screens.length - 1

  const handleNext = () => {
    if (!isLastScreen) {
      setCurrent((prev) => prev + 1)
    }
  }

  React.useLayoutEffect(() => {
    ;(async () => {
      const { value } = await Preferences.get({ key: "onboarding" })
      if (!value) setOpen(true)
    })()
  }, [])

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="h-full max-w-full rounded-none border-none sm:h-auto sm:max-w-md sm:rounded-3xl bg-linear-0 from-primary dark:to-black to-white to-20%"
      >
        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            {/* Progress Bars Container */}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${Screens.length}, 1fr)` }}
            >
              {Screens.length > 1
                ? Screens.map((_, i) => (
                    <ScreenProgress
                      key={i}
                      index={i}
                      current={current}
                      onComplete={handleNext}
                    />
                  ))
                : null}
            </div>

            {/* Skip Button */}
            <div className="flex w-full justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className={!isLastScreen ? "visible" : "invisible"}
              >
                Skip <IconChevronsRight />
              </Button>
            </div>
          </div>

          <div className="relative aspect-square w-full overflow-hidden">
            {Screens.map((screen, idx) => (
              <img
                key={idx}
                src={screen.image}
                alt={screen.title}
                className={cn(
                  "absolute inset-0 h-full w-full object-contain transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  current === idx
                    ? "blur-0 z-10 translate-y-0 scale-100 opacity-100"
                    : "z-0 translate-y-8 scale-110 opacity-0 blur-xl"
                )}
              />
            ))}
          </div>

          {/* Screen Content */}
          <div className="relative mt-8 w-full pb-5">
            {Screens.map((screen, idx) => {
              const total = Screens.length
              const isActive = idx === current
              const stackIndex = (idx - current + total) % total

              const scale = 1 - stackIndex * 0.2
              const y = stackIndex * 14
              const zIndex = total - stackIndex

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center gap-4 rounded-3xl border-2 border-background/30 bg-background/60 p-6 text-center text-foreground backdrop-blur-md transition-all duration-300 ease-out",
                    isActive
                      ? "relative"
                      : "pointer-events-none absolute bottom-0"
                  )}
                  style={{
                    transform: `translateY(${y}px) scale(${scale})`,
                    zIndex,
                  }}
                >
                  <h2 className="text-2xl font-medium">{screen.title}</h2>

                  <p className="text-sm opacity-90">{screen.description}</p>

                  {current + 1 === Screens.length ? (
                    <Button
                      className="mt-2 w-full"
                      onClick={async () => {
                        await Preferences.set({
                          key: "onboarding",
                          value: "true",
                        }).catch(console.error)

                        await auth.userManager.signinRedirect()
                      }}
                    >
                      Get Started
                    </Button>
                  ) : (
                    <Button className="mt-2 w-full" onClick={handleNext}>
                      Continue <IconArrowRight />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ScreenProgress({
  index,
  current,
  onComplete,
}: {
  index: number
  current: number
  onComplete: () => void
}) {
  const DURATION = 3000 // 3 seconds per screen
  const INTERVAL = 50 // Update every 50ms for smooth movement
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    // 1. If this screen is already passed, set to 100%
    if (index < current) {
      setProgress(100)
      return
    }

    // 2. If this screen is in the future, set to 0%
    if (index > current) {
      setProgress(0)
      return
    }

    // 3. If this is the active screen
    if (index === current) {
      // Reset progress to 0 when we arrive at this screen
      setProgress(0)

      const startTime = Date.now()

      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime
        const newProgress = (elapsedTime / DURATION) * 100

        if (newProgress >= 100) {
          setProgress(100)
          clearInterval(timer)
          onComplete()
        } else {
          setProgress(newProgress)
        }
      }, INTERVAL)

      return () => clearInterval(timer)
    }
  }, [current, index, onComplete])

  return <Progress value={progress} className="[&>div]:h-1" />
}
