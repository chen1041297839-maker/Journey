import type { GeoPoint } from "@/data/types"

const A = 6378245
const EE = 0.00669342162296594323
const WALK_KMH = 4.5

export type LngLat = { lat: number; lng: number }

export function outOfChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(x: number, y: number): number {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  result += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  result += ((20 * Math.sin(y * Math.PI) + 40 * Math.sin((y / 3) * Math.PI)) * 2) / 3
  result += ((160 * Math.sin((y / 12) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30)) * 2) / 3
  return result
}

function transformLng(x: number, y: number): number {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  result += ((20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2) / 3
  result += ((20 * Math.sin(x * Math.PI) + 40 * Math.sin((x / 3) * Math.PI)) * 2) / 3
  result += ((150 * Math.sin((x / 12) * Math.PI) + 300 * Math.sin((x / 30) * Math.PI)) * 2) / 3
  return result
}

/** 高德 / 圆周旅迹 GCJ-02 → OSM 瓦片用的 WGS-84 */
export function gcj02ToWgs84(lat: number, lng: number): LngLat {
  if (outOfChina(lat, lng)) return { lat, lng }
  const dLat = transformLat(lng - 105, lat - 35)
  const dLng = transformLng(lng - 105, lat - 35)
  const radLat = (lat / 180) * Math.PI
  const magic = 1 - EE * Math.sin(radLat) * Math.sin(radLat)
  const sqrtMagic = Math.sqrt(magic)
  const latOffset = (dLat * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI)
  const lngOffset = (dLng * 180) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI)
  return { lat: lat - latOffset, lng: lng - lngOffset }
}

export function toWgs84(point: GeoPoint | LngLat & { system?: GeoPoint["system"] }): LngLat {
  if (point.system === "WGS-84") return { lat: point.lat, lng: point.lng }
  return gcj02ToWgs84(point.lat, point.lng)
}

export function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / WALK_KMH) * 60))
}

export function roundKm(km: number): number {
  return Math.round(km * 10) / 10
}

/** 把一个点插进相邻两站之间，比原路多走多少公里 */
export function detourKm(prev: LngLat, next: LngLat, poi: LngLat): number {
  return Math.max(0, haversineKm(prev, poi) + haversineKm(poi, next) - haversineKm(prev, next))
}
