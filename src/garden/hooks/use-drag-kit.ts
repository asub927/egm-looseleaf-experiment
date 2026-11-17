import * as React from "react"

export type SvgPoint = { x: number; y: number }

export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): SvgPoint {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const m = svg.getScreenCTM()
  return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 }
}

export function useSvgDrag<TContext>(
  svgRef: React.RefObject<SVGSVGElement | null>,
  live: boolean,
  handlers: {
    start: (pt: SvgPoint, target: HTMLElement | SVGElement) => TContext | false | null
    move?: (pt: SvgPoint, ctx: TContext) => void
    end: (pt: SvgPoint, ctx: TContext, moved: boolean, cancel: boolean) => void
  },
): {
  bindTarget: (target: HTMLElement | SVGElement | null) => () => void
  isDragging: boolean
} {
  const stRef = React.useRef<{
    ctx: TContext
    x0: number
    y0: number
    moved: boolean
    target: HTMLElement | SVGElement
  } | null>(null)
  const [isDragging, setDragging] = React.useState(false)
  const handlersRef = React.useRef(handlers)
  handlersRef.current = handlers

  const toSvg = React.useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      return clientToSvg(svg, clientX, clientY)
    },
    [svgRef],
  )

  const bindTarget = React.useCallback(
    (target: HTMLElement | SVGElement | null) => {
      if (!target) return () => {}
      const onDown = (e: Event) => {
        if (!(e instanceof PointerEvent)) return
        if (!live) return
        const ctx = handlersRef.current.start(toSvg(e.clientX, e.clientY), target)
        if (ctx === false || ctx == null) return
        e.preventDefault()
        e.stopPropagation()
        try {
          target.setPointerCapture(e.pointerId)
        } catch {
          /* unsupported */
        }
        target.classList.add("grab", "drag")
        stRef.current = { ctx, x0: e.clientX, y0: e.clientY, moved: false, target }
        setDragging(false)
      }
      const onMove = (e: Event) => {
        if (!(e instanceof PointerEvent)) return
        const st = stRef.current
        if (!st) return
        if (!st.moved && Math.hypot(e.clientX - st.x0, e.clientY - st.y0) > 8) {
          st.moved = true
          setDragging(true)
        }
        if (st.moved && handlersRef.current.move) {
          handlersRef.current.move(toSvg(e.clientX, e.clientY), st.ctx)
        }
      }
      const finish = (e: Event, cancel: boolean) => {
        if (!(e instanceof PointerEvent) && !cancel) return
        const st = stRef.current
        if (!st) return
        stRef.current = null
        st.target.classList.remove("drag")
        setDragging(false)
        const pt = e instanceof PointerEvent ? toSvg(e.clientX, e.clientY) : { x: 0, y: 0 }
        handlersRef.current.end(pt, st.ctx, st.moved, cancel)
      }
      const onUp = (e: Event) => finish(e, false)
      const onCancel = (_e: Event) => {
        const st = stRef.current
        if (!st) return
        stRef.current = null
        st.target.classList.remove("drag")
        setDragging(false)
        handlersRef.current.end({ x: 0, y: 0 }, st.ctx, false, true)
      }
      target.addEventListener("pointerdown", onDown)
      target.addEventListener("pointermove", onMove)
      target.addEventListener("pointerup", onUp)
      target.addEventListener("pointercancel", onCancel)
      return () => {
        target.removeEventListener("pointerdown", onDown)
        target.removeEventListener("pointermove", onMove)
        target.removeEventListener("pointerup", onUp)
        target.removeEventListener("pointercancel", onCancel)
      }
    },
    [live, toSvg],
  )

  return { bindTarget, isDragging }
}
