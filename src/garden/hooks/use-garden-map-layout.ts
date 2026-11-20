import * as React from "react"
import { chromeH, placeOwl, runLayoutMap, type GardenLayoutRefs } from "../map/layout-map"

export function useGardenMapLayout(
  refs: React.MutableRefObject<GardenLayoutRefs | null>,
  owlIndex: number,
  relayoutKey: string,
  calmMode: boolean,
  reducedMotion: boolean,
) {
  const hideCritters = calmMode || reducedMotion

  const paint = React.useCallback(
    (instant?: boolean) => {
      const r = refs.current
      if (!r) return
      runLayoutMap(r, owlIndex, instant, hideCritters)
    },
    [refs, owlIndex, hideCritters],
  )

  React.useLayoutEffect(() => {
    paint(true)
  }, [paint, relayoutKey])

  React.useLayoutEffect(() => {
    const r = refs.current
    if (!r) return
    const top = chromeH(r)
    placeOwl(r, r.beds, owlIndex, top, reducedMotion)
  }, [refs, owlIndex, reducedMotion])

  React.useEffect(() => {
    const r = refs.current
    if (!r) return
    const garden = r.garden
    const ro = new ResizeObserver(() => {
      paint(true)
    })
    ro.observe(garden)
    return () => ro.disconnect()
  }, [paint, refs])
}
