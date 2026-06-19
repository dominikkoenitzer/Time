import { KineticClock } from "@/components/kinetic-clock"
import { LiveTitle } from "@/components/live-title"

export default function Page() {
  return (
    <>
      <LiveTitle label="Time" />
      <KineticClock />
    </>
  )
}
