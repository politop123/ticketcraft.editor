import QRCode from 'qrcode'
import type { SampleDataMap, TicketElement, TicketTemplate } from '~/types/editor'
import { barcodeSvgDataUri, escapeHtml, fitTextSize, resolveElementValue, toHtmlText } from '~/utils/rendering'

const baseStyle = (element: TicketElement) =>
  [
    'position:absolute',
    `left:${element.x}px`,
    `top:${element.y}px`,
    `width:${element.width}px`,
    `height:${element.height}px`,
    `opacity:${element.opacity}`,
    `z-index:${element.zIndex}`,
    `transform:rotate(${element.rotation}deg)`,
    'transform-origin:center center',
    'box-sizing:border-box'
  ].join(';')

const buildTemplateRuntime = () => `<script>
(function(){
  const patterns = {
    '0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',
    'A':'wnnnnwnnw','B':'nnwnnwnnw','C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn','G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn',
    'K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww','O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn','S':'nnwnnnwwn','T':'nnnnwnwwn',
    'U':'wwnnnnnnw','V':'nwwnnnnnw','W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','$':'nwnwnwnnn','/':'nwnwnnnwn','+':'nwnnnwnwn','%':'nnnwnwnwn','*':'nwnnwnwnn'
  }

  const normalize = (value) => (value || '').trim().toUpperCase().replace(/[^0-9A-Z.\-\s\$\/\+%]/g, '-') || 'TICKET'

  const renderCode39 = (value, barColor, background) => {
    const encoded = '*' + normalize(value) + '*'
    const barNarrow = 2
    const barWide = 5.2
    const gap = 1.8
    let x = 10
    let bars = ''

    for (const character of encoded) {
      const pattern = patterns[character] || patterns['-']
      for (let index = 0; index < pattern.length; index += 1) {
        const isBar = index % 2 === 0
        const width = pattern[index] === 'w' ? barWide : barNarrow
        if (isBar) {
          bars += '<rect x="' + x.toFixed(1) + '" y="8" width="' + width.toFixed(1) + '" height="86" fill="' + barColor + '" rx="0.8" />'
        }
        x += width
        if (index < pattern.length - 1) x += gap
      }
      x += gap * 2.2
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + Math.max(90, x + 10).toFixed(1) + ' 112" preserveAspectRatio="none" aria-hidden="true"><rect width="100%" height="100%" fill="' + background + '" />' + bars + '<text x="50%" y="108" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" fill="' + barColor + '" letter-spacing="2">' + normalize(value) + '</text></svg>'
  }

  document.querySelectorAll('[data-ticket-kind="barcode"]').forEach(function(node){
    const value = node.getAttribute('data-ticket-value') || ''
    if (!value || value.includes('{{')) return
    const barColor = node.getAttribute('data-ticket-bar-color') || '#111111'
    const background = node.getAttribute('data-ticket-background') || '#ffffff'
    node.innerHTML = '<img alt="Barcode" style="width:100%;height:100%;display:block;object-fit:fill" src="data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(renderCode39(value, barColor, background)) + '" />'
  })
})();
</script>`

