import { EmptyState } from "@/components/empty-state"

export function SelectStopPrompt() {
  return (
    <EmptyState
      className="min-h-[420px]"
      title="点开一站，看店铺和机位"
      description="上面是当天地图（圆周旅迹顺序）。点时间线里的站点看店铺、必买、鸡爪这类要点和机位。手机上地图也留在顶上。"
    />
  )
}
