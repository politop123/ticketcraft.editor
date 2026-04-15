<script setup lang="ts">
const props = defineProps<{
  statusText: string
}>()

const emit = defineEmits<{
  save: []
  exportRendered: []
  exportTemplate: []
}>()

const { locale, localeOptions, t } = useEditorI18n()
</script>

<template>
  <header class="editor-topbar">
    <div class="editor-topbar__brand">
      <div>
        <div class="editor-topbar__logo">{{ t('brand') }}</div>
        <div class="editor-topbar__subtle">{{ t('customizeTicket') }}</div>
      </div>

      <nav class="editor-topbar__nav" aria-label="Editor navigation">
        <span>{{ t('navProjects') }}</span>
        <span>{{ t('navTemplates') }}</span>
        <span>{{ t('navHelp') }}</span>
      </nav>
    </div>

    <div class="editor-topbar__actions">
      <div class="editor-locale-switcher">
        <button
          v-for="option in localeOptions"
          :key="option.value"
          type="button"
          class="editor-locale-switcher__button"
          :class="{ 'is-active': locale === option.value }"
          @click="locale = option.value"
        >
          {{ option.value.toUpperCase() }}
        </button>
      </div>

      <span class="editor-status">{{ props.statusText }}</span>

      <UButton color="neutral" variant="ghost" @click="emit('save')">
        {{ t('save') }}
      </UButton>

      <UButton color="neutral" variant="soft" @click="emit('exportTemplate')">
        {{ t('exportTemplate') }}
      </UButton>

      <UButton color="neutral" class="!bg-black !text-white hover:!bg-neutral-800" @click="emit('exportRendered')">
        {{ t('export') }}
      </UButton>
    </div>
  </header>
</template>
