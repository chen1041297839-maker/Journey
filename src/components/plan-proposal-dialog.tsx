"use client"

import { Dialog } from "@base-ui/react/dialog"
import type { PlanMode, PlanProposal } from "@/data/types"
import { Button } from "@/components/ui/button"

export function PlanProposalDialog({
  open,
  onOpenChange,
  proposal,
  planMode,
  onKeep,
  onApply,
  onRevert,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: PlanProposal
  planMode: PlanMode
  onKeep: () => void
  onApply: () => void
  onRevert: () => void
}) {
  const suggested = planMode === "suggested"

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !suggested) onKeep()
        onOpenChange(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(90vh,720px)] w-[min(100%-2rem,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
          <div className="border-b px-5 py-4">
            <Dialog.Title className="font-heading text-xl">
              {suggested ? "当前已采用规划建议" : "规划建议，还没改你的行程"}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {suggested
                ? "时间线现在是建议顺序。可以恢复圆周旅迹导入顺序。"
                : proposal.summary}
            </Dialog.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-4 px-5 py-4">
              {proposal.changes.map((change, index) => (
                <section
                  key={`${change.dayTitle}-${index}`}
                  className="rounded-xl border border-border bg-card px-3 py-3"
                >
                  <p className="font-heading text-base">{change.dayTitle}</p>
                  <p className="mt-1 text-sm leading-relaxed">{change.why}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] tracking-widest text-foreground">
                        保持原顺序
                      </p>
                      {change.keep.length === 0 ? (
                        <p className="text-xs text-muted-foreground">（建议新拆的一天）</p>
                      ) : (
                        <ol className="list-decimal pl-4 text-xs leading-relaxed text-muted-foreground">
                          {change.keep.map((name, index) => (
                            <li key={`keep-${name}-${index}`}>{name}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] tracking-widest text-primary">采用建议</p>
                      {change.apply.length === 0 ? (
                        <p className="text-xs text-muted-foreground">（建议去掉这一天）</p>
                      ) : (
                        <ol className="list-decimal pl-4 text-xs leading-relaxed">
                          {change.apply.map((name, index) => (
                            <li key={`apply-${name}-${index}`}>{name}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-4">
            {suggested ? (
              <>
                <Dialog.Close
                  render={<Button type="button" variant="outline" />}
                >
                  继续用建议
                </Dialog.Close>
                <Button type="button" onClick={onRevert}>
                  恢复圆周旅迹顺序
                </Button>
              </>
            ) : (
              <>
                <Dialog.Close render={<Button type="button" variant="outline" />}>
                  保持原顺序
                </Dialog.Close>
                <Button type="button" onClick={onApply}>
                  采用建议
                </Button>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
