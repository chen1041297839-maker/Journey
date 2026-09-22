"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImagePlus } from "lucide-react"
import { uniqueByUrl } from "@/lib/evidence"
import { Copy, Heading, MetaLabel } from "@/components/layout-system"
import { useTrip } from "@/components/trip-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function filesFromList(list: File[] | FileList): File[] {
  return [...list].filter((file) => file.type.startsWith("image/"))
}

function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return []
  const fromFiles = filesFromList(data.files)
  if (fromFiles.length > 0) return fromFiles
  const fromItems: File[] = []
  for (const item of data.items) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue
    const file = item.getAsFile()
    if (file) fromItems.push(file)
  }
  return fromItems
}

export function ImageUpload({ dayId, stopId }: { dayId: string; stopId: string }) {
  const { importUploads, importPosts, generating, trip } = useTrip()
  const inputRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const stop = trip.days.find((day) => day.id === dayId)?.stops.find((item) => item.id === stopId)
  const sourceUrls = uniqueByUrl([
    ...(stop?.shops.flatMap((item) => item.evidence) ?? []),
    ...(stop?.mustBuys.flatMap((item) => item.evidence) ?? []),
    ...(stop?.photoSpots.flatMap((item) => item.evidence) ?? []),
  ])
    .map((item) => item.url)
    .filter((url) => /^https?:/i.test(url))
  const needsListPhotos = Boolean(stop?.imageListPartial)

  const runFiles = useCallback(
    async (list: File[]) => {
      const images = filesFromList(list)
      if (images.length === 0) return
      const result = await importUploads(images, { dayId, stopId })
      if (!result) return
      setSummary(
        result.ocrCount > 0
          ? `已 OCR ${result.imageCount} 张截图 · ${result.ocrCount} 行，写进「${result.stopName}」要点`
          : `存了 ${result.imageCount} 张，但没读到可用文字。换更清晰的清单图再试。`
      )
    },
    [dayId, importUploads, stopId]
  )

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target
      if (target instanceof HTMLElement) {
        if (target.closest("textarea, input, [contenteditable='true']")) return
      }
      const images = filesFromClipboard(event.clipboardData)
      if (images.length === 0) return
      event.preventDefault()
      void runFiles(images)
    }
    window.addEventListener("paste", onPaste)
    return () => window.removeEventListener("paste", onPaste)
  }, [runFiles])

  async function retryPublic() {
    if (sourceUrls.length === 0) return
    const result = await importPosts(sourceUrls.join("\n"), { dayId, stopId })
    if (!result) return
    const images = result.attached.reduce((sum, item) => sum + item.imageCount, 0)
    const ocr = result.attached.reduce((sum, item) => sum + item.ocrCount, 0)
    setSummary(
      images > 0
        ? `公开页又试了一遍：存了 ${images} 张，OCR ${ocr} 行。还缺的清单请在这一站上传截图。`
        : "公开页仍然读不到后续清单。不会去抓 App。请在这一站上传小红书清单截图，不要发到聊天。"
    )
  }

  return (
    <section
      id="stop-upload"
      className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-5"
    >
      <MetaLabel>在网页这一站上传 · 不要发到聊天</MetaLabel>
      <Heading as="h3" className="text-xl">
        把清单截图拖进来 OCR
      </Heading>
      <Copy muted>
        {needsListPhotos
          ? "这一站封面只有标题或表情包，公开页读不到后面的清单。请打开这一站，点「选择截图」、拖进来，或 Ctrl+V / ⌘V 粘贴。识别后写进下面要点。"
          : "从相册选、拖进来，或直接粘贴截图。识别店名、菜单、价格、机位后写进要点。"}
        不会登录，也不会走 App。
      </Copy>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex min-h-[9rem] w-full min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50",
          dragging ? "border-primary bg-card" : "border-primary/50 bg-card/80"
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void runFiles(filesFromList(event.dataTransfer.files))
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple
          className="sr-only"
          onChange={(event) => {
            void runFiles([...(event.target.files || [])])
            event.target.value = ""
          }}
        />
        <ImagePlus className="size-8 text-primary" aria-hidden />
        <span className="cjk-flow mt-3 font-heading text-base text-foreground">
          点这里选图，或把截图拖进来
        </span>
        <span className="cjk-flow mt-1 text-xs leading-6 text-muted-foreground">
          也可在这一站直接粘贴 · jpg / png / webp · 一次最多 12 张
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" onClick={() => inputRef.current?.click()} disabled={generating}>
          {generating ? "正在 OCR…" : "选择截图"}
        </Button>
        {sourceUrls.length > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={() => void retryPublic()} disabled={generating}>
            再试公开配图
          </Button>
        ) : null}
      </div>
      {summary ? (
        <p className="cjk-flow whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{summary}</p>
      ) : null}
    </section>
  )
}
