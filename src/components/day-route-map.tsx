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
      const line = L.polyline(points, { color: "#b4532a", weight: 3, opacity: 0.85 }).addTo(map)
      located.forEach((stop, index) => {
        L.circleMarker(wgs(stop.location as GeoPoint), {
          radius: 6,
          color: "#b4532a",
          fillColor: "#fff7ed",
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
          color: "#0f766e",
          fillColor: "#99f6e4",
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
    <section className="grid gap-3 rounded-2xl border border-border bg-card px-4 py-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-primary">当天路线 · 圆周旅迹顺序</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">
          棕线按导入顺序走，没有重排。青色点是挂在已有站上的店。
        </p>
      </div>
      <ol className="flex flex-wrap gap-2 text-sm">
        {day.stops.map((stop, index) => (
          <li
            key={stop.id}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs leading-relaxed"
          >
            <span className="tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>{" "}
            {stop.name.replace(/[（(].*$/, "")}
          </li>
        ))}
      </ol>
      {located.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          这一天还没有坐标。导入圆周旅迹后会按原顺序画路线。
        </p>
      ) : (
        <div
          id={`day-map-${hostId}`}
          ref={mapRef}
          className="h-[320px] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:h-[380px]"
        />
      )}
      {hungShops.length > 0 ? (
        <ul className="grid gap-1 text-sm leading-relaxed">
          {hungShops.map(({ shop, stopName }) => (
            <li key={`${shop.id}-${stopName}`}>
              <span className="text-primary">{shop.name}</span>
              {shop.whatToLookFor ? ` · ${shop.whatToLookFor}` : ""}
              <span className="text-muted-foreground"> · 挂在{stopName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">这一天还没有沿路挂上的店。</p>
      )}
    </section>
  )
}
