<script setup lang="ts">
import TopHeader from '~/components/editor/TopHeader.vue'
import SidebarMenu from '~/components/editor/SidebarMenu.vue'
import FloatingToolbar from '~/components/editor/FloatingToolbar.vue'
import TicketStage from '~/components/editor/TicketStage.vue'
import PropertiesPanel from '~/components/editor/PropertiesPanel.vue'
import ExportModal from '~/components/editor/ExportModal.vue'
import type { SampleDataMap, TicketElement, TicketTemplate } from '~/types/editor'
import { applyPagePreset, createElement, defaultSampleData, defaultTemplate } from '~/utils/defaults'
import { generateTicketHtml } from '~/utils/html'
import { clamp, deepClone, normalizeTemplate } from '~/utils/template'

const storageKey = 'ticketcraft-editor-state-v3'
const maxHistoryEntries = 60

const { locale, t } = useEditorI18n()

const activeTab = ref<'layout' | 'text' | 'graphics' | 'settings'>('graphics')
const template = ref<TicketTemplate>(defaultTemplate())
const sampleData = ref<SampleDataMap>(defaultSampleData())
const selectedId = ref<string | null>(null)
const zoom = ref(100)
const savedAtRaw = ref('')
const saveState = ref<'draft' | 'saving' | 'saved'>('draft')
const exportOpen = ref(false)
const exportMode = ref<'template' | 'rendered'>('rendered')
const exportedHtml = ref('')
const history = ref<TicketTemplate[]>([])
const future = ref<TicketTemplate[]>([])

const selectedElement = computed(() => template.value.elements.find((item) => item.id === selectedId.value) ?? null)

const statusText = computed(() => {
  if (saveState.value === 'saving') return t('saving')
  if (saveState.value === 'saved' && savedAtRaw.value) return `${t('savedAt')} ${savedAtRaw.value}`
  return t('draft')
})

const cloneTemplate = (value: TicketTemplate) => deepClone(value)

let persistTimer: ReturnType<typeof setTimeout> | null = null
let historyTimer: ReturnType<typeof setTimeout> | null = null
let pendingHistorySnapshot: TicketTemplate | null = null

const persistNow = () => {
  if (!import.meta.client) return

  const nextSavedAt = new Date().toLocaleTimeString(locale.value === 'uk' ? 'uk-UA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  savedAtRaw.value = nextSavedAt

  localStorage.setItem(
    storageKey,
    JSON.stringify({
      template: template.value,
      sampleData: sampleData.value,
      zoom: zoom.value,
      activeTab: activeTab.value,
      locale: locale.value,
      savedAtRaw: nextSavedAt
    })
  )

  saveState.value = 'saved'
}

const schedulePersist = () => {
  saveState.value = 'saving'
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistNow()
  }, 240)
}

const pushHistory = (snapshot: TicketTemplate) => {
  history.value.push(snapshot)
  if (history.value.length > maxHistoryEntries) history.value.shift()
  future.value = []
}

const flushDeferredHistory = () => {
  if (!pendingHistorySnapshot) return
  pushHistory(pendingHistorySnapshot)
  pendingHistorySnapshot = null
  if (historyTimer) {
    clearTimeout(historyTimer)
    historyTimer = null
  }
}

const queueHistory = () => {
  if (!pendingHistorySnapshot) pendingHistorySnapshot = cloneTemplate(template.value)
  if (historyTimer) clearTimeout(historyTimer)
  historyTimer = setTimeout(() => {
    flushDeferredHistory()
  }, 280)
}

const applyTemplateState = (next: TicketTemplate, historyMode: 'none' | 'deferred' | 'immediate' = 'deferred') => {
  const normalized = normalizeTemplate(next)
  const before = JSON.stringify(template.value)
  const after = JSON.stringify(normalized)
  if (before === after) return

  if (historyMode === 'immediate') pushHistory(cloneTemplate(template.value))
  if (historyMode === 'deferred') queueHistory()

  template.value = normalized
  if (selectedId.value && !normalized.elements.some((item) => item.id === selectedId.value)) selectedId.value = null
}

