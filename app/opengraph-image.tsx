import { ImageResponse } from "next/og"

import { SITE_TITLE } from "@/lib/site"

export const alt = SITE_TITLE
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * The social card is the page, standing still: the same neutral greyscale, the same
 * flush-left composition, and the colons carrying the only colour on the site.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 34,
        padding: "0 96px",
        backgroundColor: "#0a0a0a",
        color: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: "0.28em",
          color: "#8f8f8f",
        }}
      >
        THE EXACT CURRENT TIME
      </div>
      <div style={{ display: "flex", fontSize: 184, letterSpacing: "-0.03em" }}>
        12<span style={{ color: "#e4322b" }}>:</span>04
        <span style={{ color: "#e4322b" }}>:</span>
        <span style={{ color: "#8f8f8f" }}>37</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: "0.2em",
          color: "#8f8f8f",
        }}
      >
        SYNCHRONISED WITH THE SERVER
      </div>
    </div>,
    size
  )
}
