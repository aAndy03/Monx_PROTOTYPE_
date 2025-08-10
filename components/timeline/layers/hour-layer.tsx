"use client"

import { getHourItems, shiftBy } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"

type HourLayerProps = ReturnType<typeof useTimeline>

export function HourLayer(props: HourLayerProps) {
  const items = getHourItems(props.focusDate)
  const focusIdx = items.findIndex((d) => sameUnit("hour", d, props.focusDate))

  return (
    <Abstract
      {...props}
      items={items}
      itemFormat="ha"
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
        props.changeFocus(shiftBy("hour", props.focusDate, delta))
      }}
      onZoomIn={props.zoomInTo}
      boundaryBreakProgress={props.boundaryBreakProgress}
      boundaryHoldDirection={props.boundaryHoldDirection}
    />
  )
}