const patchTemplate = (patch: Partial<TicketTemplate>, historyMode: 'none' | 'deferred' | 'immediate' = 'deferred') => {
  applyTemplateState({ ...template.value, ...patch }, historyMode)
}

const patchElement = (payload: { id: string; patch: Partial<TicketElement> }, historyMode: 'none' | 'deferred' | 'immediate' = 'deferred') => {
  const index = template.value.elements.findIndex((item) => item.id === payload.id)
  if (index === -1) return

  const next = cloneTemplate(template.value)
  next.elements[index] = {
    ...next.elements[index],
    ...payload.patch
  } as TicketElement
  applyTemplateState(next, historyMode)
}

const bringToFront = () => {
  if (!selectedElement.value) return
  const maxZ = Math.max(...template.value.elements.map((item) => item.zIndex), 0)
  patchElement({ id: selectedElement.value.id, patch: { zIndex: maxZ + 1 } }, 'immediate')
}

const sendToBack = () => {
  if (!selectedElement.value) return

  const targetId = selectedElement.value.id
  const ordered = [...template.value.elements].sort((a, b) => a.zIndex - b.zIndex)
  const selected = ordered.find((item) => item.id === targetId)
  if (!selected) return

  const rebalanced = [selected, ...ordered.filter((item) => item.id !== targetId)].map((item, index) => ({
    ...item,
    zIndex: index + 1
  }))

  applyTemplateState({ ...template.value, elements: rebalanced }, 'immediate')
}

const duplicateSelected = () => {
  if (!selectedElement.value) return
  const duplicate = deepClone(selectedElement.value)
  duplicate.id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12)
  duplicate.label = `${duplicate.label} copy`
  duplicate.x = clamp(duplicate.x + 20, 0, Math.max(0, template.value.width - duplicate.width))
  duplicate.y = clamp(duplicate.y + 20, 0, Math.max(0, template.value.height - duplicate.height))
  duplicate.zIndex = Math.max(...template.value.elements.map((item) => item.zIndex), 0) + 1

  const next = cloneTemplate(template.value)
  next.elements.push(duplicate)
  applyTemplateState(next, 'immediate')
  selectedId.value = duplicate.id
}

const addElement = (kind: TicketElement['kind']) => {
  const element = createElement(kind)
  element.x = Math.round(template.value.width / 2 - element.width / 2)
  element.y = Math.round(template.value.height / 2 - element.height / 2)
  element.zIndex = Math.max(...template.value.elements.map((item) => item.zIndex), 0) + 1
  const next = cloneTemplate(template.value)
  next.elements.push(element)
  applyTemplateState(next, 'immediate')
  selectedId.value = element.id
}

const applyPreset = (preset: TicketTemplate['sizePreset']) => {
  if (preset === 'custom') {
    patchTemplate({ sizePreset: 'custom' }, 'immediate')
    return
  }

  applyTemplateState(applyPagePreset(template.value, preset), 'immediate')
}

const removeSelected = () => {
  if (!selectedElement.value) return
  const next = cloneTemplate(template.value)
  next.elements = next.elements.filter((item) => item.id !== selectedElement.value?.id)
  applyTemplateState(next, 'immediate')
  selectedId.value = null
}

const undo = () => {
  flushDeferredHistory()
  const previous = history.value.pop()
  if (!previous) return
  future.value.push(cloneTemplate(template.value))
  template.value = normalizeTemplate(previous)
  if (selectedId.value && !template.value.elements.some((item) => item.id === selectedId.value)) selectedId.value = null
  schedulePersist()
}

const redo = () => {
  flushDeferredHistory()
  const next = future.value.pop()
  if (!next) return
  history.value.push(cloneTemplate(template.value))
  template.value = normalizeTemplate(next)
  if (selectedId.value && !template.value.elements.some((item) => item.id === selectedId.value)) selectedId.value = null
  schedulePersist()
}

