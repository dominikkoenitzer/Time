import { getServerTime } from "@/lib/server-time"

export const dynamic = "force-dynamic"
export const runtime = "nodejs" // needs node:dgram for the NTP query

export async function GET() {
  const time = await getServerTime()

  return Response.json(time, {
    headers: { "Cache-Control": "no-store" },
  })
}
