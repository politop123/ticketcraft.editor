<script setup lang="ts">
import QRCode from 'qrcode'
import type { SampleDataMap, TicketElement, TicketTemplate } from '~/types/editor'
import { buildBarcodeSvg, fitTextSize, resolveElementValue } from '~/utils/rendering'
import { clamp } from '~/utils/template'

const props = defineProps<{
  template: TicketTemplate
  selectedId: string | null
  zoom: number
  sampleData: SampleDataMap
}>()

const emit = defineEmits<{
  select: [string | null]
  patch: [{ id: string; patch: Partial<TicketElement> }]
}>()

const { t } = useEditorI18n()

const qrMap = ref<Record<string, string>>({})
const barcodeMap = ref<Record<string, string>>({})

const scale = computed(() => props.zoom / 100)
const stageWidth = computed(() => props.template.width * scale.value)
const stageHeight = computed(() => props.template.height * scale.value)
const sortedElements = computed(() => [...props.template.elements].sort((a, b) => a.zIndex - b.zIndex))

const backgroundStyle = computed(() => ({
  backgroundColor: props.template.backgroundColor,
  backgroundImage: props.template.backgroundImage
    ? `linear-gradient(rgba(255,255,255,.18), rgba(255,255,255,.18)), url(${props.template.backgroundImage})`
    : 'none',
  backgroundPosition: 'center',
  backgroundSize: props.template.backgroundImage ? 'cover' : 'auto',
  backgroundRepeat: 'no-repeat'
}))

const interaction = ref<null | {
  pointerId: number
  id: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  initialX: number
  initialY: number
  initialWidth: number
  initialHeight: number
}>(null)

const getElement = (id: string) => props.template.elements.find((item) => item.id === id)

const minBounds = (element: TicketElement) => {
  switch (element.kind) {
    case 'qr':
      return { width: 48, height: 48 }
    case 'barcode':
      return { width: 96, height: 36 }
    case 'text':
    case 'field':
      return { width: 56, height: 24 }
    default:
      return { width: 24, height: 16 }
  }
}

let refreshToken = 0
let refreshTimer: ReturnType<typeof setTimeout> | null = null

const refreshMaps = async () => {
  const currentToken = ++refreshToken
  const qrEntries = await Promise.all(
    props.template.elements
      .filter((element): element is Extract<TicketElement, { kind: 'qr' }> => element.kind === 'qr')
      .map(async (element) => {
        const value = props.sampleData[element.source] ?? ''
        const innerSize = Math.max(64, Math.min(element.width, element.height) - element.padding * 2 - (element.showCaption ? 18 : 0))
        try {
          const url = await QRCode.toDataURL(value || ' ', { margin: 0, width: innerSize * 3 })
          return [element.id, url] as const
        } catch {
          return [element.id, ''] as const
        }
      })
  )

  if (currentToken !== refreshToken) return

  const barcodeEntries = props.template.elements
    .filter((element): element is Extract<TicketElement, { kind: 'barcode' }> => element.kind === 'barcode')
    .map((element) => {
      const value = props.sampleData[element.source] ?? ''
      return [element.id, buildBarcodeSvg(value, element)] as const
    })

  qrMap.value = Object.fromEntries(qrEntries)
  barcodeMap.value = Object.fromEntries(barcodeEntries)
}

const scheduleRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => {
    refreshMaps()
  }, 120)
}

const previewSignature = computed(() =>
  props.template.elements
    .map((element) => {
      if (element.kind === 'qr') return `${element.id}:${element.width}:${element.height}:${element.padding}:${element.showCaption}:${props.sampleData[element.source] ?? ''}`
      if (element.kind === 'barcode') return `${element.id}:${element.width}:${element.height}:${element.padding}:${element.barColor}:${props.sampleData[element.source] ?? ''}`
      return element.id
    })
    .join('|')
)

watch(previewSignature, scheduleRefresh, { immediate: true })

const displayText = (element: TicketElement) => resolveElementValue(element, props.sampleData, true)

const textStyle = (element: Extract<TicketElement, { kind: 'text' | 'field' }>) => {
  const value = displayText(element)
  const fontSize = fitTextSize(element, value)

  return {
    fontSize: `${fontSize}px`,
    fontWeight: element.fontWeight,
    color: element.color,
    letterSpacing: `${element.letterSpacing}px`,
    textAlign: element.align,
    lineHeight: element.lineHeight,
    textTransform: element.kind === 'field' && element.uppercase ? 'uppercase' : 'none',
    padding: `${element.padding}px`
  }
}

const elementStyle = (element: TicketElement) => ({
  position: 'absolute' as const,
  left: `${element.x}px`,
  top: `${element.y}px`,
  width: `${element.width}px`,
  height: `${element.height}px`,
  opacity: element.opacity,
  transform: `rotate(${element.rotation}deg)`,
  transformOrigin: 'center center',
  zIndex: element.zIndex,
  cursor: element.locked ? 'default' : 'move'
})

