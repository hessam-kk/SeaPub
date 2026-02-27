import { useEffect, useRef, useState } from 'react'
import { Copy, Highlighter, NotebookPen } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import type { EpubRenderer } from '@/core/epub/renderer/types'
import { useReaderStore } from '@/state/readerStore'
import { useAnnotationStore } from '@/state/annotationStore'
import { toast } from '@/state/toastStore'

const HIGHLIGHT_COLOR = '#FFE9A8'

export function SelectionPopover({
  rendererRef,
}: {
  rendererRef: React.RefObject<EpubRenderer | null>
}) {
  const selection = useReaderStore((s) => s.selection)
  const setSelection = useReaderStore((s) => s.setSelection)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setNoteOpen(false)
    setNoteText('')
  }, [selection?.cfi])

  useEffect(() => {
    if (!selection) return
    const onDown = (e: PointerEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setSelection(null)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [selection, setSelection])

  if (!selection || !selection.rect) return null

  const margin = 120
  const x = Math.min(Math.max(selection.rect.left + selection.rect.width / 2, margin), window.innerWidth - margin)
  const above = selection.rect.top > 92
  const y = above ? selection.rect.top - 54 : selection.rect.bottom + 10

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(selection.text)
      toast.success('Copied to clipboard.')
    } catch {
      toast.error('Copying was blocked by the browser.')
    }
    setSelection(null)
  }

  const highlight = (note = '') => {
    const rs = useReaderStore.getState()
    void useAnnotationStore
      .getState()
      .add({
        kind: note ? 'note' : 'highlight',
        cfi: selection.cfi,
        excerpt: selection.text.slice(0, 240),
        section: rs.section,
        note,
        color: HIGHLIGHT_COLOR,
      })
      .then((ann) => {
        if (ann) rendererRef.current?.addHighlight(ann.cfi, ann.color)
      })
    toast.success(note ? 'Note saved.' : 'Highlighted.')
    setSelection(null)
  }

  return (
    <div
      ref={popoverRef}
      role="toolbar"
      aria-label="Selection actions"
      className="fixed z-50 -translate-x-1/2"
      style={{ left: x, top: Math.max(8, y) }}
    >
      {noteOpen ? (
        <div className="w-72 rounded-xl border border-edge bg-surface p-2 shadow-elevated">
          <textarea
            autoFocus
            rows={3}
            className="sp-input resize-none text-[13px]"
            placeholder="Add a note…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="mt-2 flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!noteText.trim()}
              onClick={() => highlight(noteText.trim())}
            >
              Save note
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 rounded-xl border border-edge bg-surface p-1 shadow-elevated">
          <IconButton label="Copy" onClick={() => void copy()}>
            <Copy size={15} />
          </IconButton>
          <IconButton label="Highlight" onClick={() => highlight()}>
            <Highlighter size={15} />
          </IconButton>
          <IconButton label="Add note" onClick={() => setNoteOpen(true)}>
            <NotebookPen size={15} />
          </IconButton>
        </div>
      )}
    </div>
  )
}
