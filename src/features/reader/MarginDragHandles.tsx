import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { LayoutSettings, SettingsPatch } from '@/types/settings'
import { useReaderStore } from '@/state/readerStore'
import { cn } from '@/core/utils/cn'

type Side = 'left' | 'right' | 'top' | 'bottom'

/** Vertical margins: fixed range, matching the layout sliders. */
const MAX_MARGIN_V = 320
/** Keep a sliver of text column visible while dragging. */
const MIN_COLUMN = 40
/** Pointer distance at which a handle lights up. */
const NEAR = 44
/** Gap between the text edge and the grip, so it never covers glyphs. */
const GAP = 16
const H = 10 // handle thickness in px

/**
 * Draggable margin handles overlaid on the reading canvas. Dragging mirrors
 * the slider semantics (0–240px, pair-linking aware) and routes through the
 * same settings update path, so it works for global defaults and per-book
 * overrides alike.
 *
 * When the "maximum line width" cap is the binding constraint on the
 * horizontal axis, the left/right handles instead resize the cap, so they
 * always sit on the visible text edge and always do something useful.
 */
export function MarginDragHandles({
  layout,
  update,
  maxWidthPx,
  fontSize,
}: {
  layout: LayoutSettings
  update: (patch: SettingsPatch) => void
  maxWidthPx: number
  fontSize: number
}) {
  const panelOpen = useReaderStore((s) => s.leftOpen || s.settingsOpen)
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [near, setNear] = useState<Side | null>(null)
  const [dragging, setDragging] = useState<Side | null>(null)
  const dragRef = useRef<{
    side: Side
    startPos: number
    startV: number
    startCh: number
    linked: boolean
    capBinds: boolean
  } | null>(null)
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  // Track the canvas box size so handles clamp inside it.
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  // Geometry helpers — computed from live refs so pointer math stays fresh.
  const geom = useCallback(() => {
    const L = layoutRef.current
    const availW = Math.max(0, size.w - L.marginLeft - L.marginRight)
    const cap = maxWidthPx > 0 ? maxWidthPx : Infinity
    const colW = Math.max(0, Math.min(cap, availW))
    const capBinds = colW < availW - 1
    const leftEdge = (size.w - colW) / 2
    const rightEdge = size.w - leftEdge
    return { L, availW, colW, capBinds, leftEdge, rightEdge }
  }, [size.w, maxWidthPx])

  // Proximity highlight. Works over the padding strips around the text —
  // the EPUB iframe consumes mouse events over the text itself.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = boxRef.current
      if (!el || dragRef.current) return
      // Handles are hidden while a drawer or panel covers the reader.
      if (
        useReaderStore.getState().leftOpen ||
        useReaderStore.getState().settingsOpen
      ) {
        setNear(null)
        return
      }
      const r = el.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < -NEAR || y < -NEAR || x > r.width + NEAR || y > r.height + NEAR) {
        setNear(null)
        return
      }
      const { L, capBinds, leftEdge, rightEdge } = geom()
      const cands: [Side, number][] = capBinds
        ? [
            ['left', Math.abs(x - leftEdge)],
            ['right', Math.abs(x - rightEdge)],
          ]
        : [
            ['left', Math.abs(x - L.marginLeft)],
            ['right', Math.abs(x - (r.width - L.marginRight))],
            ['top', Math.abs(y - L.marginTop)],
            ['bottom', Math.abs(y - (r.height - L.marginBottom))],
          ]
      const hit = cands.filter(([, d]) => d <= NEAR).sort((a, b) => a[1] - b[1])[0]
      setNear(hit ? hit[0] : null)
    }
    // The EPUB content is an iframe: once the cursor moves over the book
    // text, the parent window stops receiving mousemove events, so `near`
    // would freeze at its last value and the handle would never hide.
    // A cross-document mouseout (relatedTarget === null) means the pointer
    // entered the iframe or left the window — clear the highlight.
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) setNear(null)
    }
    const onBlur = () => setNear(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onOut)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onOut)
      window.removeEventListener('blur', onBlur)
    }
  }, [geom])

  const applyDrag = useCallback(
    (side: Side, v: number, linked: boolean, capBinds: boolean, ch: number) => {
      const horizontal = side === 'left' || side === 'right'
      if (horizontal && capBinds) {
        update({ typography: { maxLineCh: Math.round(ch) } })
        return
      }
      let patch: Partial<LayoutSettings>
      if (horizontal) {
        patch = linked
          ? { marginLeft: v, marginRight: v }
          : side === 'left'
            ? { marginLeft: v }
            : { marginRight: v }
      } else {
        patch = linked
          ? { marginTop: v, marginBottom: v }
          : side === 'top'
            ? { marginTop: v }
            : { marginBottom: v }
      }
      update({ layout: patch })
    },
    [update],
  )

  const startDrag = useCallback(
    (side: Side, e: React.PointerEvent) => {
      e.preventDefault()
      const horizontal = side === 'left' || side === 'right'
      const { L, capBinds } = geom()
      // Capture the pointer on the handle: without this, a pointerup that
      // happens over the EPUB iframe never reaches the parent window and
      // the drag would keep following the mouse after release.
      const el = e.currentTarget as HTMLElement
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* older engines — window-level fallback below still applies */
      }
      dragRef.current = {
        side,
        startPos: horizontal ? e.clientX : e.clientY,
        startV:
          side === 'left'
            ? L.marginLeft
            : side === 'right'
              ? L.marginRight
              : side === 'top'
                ? L.marginTop
                : L.marginBottom,
        startCh: maxWidthPx > 0 ? maxWidthPx / (fontSize * 0.52) : 0,
        linked: L.linkMargins,
        capBinds,
      }
      setDragging(side)
      // Freeze the chrome while dragging so it can't slide out from
      // under the pointer mid-gesture.
      useReaderStore.getState().setMarginDragging(true)
      useReaderStore.getState().hideChrome()

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current
        if (!d) return
        const horiz = d.side === 'left' || d.side === 'right'
        const pos = horiz ? ev.clientX : ev.clientY
        const delta = pos - d.startPos
        if (horiz && d.capBinds) {
          // Dragging an edge outward widens the column, inward narrows it.
          const sign = d.side === 'left' ? 2 : -2
          const ch = d.startCh + (sign * delta) / (fontSize * 0.52)
          const maxCh = Math.max(12, Math.floor((size.w - 24) / (fontSize * 0.52)))
          applyDrag(d.side, 0, d.linked, true, Math.min(140, Math.max(20, Math.min(maxCh, ch))))
          return
        }
        const raw = d.side === 'left' || d.side === 'top' ? d.startV + delta : d.startV - delta
        applyDrag(d.side, clampSide(d.side, raw, d.linked), d.linked, false, 0)
      }
      const end = () => {
        dragRef.current = null
        setDragging(null)
        // If the release happened over the iframe, no further parent-window
        // mousemove will fire — clear the highlight so the handle hides.
        setNear(null)
        useReaderStore.getState().setMarginDragging(false)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', end)
        el.removeEventListener('pointercancel', end)
        el.removeEventListener('lostpointercapture', end)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', end)
        window.removeEventListener('pointercancel', end)
      }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', end)
      el.addEventListener('pointercancel', end)
      el.addEventListener('lostpointercapture', end)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', end)
      window.addEventListener('pointercancel', end)
    },
    [applyDrag, geom, fontSize, size.w, maxWidthPx],
  )

  const clampSide = useCallback(
    (side: Side, v: number, linked: boolean): number => {
      const horizontal = side === 'left' || side === 'right'
      const axis = horizontal ? size.w : size.h
      const cap = horizontal ? Math.floor(axis * 0.45) : MAX_MARGIN_V
      const L = layoutRef.current
      const opp = linked
        ? v
        : side === 'left'
          ? L.marginRight
          : side === 'right'
            ? L.marginLeft
            : side === 'top'
              ? L.marginBottom
              : L.marginTop
      const limit = Math.max(0, Math.min(cap, axis - MIN_COLUMN - opp))
      return Math.round(Math.min(limit, Math.max(0, v)))
    },
    [size.w, size.h],
  )

  const nudge = useCallback(
    (side: Side, delta: number) => {
      const { L, capBinds } = geom()
      if (side !== 'top' && side !== 'bottom' && capBinds) {
        const ch = (maxWidthPx > 0 ? maxWidthPx : 0) / (fontSize * 0.52) + delta / (fontSize * 0.52)
        const maxCh = Math.max(12, Math.floor((size.w - 24) / (fontSize * 0.52)))
        applyDrag(side, 0, L.linkMargins, true, Math.min(140, Math.max(20, Math.min(maxCh, ch))))
        return
      }
      const cur =
        side === 'left'
          ? L.marginLeft
          : side === 'right'
            ? L.marginRight
            : side === 'top'
              ? L.marginTop
              : L.marginBottom
      applyDrag(side, clampSide(side, cur + delta, L.linkMargins), L.linkMargins, false, 0)
    },
    [applyDrag, clampSide, geom, fontSize, size.w, maxWidthPx],
  )

  if (size.w === 0) {
    return <div ref={boxRef} className="pointer-events-none absolute inset-x-0 top-14 bottom-14 z-20" />
  }

  const center = (v: number, span: number) => Math.max(H / 2, Math.min(span - H / 2, v))
  const { capBinds, leftEdge, rightEdge, colW, L } = { ...geom(), L: layoutRef.current }

  // Handles always sit on the actual text-column edge, whether that edge is
  // set by the margins or by the line-width cap. Both are normalized to
  // x-coordinates within the canvas box.
  const leftEdgeX = capBinds ? leftEdge : L.marginLeft
  const rightEdgeX = capBinds ? rightEdge : size.w - L.marginRight
  const hPos = { left: leftEdgeX, right: rightEdgeX }

  const sides: { side: Side; horizontal: boolean; value: number; capBinds?: boolean }[] = [
    {
      side: 'left',
      horizontal: true,
      value: capBinds ? Math.round(colW) : layout.marginLeft,
      capBinds,
    },
    // When the line-width cap binds, the two edges collapse onto the same
    // column edges — a single grip controls the width, so show only one.
    ...(capBinds
      ? []
      : [{ side: 'right' as Side, horizontal: true, value: layout.marginRight }]),
    { side: 'top', horizontal: false, value: layout.marginTop },
    { side: 'bottom', horizontal: false, value: layout.marginBottom },
  ]

  const posFor = (side: Side): CSSProperties => {
    // Offset the grip outward by GAP so it sits in the margin, not on the text.
    switch (side) {
      case 'left':
        return { left: center(hPos.left - GAP, size.w), top: '50%', transform: 'translate(-50%, -50%)' }
      case 'right':
        return { left: center(hPos.right + GAP, size.w), top: '50%', transform: 'translate(-50%, -50%)' }
      case 'top':
        return { top: center(layout.marginTop - GAP, size.h), left: '50%', transform: 'translate(-50%, -50%)' }
      case 'bottom':
        return { top: center(size.h - layout.marginBottom + GAP, size.h), left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  // Full-length edge line positions (the accent gradient that traces the
  // text-column edge while a handle is hovered or dragged).
  const lineFor = (side: Side): CSSProperties => {
    switch (side) {
      case 'left':
        return { left: hPos.left - 1, top: 0, bottom: 0, width: 2 }
      case 'right':
        return { left: hPos.right - 1, top: 0, bottom: 0, width: 2 }
      case 'top':
        return { top: layout.marginTop - 1, left: 0, right: 0, height: 2 }
      case 'bottom':
        return { top: size.h - layout.marginBottom - 1, left: 0, right: 0, height: 2 }
    }
  }

  // Floating value chip position — offset from the grip toward the margin.
  const chipFor = (side: Side): CSSProperties => {
    const off = 26
    switch (side) {
      case 'left':
        return { left: hPos.left + off, top: '50%', transform: 'translateY(-50%)' }
      case 'right':
        return { left: hPos.right - off, top: '50%', transform: 'translateX(-100%) translateY(-50%)' }
      case 'top':
        return { top: layout.marginTop + off, left: '50%', transform: 'translateX(-50%)' }
      case 'bottom':
        return { top: size.h - layout.marginBottom - off, left: '50%', transform: 'translate(-50%, -100%)' }
    }
  }

  if (panelOpen) {
    return <div ref={boxRef} className="pointer-events-none absolute inset-x-0 top-14 bottom-14 z-20" />
  }

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-x-0 top-14 bottom-14 z-20">
      {sides.map(({ side, horizontal, value, capBinds: cap }) => {
        const active = dragging === side || near === side
        const label = cap
          ? `Text column width: ${value}px — drag or use arrow keys to adjust`
          : `${side} margin: ${value}px — drag or use arrow keys to adjust`
        return (
          <div key={side} className="contents">
            {/* Edge tracer — a soft gradient line along the whole edge. */}
            <span
              aria-hidden
              style={lineFor(side)}
              className={cn(
                'absolute rounded-full transition-opacity duration-200',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              <span
                className="absolute inset-0"
                style={{
                  background: horizontal
                    ? 'linear-gradient(to bottom, transparent, var(--sp-accent) 18%, var(--sp-accent) 82%, transparent)'
                    : 'linear-gradient(to right, transparent, var(--sp-accent) 18%, var(--sp-accent) 82%, transparent)',
                }}
              />
            </span>

            {/* Grip — glassy capsule with grip dots, centered on the edge.
                The button is an enlarged invisible hit target around it. */}
            <button
              type="button"
              role="separator"
              aria-orientation={horizontal ? 'vertical' : 'horizontal'}
              aria-label={label}
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={horizontal ? Math.floor(size.w * 0.45) : MAX_MARGIN_V}
              title={cap ? `Text column · ${value}px` : `${side} margin · ${value}px`}
              tabIndex={0}
              onPointerDown={(e) => startDrag(side, e)}
              onKeyDown={(e) => {
                const step = e.shiftKey ? 16 : 2
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  nudge(side, -step)
                } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  nudge(side, step)
                }
              }}
              style={posFor(side)}
              className={cn(
                'pointer-events-auto group absolute flex touch-none items-center justify-center outline-none',
                horizontal ? 'h-20 w-7 cursor-ew-resize' : 'h-7 w-20 cursor-ns-resize',
              )}
            >
              <span
                className={cn(
                  'relative flex items-center justify-center rounded-full backdrop-blur-sm',
                  'transition-all duration-200',
                  horizontal ? 'h-16 w-[6px]' : 'h-[6px] w-16',
                  active
                    ? 'scale-110 bg-accent opacity-100 ring-1 ring-accent/50'
                    : 'bg-ink/15 opacity-0 ring-1 ring-ink/10 group-hover:bg-accent/70 group-hover:opacity-100 group-hover:ring-accent/30 group-focus-visible:bg-accent group-focus-visible:opacity-100 group-focus-visible:ring-accent/50',
                )}
              >
                {/* Grip dots */}
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'absolute rounded-full transition-colors duration-200',
                      horizontal ? 'h-[3px] w-[3px]' : 'h-[3px] w-[3px]',
                      active
                        ? 'bg-[var(--sp-on-accent)]'
                        : 'bg-transparent group-hover:bg-[var(--sp-on-accent)] group-focus-visible:bg-[var(--sp-on-accent)]',
                      horizontal
                        ? i === 0
                          ? 'top-4'
                          : i === 1
                            ? 'top-1/2 -translate-y-1/2'
                            : 'bottom-4'
                        : i === 0
                          ? 'left-4'
                          : i === 1
                            ? 'left-1/2 -translate-x-1/2'
                            : 'right-4',
                    )}
                  />
                ))}
              </span>
            </button>

            {/* Value chip — floats next to the grip while active. */}
            <span
              aria-hidden
              style={chipFor(side)}
              className={cn(
                'absolute rounded-full border border-edge bg-surface px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink',
                'transition-all duration-200',
                dragging === side
                  ? 'scale-100 opacity-100'
                  : active
                    ? 'scale-95 opacity-90'
                    : 'scale-90 opacity-0',
              )}
            >
              {value}px
            </span>
          </div>
        )
      })}
    </div>
  )
}
