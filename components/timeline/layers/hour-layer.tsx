"use client"

import { getHourItems, shiftBy, normalizeToLevel } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"
import { useState, useEffect } from "react"
import { TransactionFormInline } from "@/components/finance/transaction-form-inline"
import { TransactionCard } from "@/components/finance/transaction-card"
import { useTransactionManager } from "@/hooks/use-transaction-manager"
import type { Transaction } from "@/lib/supabase/client"

type HourLayerProps = ReturnType<typeof useTimeline>

export function HourLayer(props: HourLayerProps) {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([])
  const { transactions, updateTransactionStatus } = useTransactionManager()

  const items = getHourItems(props.focusDate)
  const normalizedFocus = normalizeToLevel("hour", props.focusDate)
  const focusIdx = items.findIndex((d) => sameUnit("hour", d, normalizedFocus))
  const safeFocusIdx = focusIdx >= 0 ? focusIdx : Math.min(Math.max(0, normalizedFocus.getHours()), items.length - 1)

  const baseItemWidth = Math.min(320, Math.max(200, window.innerWidth > 0 ? window.innerWidth / 5 : 250))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && !showTransactionForm) {
        e.preventDefault()
        setShowTransactionForm(true)
        props.handleVerticalScroll(-200)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showTransactionForm, props.handleVerticalScroll])

  const handleTransactionCreated = (transaction: Transaction, shouldNavigate: boolean) => {
    setShowTransactionForm(false)

    if (shouldNavigate) {
      const transactionDate = new Date(transaction.transaction_date)
      props.changeFocus(transactionDate)

      if (props.isInMinuteMode) {
        const minutes = transactionDate.getMinutes()
        // props.setMinuteOffset(minutes)
      }
    }

    setVisibleTransactions((prev) => [...prev, transaction])

    setTimeout(() => {
      setVisibleTransactions((prev) => prev.filter((t) => t.id !== transaction.id))
    }, 5000)
  }

  const renderMinuteIndicators = (hourIndex: number, isCurrentHour = false) => {
    return Array.from({ length: 60 }, (_, i) => {
      const isCurrentMinute = isCurrentHour && i === props.minuteOffset
      const isQuarterHour = i % 15 === 0
      const isFiveMinute = i % 5 === 0

      const expandedItemWidth = baseItemWidth * props.granularZoom
      const actualSpaceBetweenHours = expandedItemWidth - baseItemWidth
      const minutePosition = baseItemWidth * 0.7 + (i / 60) * actualSpaceBetweenHours

      return (
        <div
          key={`minute-${hourIndex}-${i}`}
          className={`absolute transition-all duration-200 ${
            isCurrentMinute ? "bg-blue-500 shadow-lg" : isQuarterHour ? "bg-muted-foreground" : "bg-muted-foreground/50"
          }`}
          style={{
            left: `${minutePosition}px`,
            top: "50%",
            transform: "translateY(-50%)",
            width: "2px",
            height: isCurrentMinute ? "40px" : isQuarterHour ? "25px" : isFiveMinute ? "18px" : "12px",
            opacity: isCurrentMinute ? 1 : isQuarterHour ? 0.8 : isFiveMinute ? 0.6 : 0.4,
            zIndex: isCurrentMinute ? 10 : 1,
          }}
        />
      )
    })
  }

  const renderHourItem = ({ date, index, isCenter, distance, defaultNode }: any) => {
    const shouldRenderMinutes =
      props.granularZoom > 1 &&
      (isCenter || (distance === 1 && index > safeFocusIdx) || (distance === 1 && index < safeFocusIdx))

    return (
      <div className="relative flex items-center justify-center">
        {shouldRenderMinutes && (
          <div className="absolute inset-0 pointer-events-none">{renderMinuteIndicators(index, isCenter)}</div>
        )}

        <div
          className="relative z-20"
          onClick={() => {
            if (props.isInMinuteMode && props.minuteZoomLevel < 2) {
              props.zoomIntoMinutes()
            } else if (!props.isInMinuteMode) {
              props.zoomInTo(date)
            }
          }}
        >
          {defaultNode}
        </div>

        {props.granularZoom > 2 && isCenter && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 text-blue-600 bg-white/95 rounded shadow-lg border border-blue-200"
            style={{
              left: `${baseItemWidth * 0.7 + (props.minuteOffset / 60) * (baseItemWidth * props.granularZoom - baseItemWidth)}px`,
              bottom: "-40px",
              fontSize: "12px",
              padding: "4px 8px",
            }}
          >
            :{String(props.minuteOffset).padStart(2, "0")}
          </div>
        )}

        {props.granularZoom > 1 && isCenter && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 text-blue-500 font-medium bg-blue-50/90 rounded border border-blue-200"
            style={{
              top: "-35px",
              fontSize: "10px",
              padding: "2px 6px",
            }}
          >
            {props.granularZoom}x
          </div>
        )}

        {isCenter && showTransactionForm && (
          <div
            className="absolute z-30"
            style={{
              left: `${baseItemWidth * 0.7 + (props.minuteOffset / 60) * (baseItemWidth * props.granularZoom - baseItemWidth)}px`,
              top: "180px",
              transform: "translateX(-50%)",
            }}
          >
            <TransactionFormInline
              initialDate={
                new Date(
                  props.focusDate.getFullYear(),
                  props.focusDate.getMonth(),
                  props.focusDate.getDate(),
                  props.focusDate.getHours(),
                  props.minuteOffset,
                )
              }
              onTransactionCreated={handleTransactionCreated}
              onCancel={() => setShowTransactionForm(false)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Abstract
        {...props}
        items={items}
        itemFormat="HH"
        itemWidth={baseItemWidth * props.granularZoom}
        granularZoom={props.granularZoom}
        onScrollStep={(delta) => {
          const nextIdx = safeFocusIdx + delta
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
        renderItem={renderHourItem}
      />

      {visibleTransactions.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          transaction={transaction}
          onStatusChange={updateTransactionStatus}
          position={{
            x: window.innerWidth / 2 - 150,
            y: window.innerHeight / 2 + 300 + visibleTransactions.indexOf(transaction) * 100,
          }}
        />
      ))}
    </>
  )
}
