import type { DataSourceKey, PagePreset, PagePresetKey, SampleDataMap, TicketElement, TicketTemplate } from '~/types/editor'
import { clamp, normalizeTemplate } from '~/utils/template'

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12))

export const pagePresets: PagePreset[] = [
  { key: 'ticket', width: 760, height: 320 },
  { key: 'a4_portrait', width: 794, height: 1123 },
  { key: 'a4_landscape', width: 1123, height: 794 },
  { key: 'a5_portrait', width: 559, height: 794 },
  { key: 'a5_landscape', width: 794, height: 559 },
  { key: 'a6_portrait', width: 397, height: 559 },
  { key: 'a6_landscape', width: 559, height: 397 }
]

export const getPresetByKey = (key: PagePresetKey) => pagePresets.find((preset) => preset.key === key)

const scaleElementToPreset = (element: TicketElement, widthRatio: number, heightRatio: number, nextWidth: number, nextHeight: number): TicketElement => {
  const next = {
    ...element,
    x: Math.round(element.x * widthRatio),
    y: Math.round(element.y * heightRatio),
    width: Math.max(12, Math.round(element.width * widthRatio)),
    height: Math.max(12, Math.round(element.height * heightRatio))
  } as TicketElement

  if (next.label === 'Perforation Divider' && next.kind === 'shape') {
    next.height = nextHeight
    next.width = Math.max(2, Math.round(element.width * widthRatio))
    next.x = Math.round(nextWidth * 0.247)
    next.y = 0
  }

  next.x = clamp(next.x, 0, Math.max(0, nextWidth - next.width))
  next.y = clamp(next.y, 0, Math.max(0, nextHeight - next.height))

  if (next.kind === 'text' || next.kind === 'field') {
    next.fontSize = Math.max(8, Math.round(next.fontSize * Math.min(widthRatio, heightRatio)))
    next.padding = Math.max(0, Math.round(next.padding * Math.min(widthRatio, heightRatio)))
  }

  if (next.kind === 'qr' || next.kind === 'barcode') {
    next.padding = Math.max(0, Math.round(next.padding * Math.min(widthRatio, heightRatio)))
  }

  if (next.kind === 'shape') {
    next.borderWidth = Math.max(0, Math.round(next.borderWidth * Math.min(widthRatio, heightRatio)))
    next.borderRadius = Math.max(0, Math.round(next.borderRadius * Math.min(widthRatio, heightRatio)))
  }

  return next
}

export const applyPagePreset = (template: TicketTemplate, presetKey: PagePresetKey): TicketTemplate => {
  const preset = getPresetByKey(presetKey)

  if (!preset) {
    return normalizeTemplate({
      ...template,
      sizePreset: 'custom'
    })
  }

  const widthRatio = preset.width / template.width
  const heightRatio = preset.height / template.height

  return normalizeTemplate({
    ...template,
    sizePreset: preset.key,
    width: preset.width,
    height: preset.height,
    elements: template.elements.map((element) => scaleElementToPreset(element, widthRatio, heightRatio, preset.width, preset.height))
  })
}

export const dataSourceKeys: DataSourceKey[] = [
  'event_name',
  'event_subtitle',
  'event_date',
  'event_time',
  'venue_name',
  'seat',
  'section',
  'row',
  'order_id',
  'ticket_id',
  'barcode_value',
  'qr_value'
]

export const defaultSampleData = (): SampleDataMap => ({
  event_name: 'NEON VELOCITY',
  event_subtitle: 'SUMMER MUSIC FESTIVAL 2024',
  event_date: 'JUL 15',
  event_time: 'STARTS 6:00 PM',
  venue_name: 'The Grand Arena, Central City',
  seat: 'A-12',
  section: 'SECTION 102',
  row: 'ROW 08',
  order_id: 'TICKETCRAFT #0042',
  ticket_id: 'TC-2026-0042',
  barcode_value: 'TC-2026-0042',
  qr_value: 'https://ticketcraft.app/ticket/TC-2026-0042'
})

