import { Clock } from "@/components/clock"
import { LiveTitle } from "@/components/live-title"
import { RecentZones } from "@/components/recent-zones"
import { SyncStatus } from "@/components/sync-status"
import { WorldClocks } from "@/components/world-clocks"

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pb-16 sm:px-6">
      <LiveTitle label="Time" />
      <div className="flex flex-col gap-4 pt-6">
        <Clock />
        <SyncStatus />
      </div>
      <RecentZones />
      <WorldClocks />
    </div>
  )
}
