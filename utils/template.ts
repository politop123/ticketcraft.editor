import type { TicketElement, TicketTemplate } from '~/types/editor'

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const sanitizeNumber = (value: unknown, fallback: number, options?: { min?: number; max?: number; round?: boolean }) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  const safe = Number.isFinite(numeric) ? numeric : fallback
  const rounded = options?.round === false ? safe : Math.round(safe)
  const min = options?.min ?? Number.NEGATIVE_INFINITY
  const max = options?.max ?? Number.POSITIVE_INFINITY
  return clamp(rounded, min, max)
}

export const deepClone = <T>(value: T): T => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

const normalizeBounds = (element: TicketElement) => {
  switch (element.kind) {
    case 'qr':
      return { width: 48, height: 48 }
    case 'barcode':
      return { width: 96, height: 36 }
    case 'text':
    case 'field':
      return { width: 56, height: 24 }
    default:
      return { width: 12, height: 12 }
  }
}

export const normalizeElement = (element: TicketElement, templateWidth: number, templateHeight: number): TicketElement => {
  const min = normalizeBounds(element)
  const width = sanitizeNumber(element.width, min.width, { min: min.width, max: Math.max(min.width, templateWidth) })
  const height = sanitizeNumber(element.height, min.height, { min: min.height, max: Math.max(min.height, templateHeight) })

  const base = {
    ...element,
    x: sanitizeNumber(element.x, 0, { min: 0, max: Math.max(0, templateWidth - width) }),
    y: sanitizeNumber(element.y, 0, { min: 0, max: Math.max(0, templateHeight - height) }),
    width,
    height,
    rotation: sanitizeNumber(element.rotation, 0, { min: -360, max: 360 }),
    opacity: sanitizeNumber(element.opacity, 1, { min: 0.05, max: 1, round: false }),
    zIndex: sanitizeNumber(element.zIndex, 1, { min: 1, max: 9999 }),
    label: String(element.label || element.kind),
    locked: Boolean(element.locked)
  } as TicketElement

  if (base.kind === 'text' || base.kind === 'field') {
    return {
      ...base,
      fontSize: sanitizeNumber(base.fontSize, 16, { min: 8, max: 240 }),
      fontWeight: sanitizeNumber(base.fontWeight, 500, { min: 100, max: 900 }),
      letterSpacing: sanitizeNumber(base.letterSpacing, 0, { min: -8, max: 40, round: false }),
      lineHeight: sanitizeNumber(base.lineHeight, 1.1, { min: 0.8, max: 3, round: false }),
      padding: sanitizeNumber(base.padding, 0, { min: 0, max: 80 }),
      fitMode: base.fitMode === 'fixed' ? 'fixed' : 'shrink',
      align: base.align === 'center' || base.align === 'right' ? base.align : 'left',
      color: base.color || '#171717'
    }
  }

  if (base.kind === 'qr') {
    return {
      ...base,
      padding: sanitizeNumber(base.padding, 10, { min: 0, max: 48 }),
      background: base.background || '#ffffff',
      showCaption: Boolean(base.showCaption)
    }
  }

  if (base.kind === 'barcode') {
    return {
      ...base,
      padding: sanitizeNumber(base.padding, 10, { min: 0, max: 48 }),
      background: base.background || '#ffffff',
      barColor: base.barColor || '#111111'
    }
  }

  if (base.kind === 'shape') {
    return {
      ...base,
      background: base.background || 'transparent',
      borderColor: base.borderColor || '#9b9b97',
      borderWidth: sanitizeNumber(base.borderWidth, 1, { min: 0, max: 24 }),
      borderRadius: sanitizeNumber(base.borderRadius, 0, { min: 0, max: 999 }),
      borderStyle: ['solid', 'dashed', 'dotted'].includes(base.borderStyle) ? base.borderStyle : 'solid'
    }
  }

  return base
}

export const normalizeTemplate = (template: TicketTemplate): TicketTemplate => {
  const width = sanitizeNumber(template.width, 760, { min: 180, max: 2200 })
  const height = sanitizeNumber(template.height, 320, { min: 120, max: 2200 })

  return {
    ...template,
    width,
    height,
    borderRadius: sanitizeNumber(template.borderRadius, 18, { min: 0, max: 120 }),
    backgroundColor: template.backgroundColor || '#fbfaf8',
    backgroundImage: template.backgroundImage || '',
    elements: [...template.elements]
      .map((element) => normalizeElement(element, width, height))
      .sort((a, b) => a.zIndex - b.zIndex)
  }
}