export const createElement = (kind: TicketElement['kind']): TicketElement => {
  switch (kind) {
    case 'text':
      return {
        id: uid(),
        kind: 'text',
        label: 'Text block',
        x: 52,
        y: 52,
        width: 280,
        height: 44,
        rotation: 0,
        opacity: 1,
        zIndex: 20,
        content: 'New text block',
        fontSize: 22,
        fontWeight: 700,
        color: '#161616',
        letterSpacing: 0,
        align: 'left',
        lineHeight: 1.1,
        padding: 4,
        fitMode: 'shrink'
      }
    case 'field':
      return {
        id: uid(),
        kind: 'field',
        label: 'Dynamic field',
        x: 72,
        y: 82,
        width: 240,
        height: 36,
        rotation: 0,
        opacity: 1,
        zIndex: 30,
        source: 'event_name',
        placeholder: '{{event_name}}',
        fontSize: 22,
        fontWeight: 700,
        color: '#161616',
        letterSpacing: 0,
        align: 'left',
        lineHeight: 1.1,
        uppercase: false,
        padding: 4,
        fitMode: 'shrink'
      }
    case 'qr':
      return {
        id: uid(),
        kind: 'qr',
        label: 'QR code',
        x: 560,
        y: 120,
        width: 140,
        height: 140,
        rotation: 0,
        opacity: 1,
        zIndex: 80,
        source: 'qr_value',
        background: '#ffffff',
        padding: 10,
        showCaption: false
      }
    case 'barcode':
      return {
        id: uid(),
        kind: 'barcode',
        label: 'Barcode',
        x: 520,
        y: 256,
        width: 188,
        height: 48,
        rotation: 0,
        opacity: 1,
        zIndex: 90,
        source: 'barcode_value',
        background: '#f5f5f3',
        barColor: '#171717',
        padding: 10
      }
    case 'shape':
      return {
        id: uid(),
        kind: 'shape',
        label: 'Shape',
        x: 36,
        y: 36,
        width: 180,
        height: 72,
        rotation: 0,
        opacity: 1,
        zIndex: 10,
        background: 'transparent',
        borderColor: '#9b9b97',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16
      }
  }
}

