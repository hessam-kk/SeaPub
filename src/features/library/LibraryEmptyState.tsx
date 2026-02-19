import { Button } from '@/components/ui/Button'
import { ShoreIllustration } from '@/components/ui/brand'

export function LibraryEmptyState({ onOpenPicker }: { onOpenPicker: () => void }) {
  return (
    <div className="flex h-full min-h-100 flex-col items-center justify-center gap-5 py-16 text-center">
      <ShoreIllustration />
      <div className="max-w-sm">
        <h2 className="text-[19px] font-semibold text-ink">Your library is calm and empty.</h2>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
          Add a DRM-free EPUB to begin. Everything stays on your device — your books never leave
          this quiet place.
        </p>
      </div>
      <Button variant="primary" onClick={onOpenPicker}>
        Open your first EPUB
      </Button>
      <p className="text-[12px] text-ink-2">…or drop an EPUB anywhere in this window.</p>
    </div>
  )
}