export const generateTicketHtml = async (options: {
  template: TicketTemplate
  sampleData: SampleDataMap
  resolveVariables: boolean
}) => {
  const { template, sampleData, resolveVariables } = options

  const pieces = await Promise.all(
    [...template.elements]
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(async (element) => {
        if (element.kind === 'shape') {
          return `<div style="${baseStyle(element)};background:${element.background};border:${element.borderWidth}px ${element.borderStyle} ${element.borderColor};border-radius:${element.borderRadius}px"></div>`
        }

        if (element.kind === 'qr') {
          const value = resolveElementValue(element, sampleData, resolveVariables)
          const innerSize = Math.max(48, Math.min(element.width, element.height) - element.padding * 2 - (element.showCaption ? 18 : 0))

          if (resolveVariables && value) {
            const src = await QRCode.toDataURL(value, { margin: 0, width: innerSize * 3 })
            return `<div style="${baseStyle(element)};overflow:hidden;border-radius:10px;background:${element.background};padding:${element.padding}px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px"><img src="${src}" alt="QR" style="width:${innerSize}px;height:${innerSize}px;max-width:100%;max-height:${Math.max(24, element.height - element.padding * 2 - (element.showCaption ? 18 : 0))}px;object-fit:contain;display:block" />${element.showCaption ? '<div style="font-size:8px;font-weight:700;color:#3b3b3b;letter-spacing:.08em;text-transform:uppercase;line-height:1">Dynamic QR</div>' : ''}</div>`
          }

          return `<div data-ticket-kind="qr" data-ticket-value="${escapeHtml(value)}" style="${baseStyle(element)};overflow:hidden;border-radius:10px;background:${element.background};padding:${element.padding}px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;border:1px dashed rgba(0,0,0,.16)"><div style="width:${innerSize}px;height:${innerSize}px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:repeating-linear-gradient(45deg,#f1f1ef,#f1f1ef 8px,#fafaf8 8px,#fafaf8 16px);font-size:11px;font-weight:700;color:#5c5c57;letter-spacing:.12em;text-transform:uppercase">QR</div><div style="max-width:100%;padding:0 4px;font-size:10px;line-height:1.2;color:#6a6a66;text-align:center;word-break:break-word">${toHtmlText(value || '{{qr_value}}')}</div></div>`
        }

        if (element.kind === 'barcode') {
          const value = resolveElementValue(element, sampleData, resolveVariables)
          const svg = resolveVariables ? barcodeSvgDataUri(value, element) : ''
          return `<div data-ticket-kind="barcode" data-ticket-value="${escapeHtml(value)}" data-ticket-background="${escapeHtml(element.background)}" data-ticket-bar-color="${escapeHtml(element.barColor)}" style="${baseStyle(element)};overflow:hidden;background:${element.background};padding:${element.padding}px;display:flex;align-items:center;justify-content:center">${resolveVariables ? `<img src="${svg}" alt="Barcode" style="width:100%;height:100%;object-fit:fill;display:block" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(0,0,0,.12);color:#70706c;font-size:11px;letter-spacing:.14em;text-transform:uppercase">${toHtmlText(value || '{{barcode_value}}')}</div>`}</div>`
        }

        const text = resolveElementValue(element, sampleData, resolveVariables)
        const fittedSize = fitTextSize(element, text)
        return `<div style="${baseStyle(element)};font-size:${fittedSize}px;font-weight:${element.fontWeight};color:${element.color};letter-spacing:${element.letterSpacing}px;text-align:${element.align};line-height:${element.lineHeight};font-family:Inter, ui-sans-serif, system-ui, sans-serif;white-space:pre-wrap;overflow:hidden;word-break:break-word;padding:${element.padding}px;${element.kind === 'field' && element.uppercase ? 'text-transform:uppercase;' : ''}">${toHtmlText(text)}</div>`
      })
  )

  return `<!DOCTYPE html>
<html lang="${template.locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(template.name)}</title>
  </head>
  <body style="margin:0;padding:40px;background:#ecebe8;font-family:Inter, ui-sans-serif, system-ui, sans-serif;display:flex;justify-content:center">
    <div style="position:relative;width:${template.width}px;height:${template.height}px;border-radius:${template.borderRadius}px;overflow:hidden;box-shadow:0 28px 60px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.05);background:${template.backgroundColor}">
      <div style="position:absolute;inset:0;background:${template.backgroundImage ? `linear-gradient(rgba(255,255,255,.15), rgba(255,255,255,.15)), url('${template.backgroundImage}') center/cover no-repeat` : 'transparent'}"></div>
      ${template.showGrid ? '<div style="position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px, rgba(201,197,191,.7) 1px, transparent 0);background-size:18px 18px;pointer-events:none"></div>' : ''}
      ${pieces.join('\n')}
    </div>
    ${resolveVariables ? '' : buildTemplateRuntime()}
  </body>
</html>`
}
