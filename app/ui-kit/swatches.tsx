const COLORS = [
  { name: "ink", value: "#111111", className: "bg-ink" },
  { name: "page", value: "#E4E4DE", className: "bg-page" },
  { name: "surface", value: "#FFFFFF", className: "bg-surface" },
  { name: "primary", value: "#FFE600", className: "bg-primary" },
  { name: "muted-fg", value: "#57574F", className: "bg-muted-foreground" },
  { name: "destructive", value: "#D92D20", className: "bg-destructive" },
]

const SHADOWS = [
  { name: "shadow-brutal-xs", value: "2px 2px", className: "shadow-brutal-xs" },
  { name: "shadow-brutal-sm", value: "3px 3px", className: "shadow-brutal-sm" },
  { name: "shadow-brutal-md", value: "4px 4px", className: "shadow-brutal-md" },
  { name: "shadow-brutal-lg", value: "5px 5px", className: "shadow-brutal-lg" },
  { name: "shadow-brutal-xl", value: "6px 6px", className: "shadow-brutal-xl" },
]

export function Swatches() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {COLORS.map((c) => (
          <div key={c.name} className="flex flex-col gap-2">
            <div className={`h-16 border-[3px] border-ink ${c.className}`} />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-bold uppercase">{c.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{c.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-8">
        {SHADOWS.map((s) => (
          <div key={s.name} className="flex flex-col gap-3">
            <div
              className={`flex size-20 items-center justify-center border-[3px] border-ink bg-surface ${s.className}`}
            >
              <span className="font-mono text-[12px] font-bold">{s.value}</span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-2xl font-bold">
          Space Grotesk — prose, headings, message bodies
        </p>
        <p className="font-mono text-sm font-bold tracking-[0.12em] uppercase">
          Space Mono — buttons, labels, tags, timestamps
        </p>
      </div>
    </div>
  )
}