const saveProject = () => {
  flushDeferredHistory()
  persistNow()
}

const openExport = async (mode: 'template' | 'rendered' = 'rendered') => {
  exportMode.value = mode
  exportedHtml.value = await generateTicketHtml({
    template: template.value,
    sampleData: sampleData.value,
    resolveVariables: mode === 'rendered'
  })
  exportOpen.value = true
}

const toggleGrid = () => {
  patchTemplate({ showGrid: !template.value.showGrid }, 'immediate')
}

onMounted(() => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw)
    if (parsed.template) template.value = normalizeTemplate(parsed.template)
    if (parsed.sampleData) sampleData.value = parsed.sampleData
    if (typeof parsed.zoom === 'number') zoom.value = parsed.zoom
    if (parsed.activeTab) activeTab.value = parsed.activeTab
    if (parsed.locale === 'uk' || parsed.locale === 'en') locale.value = parsed.locale
    if (typeof parsed.savedAtRaw === 'string') savedAtRaw.value = parsed.savedAtRaw
    saveState.value = savedAtRaw.value ? 'saved' : 'draft'
  } catch {
    localStorage.removeItem(storageKey)
  }
})

watch(
  locale,
  (value) => {
    patchTemplate({ locale: value }, 'none')
  },
  { immediate: true }
)

watch([template, sampleData, zoom, activeTab, locale], schedulePersist, { deep: true })

const onKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const isTypingTarget = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault()
    redo()
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd' && selectedElement.value) {
    event.preventDefault()
    duplicateSelected()
    return
  }

  if (isTypingTarget) return
  if (!selectedElement.value) return

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    removeSelected()
    return
  }

  const step = event.shiftKey ? 10 : 1
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault()
  if (event.key === 'ArrowLeft') patchElement({ id: selectedElement.value.id, patch: { x: selectedElement.value.x - step } })
  if (event.key === 'ArrowRight') patchElement({ id: selectedElement.value.id, patch: { x: selectedElement.value.x + step } })
  if (event.key === 'ArrowUp') patchElement({ id: selectedElement.value.id, patch: { y: selectedElement.value.y - step } })
  if (event.key === 'ArrowDown') patchElement({ id: selectedElement.value.id, patch: { y: selectedElement.value.y + step } })
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (persistTimer) clearTimeout(persistTimer)
  if (historyTimer) clearTimeout(historyTimer)
})

useHead({
  title: 'TicketCraft Editor'
})
</script>

<template>
  <div class="ticketcraft-page">
    <TopHeader
      :status-text="statusText"
      @save="saveProject"
      @export-rendered="openExport('rendered')"
      @export-template="openExport('template')"
    />

    <div class="editor-shell">
      <SidebarMenu v-model:active-tab="activeTab" @add="addElement" />

      <main class="workspace">
        <FloatingToolbar
          :zoom="zoom"
          :grid-enabled="template.showGrid"
          :can-undo="history.length > 0"
          :can-redo="future.length > 0"
          :has-selection="Boolean(selectedElement)"
          @update:zoom="zoom = $event"
          @toggle-grid="toggleGrid"
          @undo="undo"
          @redo="redo"
          @duplicate-selected="duplicateSelected"
          @remove-selected="removeSelected"
        />

        <TicketStage
          :template="template"
          :selected-id="selectedId"
          :zoom="zoom"
          :sample-data="sampleData"
          @select="selectedId = $event"
          @patch="patchElement($event)"
        />
      </main>

      <PropertiesPanel
        :template="template"
        :selected-element="selectedElement"
        @patch-template="patchTemplate($event)"
        @patch-element="patchElement($event)"
        @remove-selected="removeSelected"
        @duplicate-selected="duplicateSelected"
        @bring-to-front="bringToFront"
        @send-to-back="sendToBack"
        @apply-preset="applyPreset"
      />
    </div>

    <ExportModal v-model:open="exportOpen" :mode="exportMode" :html="exportedHtml" />
  </div>
</template>
