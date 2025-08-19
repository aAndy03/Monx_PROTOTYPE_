"use client"

import { useState, useEffect } from "react"
import { format, getWeek } from "date-fns"
import { Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ZoomLevel } from "@/lib/timeline-utils"

interface TimelineNavbarProps {
  focusDate: Date
  zoomLevel: ZoomLevel
  onDateChange: (date: Date) => void
  projectStartDate: Date
  projectEndDate: Date
  isInMinuteMode?: boolean
  minuteZoomLevel?: number
  minuteOffset?: number
}

export function TimelineNavbar({
  focusDate,
  zoomLevel,
  onDateChange,
  projectStartDate,
  projectEndDate,
  isInMinuteMode = false,
  minuteZoomLevel = 1,
  minuteOffset = 0,
}: TimelineNavbarProps) {
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isTimeOpen, setIsTimeOpen] = useState(false)
  const [tempHour, setTempHour] = useState(focusDate.getHours().toString().padStart(2, "0"))
  const [tempMinute, setTempMinute] = useState(focusDate.getMinutes().toString().padStart(2, "0"))
  const [tempSecond, setTempSecond] = useState(focusDate.getSeconds().toString().padStart(2, "0"))
  const [realTimeSeconds, setRealTimeSeconds] = useState(new Date().getSeconds())

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeSeconds(new Date().getSeconds())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTempHour(focusDate.getHours().toString().padStart(2, "0"))
    setTempMinute(
      isInMinuteMode ? minuteOffset.toString().padStart(2, "0") : focusDate.getMinutes().toString().padStart(2, "0"),
    )
    setTempSecond(focusDate.getSeconds().toString().padStart(2, "0"))
  }, [focusDate, isInMinuteMode, minuteOffset])

  const formatDateWithHighlight = (date: Date) => {
    const day = format(date, "d")
    const month = format(date, "MMM")
    const week = `W${getWeek(date)}`
    const year = format(date, "yyyy")

    return { day, month, week, year }
  }

  const formatTimeWithHighlight = (date: Date) => {
    const hour = format(date, "HH")
    const minute = isInMinuteMode ? minuteOffset.toString().padStart(2, "0") : format(date, "mm")
    const second = realTimeSeconds.toString().padStart(2, "0")

    return { hour, minute, second }
  }

  const handleHourChange = (value: string) => {
    setTempHour(value)
    const hour = Number.parseInt(value, 10)
    if (hour >= 0 && hour <= 23) {
      const newDate = new Date(focusDate)
      newDate.setHours(hour)
      onDateChange(newDate)
    }
  }

  const handleMinuteChange = (value: string) => {
    setTempMinute(value)
    const minute = Number.parseInt(value, 10)
    if (minute >= 0 && minute <= 59) {
      const newDate = new Date(focusDate)
      newDate.setMinutes(minute)
      onDateChange(newDate)
    }
  }

  const handleTimeChange = () => {
    const hour = Number.parseInt(tempHour, 10)
    const minute = Number.parseInt(tempMinute, 10)
    const second = Number.parseInt(tempSecond, 10)

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
      const newDate = new Date(focusDate)
      newDate.setHours(hour, minute, second)
      onDateChange(newDate)
      setIsTimeOpen(false)
    }
  }

  const { day, month, week, year } = formatDateWithHighlight(focusDate)
  const { hour, minute, second } = formatTimeWithHighlight(focusDate)

  const getHighlightClass = (part: string) => {
    switch (zoomLevel) {
      case "year":
        return part === "year" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      case "month":
        return part === "month" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      case "week":
        return part === "week" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      case "day":
        return part === "day" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      case "hour":
        if (isInMinuteMode) {
          if (part === "minute") return "bg-primary text-primary-foreground"
          if (part === "second" && minuteZoomLevel === 2) return "bg-primary text-primary-foreground"
          return part === "hour" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
        }
        return part === "hour" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)
      newDate.setHours(focusDate.getHours(), focusDate.getMinutes(), focusDate.getSeconds())
      onDateChange(newDate)
      setIsDateOpen(false)
    }
  }

  return (
    <nav className="absolute top-0 left-0 right-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="flex items-center justify-center gap-2 py-4 px-4">
        {/* Date Badge/Popover */}
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto p-2 hover:bg-muted/50">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className={getHighlightClass("day")}>
                    {day}
                  </Badge>
                  <Badge variant="secondary" className={getHighlightClass("month")}>
                    {month}
                  </Badge>
                  <Badge variant="secondary" className={getHighlightClass("week")}>
                    {week}
                  </Badge>
                  <Badge variant="secondary" className={getHighlightClass("year")}>
                    {year}
                  </Badge>
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 shadow-lg border" align="center">
            <div className="bg-background rounded-lg">
              <CalendarComponent
                mode="single"
                selected={focusDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < projectStartDate || date > projectEndDate}
                initialFocus
                className="rounded-lg"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Time Badge/Popover */}
        <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto p-2 hover:bg-muted/50">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className={getHighlightClass("hour")}>
                    {hour}
                  </Badge>
                  <span className="text-muted-foreground">:</span>
                  <Badge variant="secondary" className={getHighlightClass("minute")}>
                    {minute}
                  </Badge>
                  <span className="text-muted-foreground">:</span>
                  <Badge variant="secondary" className={getHighlightClass("second")}>
                    {second}
                  </Badge>
                  {isInMinuteMode && (
                    <Badge variant="outline" className="ml-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                      {minuteZoomLevel === 2 ? "SEC" : "MIN"}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="center">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Set Time</Label>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="hour" className="text-xs">
                      Hour
                    </Label>
                    <Input
                      id="hour"
                      type="number"
                      min="0"
                      max="23"
                      value={tempHour}
                      onChange={(e) => handleHourChange(e.target.value)}
                      className="w-16"
                    />
                  </div>
                  <span className="text-muted-foreground mt-6">:</span>
                  <div className="space-y-1">
                    <Label htmlFor="minute" className="text-xs">
                      Min
                    </Label>
                    <Input
                      id="minute"
                      type="number"
                      min="0"
                      max="59"
                      value={tempMinute}
                      onChange={(e) => handleMinuteChange(e.target.value)}
                      className="w-16"
                    />
                  </div>
                  <span className="text-muted-foreground mt-6">:</span>
                  <div className="space-y-1">
                    <Label htmlFor="second" className="text-xs">
                      Sec
                    </Label>
                    <Input
                      id="second"
                      type="number"
                      min="0"
                      max="59"
                      value={realTimeSeconds.toString().padStart(2, "0")}
                      readOnly
                      className="w-16 bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleTimeChange} className="w-full">
                Apply Time
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
