"use client"

import { useMemo, useState } from "react"
import { getWeekItems, getDayItems, sameUnit, firstWeekOfMonth, lastWeekOfMonth } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { isSameMonth, startOfMonth, addMonths } from "date-fns"
import { cn } from "@/lib/utils"

type WeekLayerProps = ReturnType<typeof useTimeline>

export function WeekLayer(props: WeekLayerProps) {
  const [monthContext, setMonthContext] = useState(startOfMonth(props.focusDate))
  const items = useMemo(() => getWeekItems(monthContext), [monthContext])
  const focusIdx = useMemo(() => items.findIndex((d) => sameUnit("week", d, props.focusDate)), [items, props.focusDate])

  return (
    <Abstract
      {...props}
      items={items}
      itemFormat={"'Week' w"}
      onScrollStep={(delta) => {
        const nextIdx = focusIdx + delta
        if (nextIdx >= 0 && nextIdx < items.length) {
          props.changeFocus(items[nextIdx])
          return true
        }
        return false
      }}
      onBoundaryBreak={(dir) => {
        if (dir === "down") {
          const nextMonth = addMonths(monthContext, 1)
          setMonthContext(nextMonth)
          props.changeFocus(firstWeekOfMonth(nextMonth))
        } else {
          const prevMonth = addMonths(monthContext, -1)
          setMonthContext(prevMonth)
          props.changeFocus(lastWeekOfMonth(prevMonth))
        }
      }}
      onZoomIn={props.zoomInTo}
      boundaryBreakProgress={props.boundaryBreakProgress}
      boundaryHoldDirection={props.boundaryHoldDirection}
      renderItem={({ date, index, isCenter, distance, defaultNode }) => {
        const days = getDayItems(date)
        const isCross = days.some((d) => !isSameMonth(d, monthContext))
        return (
          <div
            className={cn(
              "rounded-xl p-2 transition-colors",
              isCross ? "ring-2 ring-amber-500/60" : "ring-0",
              isCenter ? "bg-card/50" : "bg-transparent",
            )}
          >
            {defaultNode}
            <div className="mt-2 flex gap-1 justify-center">
              {days.map((d) => {
                const outside = !isSameMonth(d, monthContext)
                return (
                  <div
                    key={d.toISOString()}
                    title={d.toDateString()}
                    className={cn("h-1.5 w-5 rounded-full", outside ? "bg-amber-500/80" : "bg-muted-foreground/40")}
                  />
                )
              })}
            </div>
          </div>
        )
      }}
    />
  )
}
