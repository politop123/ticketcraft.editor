<script setup lang="ts">
import type { DataSourceKey, PagePresetKey, TicketElement, TicketTemplate } from '~/types/editor'

const props = defineProps<{
  template: TicketTemplate
  selectedElement: TicketElement | null
}>()

const emit = defineEmits<{
  patchTemplate: [Partial<TicketTemplate>]
  patchElement: [{ id: string; patch: Partial<TicketElement> }]
  removeSelected: []
  duplicateSelected: []
  bringToFront: []
  sendToBack: []
  applyPreset: [PagePresetKey]
}>()

const { locale, t, dataSourceOptions, pagePresetOptions } = useEditorI18n()

const patchSelected = (patch: Record<string, unknown>) => {
  if (!props.selectedElement) return

  emit('patchElement', {
    id: props.selectedElement.id,
    patch: patch as Partial<TicketElement>
  })
}

const patchTemplate = (patch: Partial<TicketTemplate>) => {
  emit('patchTemplate', patch)
}

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const changeLocale = (event: Event) => {
  locale.value = (event.target as HTMLSelectElement).value as 'uk' | 'en'
}
</script>

<template>
  <aside class="properties-panel">
    <div class="properties-panel__title">{{ t('fieldProperties') }}</div>

    <div class="properties-panel__section-label">{{ t('activeElement') }}</div>

    <div v-if="selectedElement" class="active-element-card">
      <div class="active-element-card__icon">⌗</div>
      <div class="active-element-card__content">
        <div class="active-element-card__title">{{ selectedElement.label }}</div>
        <div class="active-element-card__meta">{{ selectedElement.kind }} · ID {{ selectedElement.id.slice(0, 8) }}</div>
      </div>
    </div>

    <div v-else class="active-element-empty">{{ t('selectAny') }}</div>

    <div v-if="selectedElement" class="properties-panel__group">
      <div class="property-field">
        <label>{{ t('label') }}</label>
        <UInput :model-value="selectedElement.label" @update:model-value="patchSelected({ label: String($event) })" />
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('positionPx') }}</label>
          <div class="split-inputs">
            <UInput :model-value="String(selectedElement.x)" type="number" @update:model-value="patchSelected({ x: toNumber($event, selectedElement.x) })" />
            <UInput :model-value="String(selectedElement.y)" type="number" @update:model-value="patchSelected({ y: toNumber($event, selectedElement.y) })" />
          </div>
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('sizePx') }}</label>
          <div class="split-inputs">
            <UInput :model-value="String(selectedElement.width)" type="number" @update:model-value="patchSelected({ width: toNumber($event, selectedElement.width) })" />
            <UInput :model-value="String(selectedElement.height)" type="number" @update:model-value="patchSelected({ height: toNumber($event, selectedElement.height) })" />
          </div>
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('rotation') }}</label>
          <UInput :model-value="String(selectedElement.rotation)" type="number" @update:model-value="patchSelected({ rotation: toNumber($event, selectedElement.rotation) })" />
        </div>

        <div class="property-field">
          <label>{{ t('opacity') }}</label>
          <UInput :model-value="String(selectedElement.opacity)" type="number" step="0.05" @update:model-value="patchSelected({ opacity: toNumber($event, selectedElement.opacity) })" />
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('zIndex') }}</label>
          <UInput :model-value="String(selectedElement.zIndex)" type="number" @update:model-value="patchSelected({ zIndex: toNumber($event, selectedElement.zIndex) })" />
        </div>

        <div class="property-field property-field--checkbox-inline">
          <label>
            <input type="checkbox" :checked="selectedElement.locked" @change="patchSelected({ locked: ($event.target as HTMLInputElement).checked })">
            {{ t('locked') }}
          </label>
        </div>
      </div>
    </div>

    <div v-if="selectedElement && ['field', 'qr', 'barcode'].includes(selectedElement.kind)" class="property-field">
      <label>{{ t('dataSource') }}</label>
      <select class="native-select" :value="selectedElement.source" @change="patchSelected({ source: ($event.target as HTMLSelectElement).value as DataSourceKey })">
        <option v-for="option in dataSourceOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <div v-if="selectedElement?.kind === 'text'" class="property-field">
      <label>{{ t('textLabel') }}</label>
      <UTextarea :model-value="selectedElement.content" :rows="4" @update:model-value="patchSelected({ content: String($event) })" />
    </div>

    <div v-if="selectedElement?.kind === 'field'" class="property-field">
      <label>{{ t('placeholder') }}</label>
      <UInput :model-value="selectedElement.placeholder" @update:model-value="patchSelected({ placeholder: String($event) })" />
    </div>

    <template v-if="selectedElement && ['text', 'field'].includes(selectedElement.kind)">
      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('fontSize') }}</label>
          <UInput :model-value="String(selectedElement.fontSize)" type="number" @update:model-value="patchSelected({ fontSize: toNumber($event, selectedElement.fontSize) })" />
        </div>
        <div class="property-field">
          <label>{{ t('fontWeight') }}</label>
          <UInput :model-value="String(selectedElement.fontWeight)" type="number" @update:model-value="patchSelected({ fontWeight: toNumber($event, selectedElement.fontWeight) })" />
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('letterSpacing') }}</label>
          <UInput :model-value="String(selectedElement.letterSpacing)" type="number" step="0.1" @update:model-value="patchSelected({ letterSpacing: toNumber($event, selectedElement.letterSpacing) })" />
        </div>
        <div class="property-field">
          <label>{{ t('lineHeight') }}</label>
          <UInput :model-value="String(selectedElement.lineHeight)" type="number" step="0.05" @update:model-value="patchSelected({ lineHeight: toNumber($event, selectedElement.lineHeight) })" />
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('padding') }}</label>
          <UInput :model-value="String(selectedElement.padding)" type="number" @update:model-value="patchSelected({ padding: toNumber($event, selectedElement.padding) })" />
        </div>
        <div class="property-field">
          <label>{{ t('fitMode') }}</label>
          <select class="native-select" :value="selectedElement.fitMode" @change="patchSelected({ fitMode: ($event.target as HTMLSelectElement).value as 'fixed' | 'shrink' })">
            <option value="fixed">{{ t('fixed') }}</option>
            <option value="shrink">{{ t('shrink') }}</option>
          </select>
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('align') }}</label>
          <select class="native-select" :value="selectedElement.align" @change="patchSelected({ align: ($event.target as HTMLSelectElement).value as 'left' | 'center' | 'right' })">
            <option value="left">{{ t('left') }}</option>
            <option value="center">{{ t('center') }}</option>
            <option value="right">{{ t('right') }}</option>
          </select>
        </div>
        <div class="property-field property-field--checkbox-inline" v-if="selectedElement.kind === 'field'">
          <label>
            <input type="checkbox" :checked="selectedElement.uppercase" @change="patchSelected({ uppercase: ($event.target as HTMLInputElement).checked })">
            {{ t('uppercase') }}
          </label>
        </div>
      </div>

      <div class="property-field">
        <label>{{ t('color') }}</label>
        <input class="color-input" type="color" :value="selectedElement.color" @input="patchSelected({ color: ($event.target as HTMLInputElement).value })">
      </div>
    </template>

    <template v-if="selectedElement?.kind === 'qr'">
      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('padding') }}</label>
          <UInput :model-value="String(selectedElement.padding)" type="number" @update:model-value="patchSelected({ padding: toNumber($event, selectedElement.padding) })" />
        </div>
        <div class="property-field">
          <label>{{ t('fill') }}</label>
          <input class="color-input" type="color" :value="selectedElement.background" @input="patchSelected({ background: ($event.target as HTMLInputElement).value })">
        </div>
      </div>
      <div class="property-field property-field--checkbox-inline">
        <label>
          <input type="checkbox" :checked="selectedElement.showCaption" @change="patchSelected({ showCaption: ($event.target as HTMLInputElement).checked })">
          {{ t('caption') }}
        </label>
      </div>
    </template>

    <template v-if="selectedElement?.kind === 'barcode'">
      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('padding') }}</label>
          <UInput :model-value="String(selectedElement.padding)" type="number" @update:model-value="patchSelected({ padding: toNumber($event, selectedElement.padding) })" />
        </div>
        <div class="property-field">
          <label>{{ t('fill') }}</label>
          <input class="color-input" type="color" :value="selectedElement.background" @input="patchSelected({ background: ($event.target as HTMLInputElement).value })">
        </div>
      </div>
      <div class="property-field">
        <label>{{ t('color') }}</label>
        <input class="color-input" type="color" :value="selectedElement.barColor" @input="patchSelected({ barColor: ($event.target as HTMLInputElement).value })">
      </div>
    </template>

    <template v-if="selectedElement?.kind === 'shape'">
      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('fill') }}</label>
          <input class="color-input" type="color" :value="selectedElement.background.startsWith('#') ? selectedElement.background : '#ffffff'" @input="patchSelected({ background: ($event.target as HTMLInputElement).value })">
        </div>
        <div class="property-field">
          <label>{{ t('radius') }}</label>
          <UInput :model-value="String(selectedElement.borderRadius)" type="number" @update:model-value="patchSelected({ borderRadius: toNumber($event, selectedElement.borderRadius) })" />
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('borderWidth') }}</label>
          <UInput :model-value="String(selectedElement.borderWidth)" type="number" @update:model-value="patchSelected({ borderWidth: toNumber($event, selectedElement.borderWidth) })" />
        </div>
        <div class="property-field">
          <label>{{ t('borderStyle') }}</label>
          <select class="native-select" :value="selectedElement.borderStyle" @change="patchSelected({ borderStyle: ($event.target as HTMLSelectElement).value as 'solid' | 'dashed' | 'dotted' })">
            <option value="solid">solid</option>
            <option value="dashed">dashed</option>
            <option value="dotted">dotted</option>
          </select>
        </div>
      </div>

      <div class="property-field">
        <label>{{ t('border') }}</label>
        <input class="color-input" type="color" :value="selectedElement.borderColor" @input="patchSelected({ borderColor: ($event.target as HTMLInputElement).value })">
      </div>
    </template>

    <div v-if="selectedElement" class="properties-panel__inline-actions">
      <button type="button" class="secondary-button" @click="emit('sendToBack')">{{ t('toBack') }}</button>
      <button type="button" class="secondary-button" @click="emit('bringToFront')">{{ t('toFront') }}</button>
      <button type="button" class="secondary-button" @click="emit('duplicateSelected')">{{ t('duplicate') }}</button>
      <button type="button" class="danger-button" @click="emit('removeSelected')">{{ t('removeField') }}</button>
    </div>

    <div class="properties-panel__divider" />

    <div class="properties-panel__section-label">{{ t('templateSettings') }}</div>

    <div class="properties-panel__template-settings">
      <div class="property-field">
        <label>{{ t('sizePreset') }}</label>
        <select class="native-select" :value="template.sizePreset" @change="emit('applyPreset', ($event.target as HTMLSelectElement).value as PagePresetKey)">
          <option v-for="option in pagePresetOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>

      <div class="property-field">
        <label>{{ t('language') }}</label>
        <select class="native-select" :value="locale" @change="changeLocale">
          <option value="uk">Українська</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="property-field">
        <label>{{ t('canvasName') }}</label>
        <UInput :model-value="template.name" @update:model-value="patchTemplate({ name: String($event) })" />
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('sizePx') }}</label>
          <div class="split-inputs">
            <UInput :model-value="String(template.width)" type="number" @update:model-value="patchTemplate({ width: toNumber($event, template.width), sizePreset: 'custom' })" />
            <UInput :model-value="String(template.height)" type="number" @update:model-value="patchTemplate({ height: toNumber($event, template.height), sizePreset: 'custom' })" />
          </div>
        </div>
      </div>

      <div class="property-grid two-columns">
        <div class="property-field">
          <label>{{ t('backgroundColor') }}</label>
          <input class="color-input" type="color" :value="template.backgroundColor" @input="patchTemplate({ backgroundColor: ($event.target as HTMLInputElement).value })">
        </div>
        <div class="property-field">
          <label>{{ t('radius') }}</label>
          <UInput :model-value="String(template.borderRadius)" type="number" @update:model-value="patchTemplate({ borderRadius: toNumber($event, template.borderRadius) })" />
        </div>
      </div>

      <div class="property-field">
        <label>{{ t('backgroundImage') }}</label>
        <UInput :model-value="template.backgroundImage" placeholder="https://..." @update:model-value="patchTemplate({ backgroundImage: String($event) })" />
      </div>
    </div>
  </aside>
</template>
