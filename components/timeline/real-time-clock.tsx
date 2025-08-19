"use client"

import { useState, useEffect } from "react"
import { format, getWeek } from "date-fns"

export function RealTimeClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDateTime = (date: Date) => {
    const day = format(date, "d")
    const month = format(date, "MMM")
    const week = `W${getWeek(date)}`
    const year = format(date, "yyyy")
    const time = format(date, "HH:mm:ss")

    return `${day} ${month} ${week} ${year}, ${time}`
  }

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <div className="backdrop-blur-md bg-background/80 border border-border/50 rounded-lg px-3 py-2 shadow-lg">
        <div className="font-bold text-sm text-muted-foreground font-sans">{formatDateTime(currentTime)}</div>
      </div>
    </div>
  )
}
