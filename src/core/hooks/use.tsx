import React from "react"

type TRequestCallback<T> = (opts: { signal: AbortSignal }) => Promise<T>

type TRequester<T> = {
  get: TRequestCallback<T>
  onInvalidate: (callback: (data: T) => void) => void
  offInvalidate: (callback: (data: T) => void) => void
  onExpire: (callback: () => void) => void
  offExpire: (callback: () => void) => void
}

type TUseOpts = {
  maxRetries?: number
  triggerTarget?: string
}

export function use<T>(
  request?: TRequestCallback<T> | TRequester<T>,
  options?: TUseOpts
) {
  if (!request) request = () => Promise.resolve(null as T)

  const _request = typeof request === "function" ? request : request.get
  const _onInvalidate =
    typeof request === "object" ? request.onInvalidate : undefined
  const _offInvalidate =
    typeof request === "object" ? request.offInvalidate : undefined
  const _onExpire = typeof request === "object" ? request.onExpire : undefined
  const _offExpire = typeof request === "object" ? request.offExpire : undefined

  const [can, setCan] = React.useState(!options?.triggerTarget)
  const [isLoading, setLoading] = React.useState(true)
  const [count, setCount] = React.useState(0)
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<Error | null>(null)

  const SendRequest = React.useCallback(
    async (opts: { signal: AbortSignal }) => {
      if (!can) return

      setLoading(true)

      for (let attempt = 0; attempt <= (options?.maxRetries ?? 0); attempt++) {
        try {
          const Response = await _request(opts)

          setData(Response)
          setLoading(false)

          return
        } catch (err) {
          if (!options?.maxRetries || attempt === options.maxRetries) {
            setError(err instanceof Error ? err : new Error(`${err}`))
            setLoading(false)

            return
          }
        }
      }
    },
    [_request, can, options?.maxRetries]
  )

  const triggerElement =
    options?.triggerTarget && document.getElementById(options.triggerTarget)

  React.useEffect(() => {
    if (triggerElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setCan(true)
          }
        },
        {
          root: null,
          threshold: 0.2,
        }
      )

      observer.observe(triggerElement)

      return () => {
        observer.disconnect()
      }
    }
  }, [SendRequest, triggerElement])

  React.useEffect(() => {
    const controller = new AbortController()

    const handleChange = () => SendRequest({ signal: controller.signal })

    window.addEventListener("online", handleChange)

    _onInvalidate?.(setData)

    const handleExpire = () => {
      setCount((_) => _ + 1)
    }

    _onExpire?.(handleExpire)

    return () => {
      controller.abort()

      window.removeEventListener("online", handleChange)

      _offInvalidate?.(setData)
      _offExpire?.(handleExpire)
    }
  }, [SendRequest, _onInvalidate, _offInvalidate, _onExpire, _offExpire])

  React.useEffect(() => {
    const controller = new AbortController()

    SendRequest({ signal: controller.signal })

    return () => {
      controller.abort()
    }
  }, [count, SendRequest])

  return {
    isLoading,
    data,
    error,
  } as
    | {
        isLoading: true
        data: null
        error: null
      }
    | {
        isLoading: false
        data: T
        error: null
      }
    | {
        isLoading: false
        data: null
        error: Error
      }
}
