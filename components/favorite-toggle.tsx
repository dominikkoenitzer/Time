"use client"

import { StarIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

/** Saves a city to the world-clock grid on the home page. */
export function FavoriteToggle({ zone, city }: { zone: string; city: string }) {
  const { favorites, toggleFavorite } = useFavorites()
  const saved = favorites.includes(zone)

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={saved}
      onClick={() => toggleFavorite(zone)}
      className="text-muted-foreground"
    >
      <HugeiconsIcon
        icon={StarIcon}
        strokeWidth={2}
        className={cn(saved && "fill-amber-400 text-amber-500")}
      />
      {saved ? "In your world clocks" : `Add ${city} to your world clocks`}
    </Button>
  )
}
