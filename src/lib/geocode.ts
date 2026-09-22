import type { GeoPoint } from "@/data/types"

export type GeocodedPlace = {
  name: string
  address: string
  location: GeoPoint
  source: "nominatim" | "overpass" | "curated"
}

const GUIYANG_VIEW = "26.4,106.5,26.75,107.0"

function asNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN
  return Number.isFinite(n) ? n : null
}

async function nominatim(query: string): Promise<GeocodedPlace[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "6")
  url.searchParams.set("accept-language", "zh-CN")
  url.searchParams.set("viewbox", "106.5,26.75,107.0,26.4")
  url.searchParams.set("bounded", "0")
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "XeniaItinerary/1.0 (personal travel planner)",
    },
    cache: "no-store",
  })
  if (!response.ok) return []
  const rows = (await response.json()) as {
    display_name?: string
    lat?: string
    lon?: string
    name?: string
  }[]
  const mapped: GeocodedPlace[] = []
  for (const row of rows) {
    const lat = asNumber(row.lat)
    const lng = asNumber(row.lon)
    if (lat == null || lng == null) continue
    mapped.push({
      name: row.name || query,
      address: row.display_name || "",
      location: { lat, lng, system: "WGS-84", address: row.display_name },
      source: "nominatim",
    })
  }
  return mapped
}

async function overpass(name: string): Promise<GeocodedPlace[]> {
  const q = name.replace(/"/g, "").slice(0, 40)
  const body = `[out:json][timeout:20];
(
  node["name"~"${q}"](${GUIYANG_VIEW});
  way["name"~"${q}"](${GUIYANG_VIEW});
  node["name:zh"~"${q}"](${GUIYANG_VIEW});
);
out center 8;`
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "XeniaItinerary/1.0 (personal travel planner)",
    },
    body: `data=${encodeURIComponent(body)}`,
    cache: "no-store",
  })
  if (!response.ok) return []
  const payload = (await response.json()) as {
    elements?: {
      tags?: { name?: string; "name:zh"?: string; "addr:full"?: string; "addr:street"?: string }
      lat?: number
      lon?: number
      center?: { lat?: number; lon?: number }
    }[]
  }
  const mapped: GeocodedPlace[] = []
  for (const el of payload.elements || []) {
    const lat = el.lat ?? el.center?.lat
    const lng = el.lon ?? el.center?.lon
    if (lat == null || lng == null) continue
    const label = el.tags?.name || el.tags?.["name:zh"] || name
    const address = el.tags?.["addr:full"] || el.tags?.["addr:street"] || ""
    mapped.push({
      name: label,
      address,
      location: { lat, lng, system: "WGS-84", address },
      source: "overpass",
    })
  }
  return mapped
}

export async function geocodePublic(query: string): Promise<GeocodedPlace[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const withCity = /贵阳|肇兴|黎平|荔波/.test(trimmed) ? trimmed : `贵阳 ${trimmed}`
  try {
    const first = await nominatim(withCity)
    if (first.length > 0) return first
  } catch {
    /* public geocoder optional */
  }
  try {
    return await overpass(trimmed.replace(/贵阳|市|区/g, "").trim() || trimmed)
  } catch {
    return []
  }
}
