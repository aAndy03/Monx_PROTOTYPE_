"use client"

import { getHourItems, shiftBy, normalizeToLevel } from "@/lib/timeline-utils"
import type { useTimeline } from "@/hooks/use-timeline"
import { AbstractLayer as Abstract } from "./abstract-layer"
import { sameUnit } from "@/lib/timeline-utils"
import { useState, useEffect, useMemo } from "react"
import { EnhancedTransactionForm } from "@/components/finance/enhanced-transaction-form"
import { TransactionIndicator } from "@/components/finance/transaction-indicator"
import { TransactionStatusIndicator } from "@/components/finance/transaction-status-indicator"
import { TransactionGroupIndicator } from "@/components/finance/transaction-group-indicator"
import { TransactionCardWithConnector } from "@/components/finance/transaction-card-with-connector"
import { useTransactionManager } from "@/hooks/use-transaction-manager"
import type { Transaction } from "@/lib/supabase/client"

type HourLayerProps = ReturnType<typeof useTimeline> & {
  projectId?: string
}

interface TransactionState {
  transaction: Transaction
  showAsCard: boolean
  createdAt: number
  minute: number
}

export function HourLayer(props: HourLayerProps) {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionStates, setTransactionStates] = useState<TransactionState[]>([])
  const { transactions, loadTransactions, updateTransactionStatus } = useTransactionManager()

  const items = useMemo(() => getHourItems(props.focusDate), [props.focusDate])
  const normalizedFocus = normalizeToLevel("hour", props.focusDate)
  const focusIdx = items.findIndex((d) => sameUnit("hour", d, normalizedFocus))
  const safeFocusIdx = focusIdx >= 0 ? focusIdx : Math.min(Math.max(0, normalizedFocus.getHours()), items.length - 1)

  const baseItemWidth = useMemo(
    () => Math.min(320, Math.max(200, window.innerWidth > 0 ? window.innerWidth / 5 : 250)),
    [],
  )

  useEffect(() => {
    const loadHourTransactions = async () => {
      const currentDate = props.focusDate
      const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0)
      const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59)

      await loadTransactions({ start: startOfDay, end: endOfDay })
    }

    loadHourTransactions()
  }, [props.focusDate.toDateString(), loadTransactions]) // Use toDateString to prevent excessive reloads

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "t" && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        // Only trigger if not typing in an input field
        const target = event.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          event.preventDefault()
          setShowTransactionForm(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const focusedHour = items[safeFocusIdx]?.getHours() || props.focusDate.getHours()
    const currentHourTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date)
      const transactionHour = transactionDate.getHours()
      return transactionHour === focusedHour
    })

    setTransactionStates((prevStates) => {
      const existingIds = new Set(prevStates.map((s) => s.transaction.id))
      const newStates = currentHourTransactions
        .filter((t) => !existingIds.has(t.id))
        .map((transaction) => {
          const transactionDate = new Date(transaction.transaction_date)
          return {
            transaction,
            showAsCard: props.granularZoom >= 4,
            createdAt: Date.now(),
            minute: transactionDate.getMinutes(),
          }
        })

      const updatedStates = prevStates.map((state) => {
        const updatedTransaction = currentHourTransactions.find((t) => t.id === state.transaction.id)
        if (updatedTransaction) {
          return {
            ...state,
            transaction: updatedTransaction,
            showAsCard: props.granularZoom >= 4 || Date.now() - state.createdAt < 60000,
          }
        }
        return state
      })

      const finalStates = [...updatedStates, ...newStates]

      if (
        finalStates.length !== prevStates.length ||
        finalStates.some(
          (state, index) =>
            !prevStates[index] ||
            state.transaction.id !== prevStates[index]?.transaction.id ||
            state.showAsCard !== prevStates[index]?.showAsCard,
        )
      ) {
        return finalStates
      }

      return prevStates
    })
  }, [transactions, safeFocusIdx, props.granularZoom]) // Removed props.focusDate.getHours() to prevent excessive updates

  const isInViewport = (minute: number) => {
    const currentHour = props.focusDate.getHours()
    const focusedHour = items[safeFocusIdx]?.getHours() || currentHour
    return focusedHour === currentHour && props.granularZoom > 1
  }

  const groupedTransactions = useMemo(() => {
    const currentHourTransactions = transactionStates.filter((state) => {
      const transactionHour = new Date(state.transaction.transaction_date).getHours()
      const focusedHour = items[safeFocusIdx]?.getHours() || props.focusDate.getHours()
      return transactionHour === focusedHour
    })

    if (props.granularZoom <= 3) {
      const minuteGroups = currentHourTransactions.reduce(
        (acc, state) => {
          const minute = state.minute
          if (!acc[minute]) acc[minute] = []
          acc[minute].push(state.transaction)
          return acc
        },
        {} as Record<number, Transaction[]>,
      )

      return Object.entries(minuteGroups).map(([minute, transactions]) => ({
        minute: Number.parseInt(minute),
        transactions: transactions.sort(
          (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
        ),
        isGroup: transactions.length > 1,
      }))
    }

    const minuteGroups = currentHourTransactions.reduce(
      (acc, state) => {
        const minute = state.minute
        if (!acc[minute]) acc[minute] = []
        acc[minute].push(state.transaction)
        return acc
      },
      {} as Record<number, Transaction[]>,
    )

    const result = Object.entries(minuteGroups).map(([minute, transactions]) => ({
      minute: Number.parseInt(minute),
      transactions: transactions.sort(
        (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime(),
      ),
      isGroup: false,
    }))

    return result
  }, [transactionStates, safeFocusIdx, items, props.focusDate, props.granularZoom])

  const getSmartCardPosition = (minute: number, transactionIndex: number, totalInMinute: number) => {
    const expandedItemWidth = baseItemWidth * props.granularZoom
    const actualSpaceBetweenHours = expandedItemWidth - baseItemWidth
    const minuteX = baseItemWidth * 0.7 + (minute / 60) * actualSpaceBetweenHours

    const cardWidth = 260
    const cardHeight = 140
    const cardSpacing = 20
    const baseY = 180 // Position cards below the timeline

    if (totalInMinute > 1) {
      const maxCardsPerRow = Math.floor((expandedItemWidth * 0.8) / (cardWidth + cardSpacing))
      const row = Math.floor(transactionIndex / maxCardsPerRow)
      const col = transactionIndex % maxCardsPerRow

      const offsetX = col * (cardWidth + cardSpacing) - ((totalInMinute - 1) * (cardWidth + cardSpacing)) / 2
      const offsetY = row * (cardHeight + cardSpacing)

      return {
        x: minuteX + offsetX,
        y: baseY + offsetY,
      }
    }

    return {
      x: minuteX - cardWidth / 2, // Center the card under the minute
      y: baseY,
    }
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

        <div className="relative z-20">{defaultNode}</div>

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
            <EnhancedTransactionForm
              initialDate={
                new Date(
                  props.focusDate.getFullYear(),
                  props.focusDate.getMonth(),
                  props.focusDate.getDate(),
                  props.focusDate.getHours(),
                  props.minuteOffset,
                )
              }
              projectId={props.projectId || "default-project"}
              onTransactionCreated={handleTransactionCreated}
              onCancel={() => setShowTransactionForm(false)}
            />
          </div>
        )}

        {isCenter && (
          <>
            {props.granularZoom >= 1 &&
              groupedTransactions.map((group, groupIndex) => {
                const expandedItemWidth = baseItemWidth * props.granularZoom
                const actualSpaceBetweenHours = expandedItemWidth - baseItemWidth
                const indicatorX = baseItemWidth * 0.7 + (group.minute / 60) * actualSpaceBetweenHours
                const statusY = props.granularZoom === 1 ? -80 : -60

                return (
                  <TransactionStatusIndicator
                    key={`status-${group.minute}`}
                    transactions={group.transactions}
                    position={{ x: indicatorX, y: statusY }}
                    granularZoom={props.granularZoom}
                    onStatusChange={updateTransactionStatus}
                  />
                )
              })}

            {groupedTransactions.map((group, groupIndex) => {
              const expandedItemWidth = baseItemWidth * props.granularZoom
              const actualSpaceBetweenHours = expandedItemWidth - baseItemWidth
              const indicatorX = baseItemWidth * 0.7 + (group.minute / 60) * actualSpaceBetweenHours
              const indicatorY = props.granularZoom <= 3 ? 120 : 120 + groupIndex * 25

              if (props.granularZoom >= 4) {
                return group.transactions.map((transaction, txIndex) => {
                  const cardPosition = getSmartCardPosition(group.minute, txIndex, group.transactions.length)
                  const minuteX = baseItemWidth * 0.7 + (group.minute / 60) * actualSpaceBetweenHours
                  const needsConnector = Math.abs(cardPosition.x + 130 - minuteX) > 100 || group.transactions.length > 1
                  const connectorTarget = needsConnector ? { x: minuteX, y: 60 } : undefined

                  return (
                    <TransactionCardWithConnector
                      key={`card-${transaction.id}`}
                      transaction={transaction}
                      position={cardPosition}
                      connectorTarget={connectorTarget}
                      onStatusChange={updateTransactionStatus}
                      onCancel={() => {
                        setTransactionStates((prev) =>
                          prev.map((state) =>
                            state.transaction.id === transaction.id ? { ...state, showAsCard: false } : state,
                          ),
                        )
                      }}
                    />
                  )
                })
              }

              if (group.isGroup) {
                return (
                  <TransactionGroupIndicator
                    key={`group-${group.minute}`}
                    transactionGroups={[group.transactions]}
                    position={{ x: indicatorX, y: indicatorY }}
                    granularZoom={props.granularZoom}
                    onStatusChange={updateTransactionStatus}
                  />
                )
              } else {
                return (
                  <TransactionIndicator
                    key={`indicator-${group.minute}`}
                    transactions={group.transactions}
                    position={{ x: indicatorX, y: indicatorY }}
                    granularZoom={props.granularZoom}
                    isInViewport={isInViewport(group.minute)}
                    onStatusChange={updateTransactionStatus}
                  />
                )
              }
            })}
          </>
        )}
      </div>
    )
  }

  const handleTransactionCreated = (transaction: Transaction, shouldNavigate: boolean) => {
    setShowTransactionForm(false)

    if (shouldNavigate) {
      const transactionDate = new Date(transaction.transaction_date)
      props.changeFocus(transactionDate)
    }

    const minute = new Date(transaction.transaction_date).getMinutes()
    const newState: TransactionState = {
      transaction,
      showAsCard: props.granularZoom >= 4,
      createdAt: Date.now(),
      minute,
    }

    setTransactionStates((prev) => [...prev, newState])

    if (props.granularZoom < 4) {
      setTimeout(() => {
        setTransactionStates((prev) =>
          prev.map((state) => (state.transaction.id === transaction.id ? { ...state, showAsCard: false } : state)),
        )
      }, 60000)
    }
  }

  return (
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
  )
}
