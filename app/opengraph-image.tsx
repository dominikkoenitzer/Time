import { ImageResponse } from "next/og"

export const alt = "Time — the exact time, anywhere"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "monospace",
      }}
    >
      <div style={{ display: "flex", fontSize: 160, fontWeight: 600 }}>
        12:00<span style={{ color: "#a3bd93" }}>:00</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: "#a3a3a3",
          fontFamily: "sans-serif",
        }}
      >
        Time — the exact time, anywhere
      </div>
    </div>,
    size
  )
}
