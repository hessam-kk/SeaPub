import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/controls'
import type { SettingsPatch, TypographySettings } from '@/types/settings'
import { Section } from './shared'

export function AdvancedSection({
  typography,
  scope,
  update,
  onResetBook,
  onResetGlobal,
}: {
  typography: TypographySettings
  scope: 'global' | 'book'
  update: (patch: SettingsPatch) => void
  onResetBook?: () => void
  onResetGlobal: () => void
}) {
  return (
    <Section title="Advanced">
      <Toggle
        checked={typography.customCssEnabled}
        onChange={(customCssEnabled) => update({ typography: { customCssEnabled } })}
        label="Custom CSS"
        description="Apply your own stylesheet to book content"
      />
      {typography.customCssEnabled && (
        <textarea
          className="sp-input font-mono text-[12px]"
          rows={6}
          spellCheck={false}
          placeholder={'p {\n  text-indent: 1.2em;\n}'}
          value={typography.customCss}
          onChange={(e) => update({ typography: { customCss: e.target.value } })}
          aria-label="Custom CSS"
        />
      )}

      <div className="flex flex-col gap-2 border-t border-edge pt-4">
        {scope === 'book' && onResetBook && (
          <Button variant="secondary" onClick={onResetBook}>
            Reset this book's settings
          </Button>
        )}
        <Button variant="danger" onClick={onResetGlobal}>
          Reset all global defaults
        </Button>
      </div>
    </Section>
  )
}
