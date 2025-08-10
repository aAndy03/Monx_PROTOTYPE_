"use client"

import { getYearItems } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"

type YearLayerProps = ReturnType<typeof useTimeline>

export function YearLayer(props: YearLayerProps) {
  const items = getYearItems(props.projectStartDate, props.projectEndDate)
  const focusIdx = items.findIndex((d) => sameUnit("year", d, props.focusDate))

  return (
    <Abstract
      {...props}
      items={items}
      itemFormat="yyyy"
      onScrollStep={(delta) => {
        const nextIdx = focusIdx + delta
        if (nextIdx >= 0 && nextIdx < items.length) {
          props.changeFocus(items[nextIdx])
          return true
        }
        // year layer: if out of project bounds, ignore (project scope is hard bound)
        return false
      }}
      onBoundaryBreak={(dir) => {
        // No-op for year; project scope is the top bound
        const delta = dir === "down" ? 1 : -1
        const nextIdx = focusIdx + delta
        if (nextIdx >= 0 && nextIdx < items.length) {
          props.changeFocus(items[nextIdx])
        }
      }}
      onZoomIn={props.zoomInTo}
      boundaryBreakProgress={props.boundaryBreakProgress}
      boundaryHoldDirection={props.boundaryHoldDirection}
    />
  )
}
