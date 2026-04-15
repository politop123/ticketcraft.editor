<script setup lang="ts">
import type { TicketElement } from '~/types/editor'

const props = defineProps<{
  activeTab: 'layout' | 'text' | 'graphics' | 'settings'
}>()

const emit = defineEmits<{
  'update:activeTab': ['layout' | 'text' | 'graphics' | 'settings']
  add: [TicketElement['kind']]
}>()

const { t } = useEditorI18n()

const tabs = computed(() => [
  { key: 'layout' as const, label: t('layout'), icon: '◫' },
  { key: 'text' as const, label: t('text'), icon: 'T' },
  { key: 'graphics' as const, label: t('graphics'), icon: '▣' },
  { key: 'settings' as const, label: t('settings'), icon: '⚙' }
])

const tabActions = computed(() => {
  switch (props.activeTab) {
    case 'layout':
      return [
        { label: t('addShape'), kind: 'shape' as const, hint: 'Frame, bar, divider or card block' },
        { label: t('addText'), kind: 'text' as const, hint: 'Static text that never changes' },
        { label: t('addField'), kind: 'field' as const, hint: 'Variable content from your data source' }
      ]
    case 'text':
      return [
        { label: t('addText'), kind: 'text' as const, hint: 'Headlines, labels and notes' },
        { label: t('addField'), kind: 'field' as const, hint: 'Event name, seat, order id and more' }
      ]
    case 'graphics':
      return [
        { label: t('addQr'), kind: 'qr' as const, hint: 'Boarding or validation QR' },
        { label: t('addBarcode'), kind: 'barcode' as const, hint: 'Printable barcode block' },
        { label: t('addShape'), kind: 'shape' as const, hint: 'Decorative container or divider' }
      ]
    case 'settings':
      return [
        { label: t('addField'), kind: 'field' as const, hint: 'Add one more dynamic value' },
        { label: t('addQr'), kind: 'qr' as const, hint: 'Add validation QR area' },
        { label: t('addBarcode'), kind: 'barcode' as const, hint: 'Add printable barcode' }
      ]
  }
})
</script>

<template>
  <aside class="editor-sidebar">
    <div>
      <h1 class="editor-sidebar__title">{{ t('editor') }}</h1>
      <p class="editor-sidebar__subtitle">{{ t('customizeTicket') }}</p>
    </div>

    <div class="editor-sidebar__menu">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="sidebar-tab"
        :class="{ 'sidebar-tab--active': activeTab === tab.key }"
        @click="emit('update:activeTab', tab.key)"
      >
        <span class="sidebar-tab__icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="editor-sidebar__panel">
      <div class="editor-sidebar__section-title">{{ t('quickActions') }}</div>
      <div class="editor-sidebar__hint">{{ t('addHint') }}</div>
      <div class="sidebar-action-list">
        <button
          v-for="action in tabActions"
          :key="action.label"
          type="button"
          class="sidebar-card"
          @click="emit('add', action.kind)"
        >
          <div class="sidebar-card__title">{{ action.label }}</div>
          <div class="sidebar-card__hint">{{ action.hint }}</div>
        </button>
      </div>
    </div>

    <div class="editor-sidebar__divider" />

    <div>
      <div class="editor-sidebar__section-label">{{ t('dynamicFields') }}</div>
      <div class="sidebar-dynamic-list">
        <button type="button" class="sidebar-field-card" @click="emit('add', 'qr')">
          <span class="sidebar-field-card__icon">⌗</span>
          <span>{{ t('addQr') }}</span>
        </button>
        <button type="button" class="sidebar-field-card" @click="emit('add', 'barcode')">
          <span class="sidebar-field-card__icon">▥</span>
          <span>{{ t('addBarcode') }}</span>
        </button>
        <button type="button" class="sidebar-field-card" @click="emit('add', 'field')">
          <span class="sidebar-field-card__icon">⌂</span>
          <span>{{ t('addField') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>
