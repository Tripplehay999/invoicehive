import type { TemplateStyle } from "@/lib/types";

interface TemplateConfig {
  headerBg: (brandColor: string) => React.CSSProperties;
  headerTextColor: (brandColor: string) => string; // hex color
  tableTh: string;
  tableRowAlt: string;
  totalBorderColor: string;
  totalAccentClass: string;
  wrapperClass: string;
  badgeBg: (brandColor: string) => React.CSSProperties;
}

const TEMPLATES: Record<TemplateStyle, TemplateConfig> = {
  classic: {
    headerBg: (color) => ({ backgroundColor: color }),
    headerTextColor: () => "#ffffff",
    tableTh: "bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider",
    tableRowAlt: "even:bg-slate-50/50",
    totalBorderColor: "border-slate-200",
    totalAccentClass: "text-amber-600",
    wrapperClass: "bg-white rounded-2xl shadow-sm overflow-hidden",
    badgeBg: (color) => ({ backgroundColor: color + "25", color }),
  },
  modern: {
    headerBg: () => ({ backgroundColor: "#0f172a" }),
    headerTextColor: () => "#ffffff",
    tableTh: "bg-slate-900 text-slate-400 font-medium uppercase text-xs tracking-wider",
    tableRowAlt: "even:bg-slate-50/60 hover:bg-slate-50",
    totalBorderColor: "border-slate-900",
    totalAccentClass: "text-slate-900 font-black",
    wrapperClass: "bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200",
    badgeBg: () => ({ backgroundColor: "#0f172a", color: "#ffffff" }),
  },
  minimal: {
    headerBg: () => ({ backgroundColor: "#ffffff", borderBottom: "2px solid #e2e8f0" }),
    headerTextColor: () => "#0f172a",
    tableTh: "border-b-2 border-slate-900 text-slate-900 font-bold uppercase text-xs tracking-wider",
    tableRowAlt: "border-b border-slate-100",
    totalBorderColor: "border-slate-900",
    totalAccentClass: "text-slate-900",
    wrapperClass: "bg-white rounded-2xl shadow-sm overflow-hidden",
    badgeBg: () => ({ backgroundColor: "#f8fafc", color: "#1e293b", border: "1px solid #e2e8f0" }),
  },
  professional: {
    headerBg: () => ({ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)" }),
    headerTextColor: () => "#ffffff",
    tableTh: "bg-[#1e3a5f] text-[#93c5fd] font-semibold uppercase text-xs tracking-wider",
    tableRowAlt: "even:bg-blue-50/40 hover:bg-blue-50/60",
    totalBorderColor: "border-[#1e3a5f]",
    totalAccentClass: "text-[#1e3a5f] font-bold",
    wrapperClass: "bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200",
    badgeBg: () => ({ background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)", color: "#ffffff" }),
  },
  executive: {
    headerBg: () => ({ backgroundColor: "#1c1c1e" }),
    headerTextColor: () => "#f5f5f7",
    tableTh: "bg-zinc-100 text-zinc-600 font-semibold uppercase text-xs tracking-wider border-b border-zinc-200",
    tableRowAlt: "even:bg-zinc-50/60 hover:bg-zinc-50 border-b border-zinc-100",
    totalBorderColor: "border-zinc-800",
    totalAccentClass: "text-zinc-900 font-bold",
    wrapperClass: "bg-white rounded-2xl shadow-sm overflow-hidden border border-zinc-200",
    badgeBg: () => ({ backgroundColor: "#1c1c1e", color: "#f5f5f7" }),
  },
  vibrant: {
    headerBg: (color) => ({ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }),
    headerTextColor: () => "#ffffff",
    tableTh: "text-slate-600 font-semibold uppercase text-xs tracking-wider border-b-2 border-slate-200",
    tableRowAlt: "even:bg-slate-50/40 border-b border-slate-100",
    totalBorderColor: "border-slate-200",
    totalAccentClass: "font-bold",
    wrapperClass: "bg-white rounded-2xl shadow-lg overflow-hidden",
    badgeBg: (color) => ({ backgroundColor: color, color: "#ffffff", borderRadius: "999px" }),
  },
};

export function getTemplate(style: TemplateStyle | undefined): TemplateConfig {
  return TEMPLATES[style ?? "classic"];
}

/* ── Mini template preview cards for the settings picker ── */
interface TemplatePreviewProps {
  style: TemplateStyle;
  selected: boolean;
  onClick: () => void;
}

const PREVIEW_LABELS: Record<TemplateStyle, { name: string; desc: string }> = {
  classic: { name: "Classic", desc: "Brand color header" },
  modern: { name: "Modern", desc: "Dark & bold" },
  minimal: { name: "Minimal", desc: "Clean & airy" },
  professional: { name: "Professional", desc: "Navy corporate" },
  executive: { name: "Executive", desc: "Charcoal & zinc" },
  vibrant: { name: "Vibrant", desc: "Gradient & playful" },
};

const PREVIEW_STYLES: Record<TemplateStyle, { header: string; lineColor: string; accent: string }> = {
  classic: { header: "bg-amber-500", lineColor: "bg-slate-200", accent: "bg-amber-500" },
  modern: { header: "bg-slate-900", lineColor: "bg-slate-300", accent: "bg-slate-900" },
  minimal: { header: "bg-white border-b-2 border-slate-900", lineColor: "bg-slate-200", accent: "bg-slate-900" },
  professional: { header: "bg-[#1e3a5f]", lineColor: "bg-blue-200", accent: "bg-[#1e3a5f]" },
  executive: { header: "bg-zinc-900", lineColor: "bg-zinc-200", accent: "bg-zinc-900" },
  vibrant: { header: "bg-gradient-to-br from-amber-400 to-amber-600", lineColor: "bg-slate-200", accent: "bg-amber-500" },
};

export function TemplatePreviewCard({ style, selected, onClick }: TemplatePreviewProps) {
  const p = PREVIEW_STYLES[style];
  const { name, desc } = PREVIEW_LABELS[style];

  return (
    <button
      onClick={onClick}
      className={`relative border-2 rounded-xl p-3 transition-all text-left ${
        selected
          ? "border-amber-500 shadow-md shadow-amber-100"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {/* Mini invoice mockup */}
      <div className="w-full aspect-[3/4] bg-white rounded-lg overflow-hidden border border-slate-100 mb-2">
        <div className={`h-[28%] ${p.header} flex items-end p-1.5`}>
          <div className="w-4 h-1.5 bg-white/40 rounded-sm" />
        </div>
        <div className="p-1.5 space-y-1">
          <div className={`h-1 w-3/4 ${p.lineColor} rounded-full`} />
          <div className={`h-1 w-1/2 ${p.lineColor} rounded-full opacity-60`} />
          <div className="mt-2 space-y-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-1">
                <div className={`h-0.5 flex-1 ${p.lineColor} rounded-full opacity-50`} />
                <div className={`h-0.5 w-4 ${p.lineColor} rounded-full opacity-70`} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <div className={`h-1 w-1/3 ${p.accent} rounded-full opacity-80`} />
          </div>
        </div>
      </div>
      <p className="text-xs font-bold text-slate-900">{name}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
    </button>
  );
}
