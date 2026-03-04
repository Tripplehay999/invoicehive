import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "InvoiceHive – Free Professional Invoicing for Nigerian SMEs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex" }} />

        {/* Logo badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.2)", marginBottom: 32 }}>
          <span style={{ fontSize: 40, color: "#ffffff" }}>🐝</span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 72, fontWeight: 900, color: "#ffffff", letterSpacing: "-2px", textAlign: "center", lineHeight: 1.1, marginBottom: 20, display: "flex" }}>
          InvoiceHive
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.9)", textAlign: "center", fontWeight: 500, maxWidth: 800, lineHeight: 1.4, display: "flex" }}>
          Free Professional Invoicing for Nigerian SMEs
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          {["✅ Free Forever", "✅ 6 Templates", "✅ WHT Compliant"].map((label) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "10px 24px", fontSize: 18, color: "#ffffff", fontWeight: 600, display: "flex" }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
