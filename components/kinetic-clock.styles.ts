import type * as React from "react"

/** The inline styles the kinetic clock shares across its five stations. */

export const mono = "var(--font-kinetic-mono)"

export const station: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 40px",
  opacity: 0,
  willChange: "opacity, transform",
  // Dark shadow (inherited by all station text) so captions stay legible over
  // the bright sage field.
  textShadow: "0 1px 4px rgba(0, 0, 0, 0.85), 0 0 18px rgba(0, 0, 0, 0.5)",
}
export const stationLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#cfcfc7",
  marginBottom: 28,
}
export const stationSub: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 13,
  lineHeight: 1.75,
  color: "#deded7",
  maxWidth: 540,
  marginTop: 30,
}
export const headline: React.CSSProperties = {
  fontWeight: 500,
  letterSpacing: "-0.025em",
  fontSize: "clamp(30px, 6.4vw, 92px)",
  lineHeight: 1.02,
}
export const railLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#5a5a54",
}
export const railDot: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  border: "1px solid #4a4a44",
}

export const RAIL = [
  "The second",
  "Today",
  "This year",
  "The epoch",
  "Right now",
]
