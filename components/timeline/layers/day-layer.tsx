"use client"

import { getDayItems, shiftBy } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"

type DayLayerProps = ReturnType<typeof useTimeline>

export function DayLayer(props: DayLayerProps) {
  const items = getDayItems(props.focusDate)

  return (
    <Abstract
      {...props}
      items={items}
      itemFormat="d"
      onScrollStep={(delta) => {
        const currentIdx = items.findIndex((d) => sameUnit("day", d, props.focusDate))
        const safeIdx = currentIdx >= 0 ? currentIdx : 0
        const nextIdx = safeIdx + delta

        if (nextIdx >= 0 && nextIdx < items.length) {
          props.changeFocus(items[nextIdx])
          return true
        }
        return false
      }}
      onBoundaryBreak={(dir) => {
        const delta = dir === "down" ? 1 : -1
        props.changeFocus(shiftBy("day", props.focusDate, delta))
      }}
      onZoomIn={props.zoomInTo}
      boundaryBreakProgress={props.boundaryBreakProgress}
      boundaryHoldDirection={props.boundaryHoldDirection}
    />
  )
}
