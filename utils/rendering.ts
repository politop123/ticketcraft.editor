import type { BarcodeElement, FieldElement, SampleDataMap, TextElement, TicketElement } from '~/types/editor'

export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const resolveElementValue = (element: TicketElement, sampleData: SampleDataMap, resolveVariables: boolean) => {
  if (element.kind === 'text') return element.content

  if (element.kind === 'field') {
    const key = element.source
    const value = resolveVariables ? sampleData[key] ?? element.placeholder : `{{${key}}}`
    return element.uppercase ? value.toUpperCase() : value
  }

  if (element.kind === 'qr' || element.kind === 'barcode') {
    return resolveVariables ? sampleData[element.source] ?? '' : `{{${element.source}}}`
  }

  return ''
}

const splitLongToken = (token: string, size: number) => {
  const chunks: string[] = []
  let offset = 0

  while (offset < token.length) {
    chunks.push(token.slice(offset, offset + size))
    offset += size
  }

  return chunks
}

const wrapText = (text: string, maxCharsPerLine: number) => {
  if (!text) return ['']
  const normalized = text.replace(/\r/g, '')
  const paragraphs = normalized.split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }

    const words = paragraph.split(/\s+/)
    let current = ''

    for (const word of words) {
      if (word.length > maxCharsPerLine) {
        const parts = splitLongToken(word, maxCharsPerLine)

        if (current) {
          lines.push(current)
          current = ''
        }

        lines.push(...parts.slice(0, -1))
        current = parts.at(-1) ?? ''
        continue
      }

      const next = current ? `${current} ${word}` : word
      if (next.length <= maxCharsPerLine) {
        current = next
      } else {
        if (current) lines.push(current)
        current = word
      }
    }

    if (current) lines.push(current)
  }

  return lines.length ? lines : ['']
}

const estimateCharWidth = (fontSize: number, fontWeight: number, letterSpacing: number) => {
  const weightFactor = fontWeight >= 800 ? 0.64 : fontWeight >= 700 ? 0.61 : 0.58
  return fontSize * weightFactor + Math.max(0, letterSpacing)
}

export const fitTextSize = (element: TextElement | FieldElement, text: string) => {
  if (element.fitMode === 'fixed') return element.fontSize
  if (!text) return element.fontSize

  const minFontSize = 8
  const innerWidth = Math.max(10, element.width - element.padding * 2)
  const innerHeight = Math.max(10, element.height - element.padding * 2)

  for (let size = element.fontSize; size >= minFontSize; size -= 1) {
    const charWidth = estimateCharWidth(size, element.fontWeight, element.letterSpacing)
    const maxCharsPerLine = Math.max(1, Math.floor(innerWidth / Math.max(1, charWidth)))
    const lines = wrapText(text, maxCharsPerLine)
    const totalHeight = lines.length * size * element.lineHeight

    if (totalHeight <= innerHeight + 0.5) return size
  }

  return minFontSize
}

const CODE_39_PATTERNS: Record<string, string> = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn'
}

export const normalizeCode39 = (value: string) => {
  const source = value.trim().toUpperCase()
  const normalized = source.replace(/[^0-9A-Z.\-\s\$\/\+%]/g, '-')
  return normalized || 'TICKET'
}

export const buildBarcodeSvg = (value: string, element: Pick<BarcodeElement, 'barColor' | 'background'>) => {
  const encoded = `*${normalizeCode39(value)}*`
  const barNarrow = 2
  const barWide = 5.2
  const gap = 1.8
  const height = 86
  let x = 10
  let bars = ''

  for (const character of encoded) {
    const pattern = CODE_39_PATTERNS[character] ?? CODE_39_PATTERNS['-']

    for (let index = 0; index < pattern.length; index += 1) {
      const isBar = index % 2 === 0
      const width = pattern[index] === 'w' ? barWide : barNarrow
      if (isBar) {
        bars += `<rect x="${x.toFixed(1)}" y="8" width="${width.toFixed(1)}" height="${height}" fill="${element.barColor}" rx="0.8" />`
      }
      x += width
      if (index < pattern.length - 1) x += gap
    }

    x += gap * 2.2
  }

  const label = escapeHtml(normalizeCode39(value))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.max(90, x + 10).toFixed(1)} 112" preserveAspectRatio="none" aria-hidden="true"><rect width="100%" height="100%" fill="${element.background}" />${bars}<text x="50%" y="108" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" fill="${element.barColor}" letter-spacing="2">${label}</text></svg>`
}

export const barcodeSvgDataUri = (value: string, element: Pick<BarcodeElement, 'barColor' | 'background'>) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildBarcodeSvg(value, element))}`

export const toHtmlText = (value: string) => escapeHtml(value)