export const defaultTemplate = (): TicketTemplate =>
  normalizeTemplate({
    id: uid(),
    name: 'Neon Velocity Ticket',
    locale: 'en',
    sizePreset: 'ticket',
    width: 760,
    height: 320,
    backgroundColor: '#fbfaf8',
    backgroundImage: '',
    borderRadius: 18,
    showGrid: true,
    elements: [
      {
        id: uid(),
        kind: 'shape',
        label: 'Perforation Divider',
        x: 188,
        y: 0,
        width: 2,
        height: 320,
        rotation: 0,
        opacity: 1,
        zIndex: 1,
        background: '#c6c0bb',
        borderColor: '#c6c0bb',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 999
      },
      {
        id: uid(),
        kind: 'shape',
        label: 'Header Bar 1',
        x: 28,
        y: 26,
        width: 58,
        height: 8,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        background: '#e3e1de',
        borderColor: '#e3e1de',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 999
      },
      {
        id: uid(),
        kind: 'shape',
        label: 'Header Bar 2',
        x: 28,
        y: 44,
        width: 120,
        height: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 2,
        background: '#e6e3df',
        borderColor: '#e6e3df',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 999
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Event Name',
        x: 28,
        y: 84,
        width: 420,
        height: 54,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        source: 'event_name',
        placeholder: '{{event_name}}',
        fontSize: 34,
        fontWeight: 800,
        color: '#161616',
        letterSpacing: -0.6,
        align: 'left',
        lineHeight: 1,
        uppercase: false,
        padding: 4,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Event Subtitle',
        x: 30,
        y: 142,
        width: 390,
        height: 34,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        source: 'event_subtitle',
        placeholder: '{{event_subtitle}}',
        fontSize: 14,
        fontWeight: 600,
        color: '#6a6a66',
        letterSpacing: 1.2,
        align: 'left',
        lineHeight: 1.15,
        uppercase: true,
        padding: 2,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Event Date',
        x: 580,
        y: 30,
        width: 120,
        height: 34,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        source: 'event_date',
        placeholder: '{{event_date}}',
        fontSize: 21,
        fontWeight: 800,
        color: '#161616',
        letterSpacing: -0.2,
        align: 'right',
        lineHeight: 1,
        uppercase: false,
        padding: 0,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Event Time',
        x: 520,
        y: 64,
        width: 180,
        height: 24,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        source: 'event_time',
        placeholder: '{{event_time}}',
        fontSize: 12,
        fontWeight: 700,
        color: '#7b7b76',
        letterSpacing: 1.4,
        align: 'right',
        lineHeight: 1,
        uppercase: true,
        padding: 0,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Venue Name',
        x: 30,
        y: 190,
        width: 330,
        height: 26,
        rotation: 0,
        opacity: 1,
        zIndex: 4,
        source: 'venue_name',
        placeholder: '{{venue_name}}',
        fontSize: 16,
        fontWeight: 600,
        color: '#3d3d3a',
        letterSpacing: 0,
        align: 'left',
        lineHeight: 1.2,
        uppercase: false,
        padding: 2,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Section',
        x: 30,
        y: 246,
        width: 110,
        height: 24,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        source: 'section',
        placeholder: '{{section}}',
        fontSize: 11,
        fontWeight: 700,
        color: '#7a7a76',
        letterSpacing: 1.1,
        align: 'left',
        lineHeight: 1,
        uppercase: true,
        padding: 0,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Row',
        x: 150,
        y: 246,
        width: 90,
        height: 24,
        rotation: 0,
        opacity: 1,
        zIndex: 5,
        source: 'row',
        placeholder: '{{row}}',
        fontSize: 11,
        fontWeight: 700,
        color: '#7a7a76',
        letterSpacing: 1.1,
        align: 'left',
        lineHeight: 1,
        uppercase: true,
        padding: 0,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Seat',
        x: 260,
        y: 232,
        width: 92,
        height: 52,
        rotation: 0,
        opacity: 1,
        zIndex: 6,
        source: 'seat',
        placeholder: '{{seat}}',
        fontSize: 34,
        fontWeight: 800,
        color: '#161616',
        letterSpacing: -0.6,
        align: 'left',
        lineHeight: 1,
        uppercase: false,
        padding: 0,
        fitMode: 'shrink'
      },
      {
        id: uid(),
        kind: 'qr',
        label: 'QR Code',
        x: 566,
        y: 108,
        width: 142,
        height: 142,
        rotation: 0,
        opacity: 1,
        zIndex: 7,
        source: 'qr_value',
        background: '#ffffff',
        padding: 10,
        showCaption: false
      },
      {
        id: uid(),
        kind: 'barcode',
        label: 'Barcode',
        x: 522,
        y: 258,
        width: 186,
        height: 42,
        rotation: 0,
        opacity: 1,
        zIndex: 8,
        source: 'barcode_value',
        background: '#fbfaf8',
        barColor: '#171717',
        padding: 0
      },
      {
        id: uid(),
        kind: 'field',
        label: 'Ticket ID',
        x: 520,
        y: 298,
        width: 188,
        height: 18,
        rotation: 0,
        opacity: 1,
        zIndex: 8,
        source: 'ticket_id',
        placeholder: '{{ticket_id}}',
        fontSize: 10,
        fontWeight: 600,
        color: '#70706c',
        letterSpacing: 0.8,
        align: 'center',
        lineHeight: 1,
        uppercase: true,
        padding: 0,
        fitMode: 'shrink'
      }
    ]
  })
