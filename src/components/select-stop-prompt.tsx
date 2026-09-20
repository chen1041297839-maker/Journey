import { EmptyState } from "@/components/empty-state"

export function SelectStopPrompt() {
  return (
    <EmptyState
      className="min-h-[420px]"
      title="点开一站，看店铺和机位"
      description="左边是今天的路线。每一站都整理了店、必买、拍照站位，以及按当天行程写的穿搭。手机上直接点时间线里的站点。"
    />
  )
}
