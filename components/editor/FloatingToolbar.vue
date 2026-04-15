<script setup lang="ts">
const props = defineProps<{
  zoom: number
  gridEnabled: boolean
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
}>()

const emit = defineEmits<{
  'update:zoom': [number]
  toggleGrid: []
  undo: []
  redo: []
  duplicateSelected: []
  removeSelected: []
}>()

const { t } = useEditorI18n()
</script>

<template>
  <div class="floating-toolbar">
    <button type="button" class="floating-toolbar__button" :disabled="!canUndo" :title="t('undo')" @click="emit('undo')">↶</button>
    <button type="button" class="floating-toolbar__button" :disabled="!canRedo" :title="t('redo')" @click="emit('redo')">↷</button>
    <div class="floating-toolbar__separator" />
    <button type="button" class="floating-toolbar__button" @click="emit('update:zoom', Math.max(40, zoom - 10))">－</button>
    <div class="floating-toolbar__zoom">{{ zoom }}%</div>
    <button type="button" class="floating-toolbar__button" @click="emit('update:zoom', Math.min(220, zoom + 10))">＋</button>
    <div class="floating-toolbar__separator" />
    <button
      type="button"
      class="floating-toolbar__button"
      :class="{ 'is-active': gridEnabled }"
      :title="t('grid')"
      @click="emit('toggleGrid')"
    >
      ◫
    </button>
    <button type="button" class="floating-toolbar__button" :disabled="!hasSelection" :title="t('duplicate')" @click="emit('duplicateSelected')">⧉</button>
    <button type="button" class="floating-toolbar__button" :disabled="!hasSelection" :title="t('removeField')" @click="emit('removeSelected')">⌫</button>
  </div>
</template>