const qrImageStyle = (element: Extract<TicketElement, { kind: 'qr' }>) => {
  const reservedCaption = element.showCaption ? 18 : 0
  const imageMaxHeight = Math.max(24, element.height - element.padding * 2 - reservedCaption)
  return {
    width: '100%',
    height: `${imageMaxHeight}px`,
    maxHeight: `${imageMaxHeight}px`
  }
}

const start = (event: PointerEvent, element: TicketElement, mode: 'move' | 'resize') => {
  event.stopPropagation()
  event.preventDefault()
  emit('select', element.id)
  if (element.locked) return

  interaction.value = {
    pointerId: event.pointerId,
    id: element.id,
    mode,
    startX: event.clientX,
    startY: event.clientY,
    initialX: element.x,
    initialY: element.y,
    initialWidth: element.width,
    initialHeight: element.height
  }

  const target = event.currentTarget
  if (target instanceof Element && 'setPointerCapture' in target) {
    target.setPointerCapture(event.pointerId)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

const onMove = (event: PointerEvent) => {
  if (!interaction.value) return
  if (event.pointerId !== interaction.value.pointerId) return
  const element = getElement(interaction.value.id)
  if (!element) return

  const dx = (event.clientX - interaction.value.startX) / scale.value
  const dy = (event.clientY - interaction.value.startY) / scale.value

  if (interaction.value.mode === 'move') {
    const nextX = clamp(Math.round(interaction.value.initialX + dx), 0, props.template.width - element.width)
    const nextY = clamp(Math.round(interaction.value.initialY + dy), 0, props.template.height - element.height)
    emit('patch', { id: element.id, patch: { x: nextX, y: nextY } })
    return
  }

  const min = minBounds(element)
  const nextWidth = clamp(Math.round(interaction.value.initialWidth + dx), min.width, props.template.width - element.x)
  const nextHeight = clamp(Math.round(interaction.value.initialHeight + dy), min.height, props.template.height - element.y)
  emit('patch', { id: element.id, patch: { width: nextWidth, height: nextHeight } })
}

const onUp = (event?: PointerEvent) => {
  if (event && interaction.value && event.pointerId !== interaction.value.pointerId) return
  interaction.value = null
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
}

const cancelInteraction = () => {
  if (!interaction.value) return
  onUp()
}

const onVisibility = () => {
  if (document.visibilityState !== 'visible') cancelInteraction()
}

onMounted(() => {
  window.addEventListener('blur', cancelInteraction)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', cancelInteraction)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  window.removeEventListener('pointercancel', onUp)
  if (refreshTimer) clearTimeout(refreshTimer)
})
</script>

<template>
  <div class="workspace-stage">
    <div
      class="ticket-stage-shell"
      :style="{
        width: `${stageWidth}px`,
        height: `${stageHeight}px`
      }"
    >
      <div
        class="ticket-stage"
        :style="{
          width: `${template.width}px`,
          height: `${template.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          borderRadius: `${template.borderRadius}px`
        }"
        @pointerdown="emit('select', null)"
      >
        <div class="ticket-stage__background" :style="backgroundStyle" />
        <div v-if="template.showGrid" class="ticket-stage__grid" />

        <div
          v-for="element in sortedElements"
          :key="element.id"
          :style="elementStyle(element)"
          class="ticket-element"
          :class="{ 'is-selected': selectedId === element.id, 'is-locked': element.locked }"
          @pointerdown="start($event, element, 'move')"
        >
          <template v-if="element.kind === 'shape'">
            <div
              class="ticket-element__content h-full w-full"
              :style="{
                background: element.background,
                border: `${element.borderWidth}px ${element.borderStyle} ${element.borderColor}`,
                borderRadius: `${element.borderRadius}px`
              }"
            />
          </template>

          <template v-else-if="element.kind === 'qr'">
            <div
              class="ticket-element__content qr-tile"
              :style="{
                background: element.background,
                padding: `${element.padding}px`
              }"
            >
              <div class="qr-tile__image" :style="qrImageStyle(element)">
                <img :src="qrMap[element.id]" alt="QR code" class="h-full w-full object-contain" draggable="false" />
              </div>
              <div v-if="element.showCaption" class="qr-caption">DYNAMIC QR</div>
            </div>
          </template>

          <template v-else-if="element.kind === 'barcode'">
            <div
              class="ticket-element__content barcode-preview"
              :style="{
                background: element.background,
                padding: `${element.padding}px`
              }"
              v-html="barcodeMap[element.id]"
            />
          </template>

          <template v-else>
            <div class="ticket-element__content text-preview" :style="textStyle(element)">
              {{ displayText(element) }}
            </div>
          </template>

          <div v-if="selectedId === element.id" class="selection-outline" />
          <div v-if="selectedId === element.id && element.locked" class="selection-badge">🔒</div>
          <button
            v-if="selectedId === element.id && !element.locked"
            type="button"
            class="resize-handle"
            @pointerdown.stop.prevent="start($event, element, 'resize')"
          />
        </div>
      </div>
    </div>

    <div class="workspace-hint">ⓘ {{ t('workspaceHint') }}</div>
  </div>
</template>
