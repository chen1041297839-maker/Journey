"use client"

import { useEffect, useId, useRef } from "react"
import "leaflet/dist/leaflet.css"
import type { Day, GeoPoint } from "@/data/types"
import { gcj02ToWgs84 } from "@/lib/geo"
import { visibleFactNames } from "@/lib/stop-facts"

function wgs(point: GeoPoint): [number, number] {
  const converted = point.system === "WGS-84" ? point : gcj02ToWgs84(point.lat, point.lng)
  return [converted.lat, converted.lng]
}

export function DayRouteMap({ day }: { day: Day }) {
  const hostId = useId().replace(/:/g, "")
  const mapRef = useRef<HTMLDivElement>(null)
  const located = day.stops.filter((stop) => stop.location)
  const hungShops = day.stops.flatMap((stop) =>
    stop.shops
      .filter((shop) => shop.mapPick || shop.location)
      .map((shop) => ({ shop, stopName: stop.name, facts: visibleFactNames(stop) }))
  )

  useEffect(() => {
    if (!mapRef.current || located.length === 0) return
    let cancelled = false
    let map: import("leaflet").Map | null = null

    async function mount() {
      const leaflet = await import("leaflet")
      if (cancelled || !mapRef.current) return
      const L = leaflet.default
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })
      const points = located.map((stop) => wgs(stop.location as GeoPoint))
      map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(points[0], 14)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)
      const line = L.polyline(points, { color: "#111111", weight: 2, opacity: 0.9 }).addTo(map)
      located.forEach((stop, index) => {
        L.circleMarker(wgs(stop.location as GeoPoint), {
          radius: 6,
          color: "#111111",
          fillColor: "#fdfcf8",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(`${String(index + 1).padStart(2, "0")} ${stop.name}`)
          .addTo(map as import("leaflet").Map)
      })
      hungShops.forEach(({ shop, stopName }) => {
        if (!shop.location) return
        L.circleMarker(wgs(shop.location), {
          radius: 5,
          color: "#2f56ff",
          fillColor: "#2f56ff",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(
            `<strong>${shop.name}</strong><br/>挂在 ${stopName}${
              shop.mapPick?.why ? `<br/>${shop.mapPick.why}` : ""
            }`
          )
          .addTo(map as import("leaflet").Map)
      })
      map.fitBounds(line.getBounds().pad(0.18))
      requestAnimationFrame(() => {
        map?.invalidateSize()
      })
    }

    void mount()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [day.id, located.length, hungShops.length])

  return (
    <figure className="flex w-full min-w-0 flex-col gap-2">
      {located.length === 0 ? (
        <p className="cjk-flow border border-border px-4 py-10 text-sm leading-7 text-muted-foreground">
          这一天还没有坐标。导入圆周旅迹后会按原顺序画路线。
        </p>
      ) : (
        <div
          id={`day-map-${hostId}`}
          ref={mapRef}
          className="h-[320px] w-full overflow-hidden rounded-md border border-border bg-muted sm:h-[420px]"
        />
      )}
      <figcaption className="text-xs leading-6 text-muted-foreground">
        黑线按导入顺序走，没有重排。
        {hungShops.length > 0 ? ` 蓝点是沿路挂上的 ${hungShops.length} 家店，写在对应站点里。` : ""}
      </figcaption>
    </figure>
  )
}
