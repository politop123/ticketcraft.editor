<script setup lang="ts">
const props = defineProps<{
  open: boolean
  mode: 'template' | 'rendered'
  html: string
}>()

const emit = defineEmits<{
  'update:open': [boolean]
}>()

const { locale, t } = useEditorI18n()
const copied = ref(false)

const title = computed(() => (props.mode === 'template' ? t('htmlTemplate') : t('renderedHtml')))

const copyCode = async (html: string) => {
  await navigator.clipboard.writeText(html)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 1600)
}

const downloadFile = (html: string, mode: 'template' | 'rendered') => {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = mode === 'template' ? 'ticket-template.html' : 'ticket-rendered.html'
  link.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <div
    v-if="open"
    class="export-overlay"
    @click.self="emit('update:open', false)"
  >
    <div class="export-modal">
      <div class="export-modal__header">
        <div>
          <h3>{{ title }}</h3>
          <p v-if="mode === 'template'">
            <template v-if="locale === 'uk'">
              Плейсхолдери зберігаються як <span v-pre>{{fields}}</span>.
            </template>
            <template v-else>
              Placeholders are preserved as <span v-pre>{{fields}}</span>.
            </template>
          </p>
          <p v-else>{{ t('renderedDescription') }}</p>
        </div>

        <div class="export-modal__actions">
          <UButton
            color="neutral"
            variant="soft"
            @click="copyCode(html)"
          >
            {{ copied ? t('copied') : t('copy') }}
          </UButton>

          <UButton
            color="neutral"
            variant="soft"
            @click="emit('update:open', false)"
          >
            {{ t('close') }}
          </UButton>

          <UButton
            color="neutral"
            class="!bg-black !text-white"
            @click="downloadFile(html, mode)"
          >
            {{ t('download') }}
          </UButton>
        </div>
      </div>

      <textarea
        class="export-modal__code"
        readonly
        :value="html"
      />
    </div>
  </div>
</template>
