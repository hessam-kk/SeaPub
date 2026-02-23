import { Monitor, Moon, Sun } from 'lucide-react'
import { SegmentedControl, Toggle, ColorField } from '@/components/ui/controls'
import { READING_PRESETS } from '@/core/theme/presets'
import { suggestTextColor } from '@/core/theme/contrast'
import type { AppearanceSettings, SettingsPatch, ThemeMode } from '@/types/settings'
import { Section } from './shared'
import { cn } from '@/core/utils/cn'

export function ThemeSection({
  appearance,
  update,
}: {
  appearance: AppearanceSettings
  update: (patch: SettingsPatch) => void
}) {
  const setA = (patch: Partial<AppearanceSettings>) => update({ appearance: patch })

  return (
    <Section title="Theme">
      <SegmentedControl<ThemeMode>
        label="Color mode"
        value={appearance.mode}
        onChange={(mode) => setA({ mode })}
        options={[
          { value: 'light', label: 'Light', icon: <Sun size={13} /> },
          { value: 'dark', label: 'Dark', icon: <Moon size={13} /> },
          { value: 'system', label: 'System', icon: <Monitor size={13} /> },
        ]}
      />

      <div>
        <div className="mb-2 text-[13px] text-ink">Reading background</div>
        <div className="grid grid-cols-4 gap-2">
          {READING_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setA({ preset: p.id, customBg: null, customText: null })}
              aria-pressed={appearance.preset === p.id}
              title={p.name}
              className={cn(
                'flex h-14 flex-col items-center justify-center rounded-[10px] border text-[12px] font-medium transition-all duration-150',
                'hover:scale-[1.03]',
                appearance.preset === p.id && !appearance.customBg
                  ? 'border-accent ring-2 ring-[var(--sp-accent-soft)]'
                  : 'border-edge',
              )}
              style={{ background: p.bg, color: p.text }}
            >
              Aa
              <span className="mt-0.5 text-[9.5px] opacity-75">{p.name}</span>
            </button>
          ))}
          <button
            onClick={() => setA({ preset: 'custom', customBg: appearance.customBg ?? '#FBF9F4' })}
            aria-pressed={appearance.preset === 'custom'}
            title="Custom colors"
            className={cn(
              'flex h-14 flex-col items-center justify-center rounded-[10px] border transition-all duration-150 hover:scale-[1.03]',
              appearance.preset === 'custom'
                ? 'border-accent ring-2 ring-[var(--sp-accent-soft)]'
                : 'border-edge',
            )}
            style={{
              background:
                'linear-gradient(135deg, #FBF9F4 0%, #F4E8D1 33%, #E8F0F2 66%, #151C2C 100%)',
              color: '#26303B',
            }}
          >
            Aa
            <span className="mt-0.5 text-[9.5px] opacity-75">Custom</span>
          </button>
        </div>
      </div>

      <ColorField
        label="Custom background"
        value={appearance.customBg}
        onChange={(hex) =>
          hex
            ? setA({ preset: 'custom', customBg: hex })
            : setA({ customBg: null, customText: null, preset: 'paper' })
        }
      />
      <ColorField
        label="Custom text color"
        value={appearance.customText}
        onAuto={() => setA({ customText: null })}
        onChange={(hex) => setA({ customText: hex })}
      />
      {appearance.customBg && !appearance.customText && (
        <p className="-mt-1.5 text-[11.5px] text-ink-2">
          Suggested for contrast:{' '}
          <button
            className="font-mono text-accent underline-offset-2 hover:underline"
            onClick={() => setA({ customText: suggestTextColor(appearance.customBg!) })}
          >
            {suggestTextColor(appearance.customBg)}
          </button>
        </p>
      )}

      <Toggle
        checked={appearance.highContrast}
        onChange={(highContrast) => setA({ highContrast })}
        label="High contrast interface"
        description="Stronger text and borders for the app chrome"
      />
    </Section>
  )
}
