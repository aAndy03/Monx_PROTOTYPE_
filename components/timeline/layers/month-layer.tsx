"use client"

import { getMonthItems, shiftBy } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"

type MonthLayerProps = ReturnType<typeof useTimeline>

export function MonthLayer(props: MonthLayerProps) {
  const items = getMonthItems(props.focusDate)
  const focusIdx = items.findIndex((d) => sameUnit("month", d, props.focusDate))

  return (
    <Abstract
      {...props}
      items={items}
      itemFormat="LLL"
      onScrollStep={(delta) => {
        const nextIdx = focusIdx + delta
        if (nextIdx >= 0 && nextIdx < items.length) {
          props.changeFocus(items[nextIdx])
          return true
        }
        return false
      }}
      onBoundaryBreak={(dir) => {
        const delta = dir === "down" ? 1 : -1
        props.changeFocus(shiftBy("month", props.focusDate, delta))
      }}
      onZoomIn={props.zoomInTo}
      boundaryBreakProgress={props.boundaryBreakProgress}
      boundaryHoldDirection={props.boundaryHoldDirection}
    />
  )
}
