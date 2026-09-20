import type { PhotoSpot } from "@/data/types"
import { ShotFrame } from "@/components/shot-frame"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PhotoSpotCard({ spot, index }: { spot: PhotoSpot; index: number }) {
  return (
    <Card className="bg-card">
      <CardHeader className="border-b">
        <p className="text-[11px] tracking-[0.18em] text-primary uppercase">
          机位 {String(index + 1).padStart(2, "0")}
        </p>
        <CardTitle className="font-heading text-xl">{spot.title}</CardTitle>
        <CardDescription>最佳时段 {spot.bestTime}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-[minmax(0,180px)_1fr]">
        <ShotFrame composition={spot.composition} />
        <dl className="grid gap-3 text-sm">
          <Fact label="站在哪" value={spot.standWhere} />
          <Fact label="角度" value={spot.angle} />
          <Fact label="画面长这样" value={spot.shotLooksLike} />
          <Fact label="镜头" value={spot.lens} />
          <Fact label="避坑" value={spot.avoid} />
        </dl>
      </CardContent>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 leading-relaxed text-foreground">{value}</dd>
    </div>
  )
}
