export type EditorLocale = 'uk' | 'en'

export type DataSourceKey =
  | 'event_name'
  | 'event_subtitle'
  | 'event_date'
  | 'event_time'
  | 'venue_name'
  | 'seat'
  | 'section'
  | 'row'
  | 'order_id'
  | 'ticket_id'
  | 'barcode_value'
  | 'qr_value'

export type SampleDataMap = Record<DataSourceKey, string>

export type PagePresetKey =
  | 'ticket'
  | 'a4_portrait'
  | 'a4_landscape'
  | 'a5_portrait'
  | 'a5_landscape'
  | 'a6_portrait'
  | 'a6_landscape'
  | 'custom'

export interface PagePreset {
  key: Exclude<PagePresetKey, 'custom'>
  width: number
  height: number
}

export interface BaseElement {
  id: string
  kind: 'text' | 'field' | 'qr' | 'barcode' | 'shape'
  label: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  locked?: boolean
}

interface TextLikeProps {
  fontSize: number
  fontWeight: number
  color: string
  letterSpacing: number
  align: 'left' | 'center' | 'right'
  lineHeight: number
  padding: number
  fitMode: 'fixed' | 'shrink'
}

export interface TextElement extends BaseElement, TextLikeProps {
  kind: 'text'
  content: string
}

export interface FieldElement extends BaseElement, TextLikeProps {
  kind: 'field'
  source: DataSourceKey
  placeholder: string
  uppercase?: boolean
}

export interface QrElement extends BaseElement {
  kind: 'qr'
  source: DataSourceKey
  background: string
  padding: number
  showCaption: boolean
}

export interface BarcodeElement extends BaseElement {
  kind: 'barcode'
  source: DataSourceKey
  background: string
  barColor: string
  padding: number
}

export interface ShapeElement extends BaseElement {
  kind: 'shape'
  background: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid' | 'dashed' | 'dotted'
  borderRadius: number
}

export type TicketElement = TextElement | FieldElement | QrElement | BarcodeElement | ShapeElement

export interface TicketTemplate {
  id: string
  name: string
  locale: EditorLocale
  sizePreset: PagePresetKey
  width: number
  height: number
  backgroundColor: string
  backgroundImage: string
  borderRadius: number
  showGrid: boolean
  elements: TicketElement[]
}
