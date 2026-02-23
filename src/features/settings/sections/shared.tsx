import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-edge py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-ink-2 uppercase">
        {title}
      </h3>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  )
}
