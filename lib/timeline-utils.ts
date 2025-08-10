/**
 * Timeline utilities with consistent week math and boundary helpers.
 */
import {
  eachYearOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachDayOfInterval,
  eachHourOfInterval,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
  addYears,
  addMonths,
  addWeeks,
  addDays,
  addHours,
  isSameYear,
  isSameMonth,
  isSameWeek,
  isSameDay,
} from "date-fns"

export type ZoomLevel = "year" | "month" | "week" | "day" | "hour"

// Use ISO-style weeks: Monday start across the entire app
export const WEEK_OPTS = { weekStartsOn: 1 as const }

export const ZOOM_LEVELS: ZoomLevel[] = ["year", "month", "week", "day", "hour"]
export const ZOOM_SENSITIVITY = 0.002
export const MIN_ZOOM = 0
export const MAX_ZOOM = ZOOM_LEVELS.length - 1

export const getSubtextFormat = (level: ZoomLevel, date: Date) => {
  switch (level) {
    case "year":
      return format(date, "yyyy")
    case "month":
      return format(date, "MMMM yyyy")
    case "week":
      return `Week of ${format(date, "MMM d")}`
    case "day":
      return format(date, "EEEE, MMM d, yyyy")
    case "hour":
      return format(date, "p")
    default:
      return ""
  }
}

export const getFormatForLevel = (level: ZoomLevel): string => {
  switch (level) {
    case "year":
      return "yyyy"
    case "month":
      return "MMMM"
    case "week":
      return "'Week' w"
    case "day":
      return "d"
    case "hour":
      return "ha"
    default:
      return ""
  }
}

// Item generators (bounded lists for each context)
export const getYearItems = (start: Date, end: Date) => eachYearOfInterval({ start, end })
export const getMonthItems = (yearDate: Date) =>
  eachMonthOfInterval({ start: startOfYear(yearDate), end: endOfYear(yearDate) })
// Include leading/trailing weeks that intersect the month using consistent week options
export const getWeekItems = (monthDate: Date) =>
  eachWeekOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) }, WEEK_OPTS)
export const getDayItems = (weekDate: Date) =>
  eachDayOfInterval({ start: startOfWeek(weekDate, WEEK_OPTS), end: endOfWeek(weekDate, WEEK_OPTS) })
export const getHourItems = (dayDate: Date) =>
  eachHourOfInterval({ start: startOfDay(dayDate), end: endOfDay(dayDate) })

// Comparators for unit equality
export function sameUnit(level: ZoomLevel, a: Date, b: Date) {
  switch (level) {
    case "year":
      return isSameYear(a, b)
    case "month":
      return isSameMonth(a, b)
    case "week":
      return isSameWeek(a, b, WEEK_OPTS)
    case "day":
      return isSameDay(a, b)
    case "hour":
      return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate() &&
        a.getHours() === b.getHours()
      )
  }
}

// Normalize date to the canonical start of a unit
export function normalizeToLevel(level: ZoomLevel, date: Date) {
  switch (level) {
    case "year":
      return startOfYear(date)
    case "month":
      return startOfMonth(date)
    case "week":
      return startOfWeek(date, WEEK_OPTS)
    case "day":
      return startOfDay(date)
    case "hour":
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0)
  }
}

// Step by unit (used for within-context stepping)
export function shiftBy(level: ZoomLevel, date: Date, delta: 1 | -1) {
  switch (level) {
    case "year":
      return addYears(date, delta)
    case "month":
      return addMonths(date, delta)
    case "week":
      return addWeeks(date, delta)
    case "day":
      return addDays(date, delta)
    case "hour":
      return addHours(date, delta)
  }
}

// Parent-boundary checks (used for bounded scrolling logic if needed)
export function isWithinParent(level: ZoomLevel, current: Date, candidate: Date) {
  switch (level) {
    case "month":
      return isSameYear(current, candidate)
    case "week":
      return isSameMonth(current, candidate)
    case "day":
      return isSameWeek(current, candidate, WEEK_OPTS)
    case "hour":
      return isSameDay(current, candidate)
    case "year":
      return true
  }
}

/**
 * Week boundary helpers to ensure adjacent-month transitions are deterministic.
 * - firstWeekOfMonth: Monday of the week that contains day 1 of the month
 * - lastWeekOfMonth:  Monday of the week that contains the month's last day
 * - adjacentMonthWeekTarget: for "breaking" out of a month's week bounds
 */
export function firstWeekOfMonth(d: Date) {
  return startOfWeek(startOfMonth(d), WEEK_OPTS)
}
export function lastWeekOfMonth(d: Date) {
  return startOfWeek(endOfMonth(d), WEEK_OPTS)
}
export function adjacentMonthWeekTarget(current: Date, direction: "up" | "down") {
  if (direction === "down") {
    // Move to the first visible week in the next month
    return firstWeekOfMonth(addMonths(current, 1))
  }
  // Move to the last visible week in the previous month
  return lastWeekOfMonth(addMonths(current, -1))
}
