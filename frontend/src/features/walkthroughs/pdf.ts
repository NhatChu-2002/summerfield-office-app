import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { InspectionPhoto } from './photos.ts'
import type { ReportLine } from './report'

const pageWidth = 612
const pageHeight = 792
const margin = 45

function printable(value: string): string {
  return value.replace(/[\u2012-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"').replace(/\u2022/g, '-').replace(/\u00b0/g, ' degrees')
    .normalize('NFKD').replace(/[^\x20-\x7e\n]/g, '?')
}

async function embeddablePhoto(photo: InspectionPhoto, loadPhoto: (photo: InspectionPhoto) => Promise<Blob>): Promise<{ bytes: ArrayBuffer; mime: 'image/png' | 'image/jpeg' }> {
  const blob = await loadPhoto(photo)
  if (photo.mime_type === 'image/png') return { bytes: await blob.arrayBuffer(), mime: 'image/png' }
  if (photo.mime_type === 'image/jpeg') return { bytes: await blob.arrayBuffer(), mime: 'image/jpeg' }
  const image = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = image.width; canvas.height = image.height
    canvas.getContext('2d')?.drawImage(image, 0, 0)
    const converted = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))
    if (!converted) throw new Error('A WebP photo could not be converted for PDF export.')
    return { bytes: await converted.arrayBuffer(), mime: 'image/jpeg' }
  } finally { image.close() }
}

export async function createInspectionPdf(title: string, visitDate: string, copy: 'manager' | 'internal', lines: ReportLine[], photos: InspectionPhoto[], photoLabels: Record<string, string>, loadPhoto: (photo: InspectionPhoto) => Promise<Blob>): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(printable(title))
  pdf.setAuthor('Summerfield Tea Bar')
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let page = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  function nextPage() { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin }
  function ensure(height: number) { if (y - height < margin + 12) nextPage() }
  function drawWrapped(text: string, size: number, weight: 'regular' | 'bold', indent = 0) {
    const font = weight === 'bold' ? bold : regular
    const width = pageWidth - 2 * margin - indent
    const leading = size + 4
    for (const paragraph of printable(text).split('\n')) {
      const words = paragraph.split(/\s+/).filter(Boolean)
      if (!words.length) { y -= leading; continue }
      let line = ''
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue }
        if (line) { ensure(leading); page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.16, 0.23, 0.18) }); y -= leading; line = '' }
        for (const char of word) {
          if (font.widthOfTextAtSize(line + char, size) > width && line) { ensure(leading); page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.16, 0.23, 0.18) }); y -= leading; line = '' }
          line += char
        }
      }
      if (line) { ensure(leading); page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.16, 0.23, 0.18) }); y -= leading }
    }
  }

  drawWrapped(title, 17, 'bold')
  y -= 5
  drawWrapped(`${visitDate}  |  ${copy === 'manager' ? 'Manager copy' : 'Internal copy'}`, 9, 'regular')
  y -= 10
  for (const line of lines) {
    if (line.kind === 'heading') { y -= 8; drawWrapped(line.text, 11, 'bold'); y -= 3 }
    else if (line.kind === 'bullet') drawWrapped(`- ${line.text}`, 9, 'regular', 10)
    else drawWrapped(line.text, 9, 'regular')
  }

  if (photos.length) {
    y -= 10; drawWrapped('Photo evidence', 11, 'bold')
    for (const photo of photos) {
      const { bytes, mime } = await embeddablePhoto(photo, loadPhoto)
      const image = mime === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
      const scale = Math.min(280 / image.width, 210 / image.height, 1)
      const height = image.height * scale
      ensure(height + 27)
      drawWrapped(photoLabels[photo.question_key] || photo.question_key, 9, 'bold')
      y -= 2
      page.drawImage(image, { x: margin, y: y - height, width: image.width * scale, height })
      y -= height + 12
    }
  }
  pdf.getPages().forEach((sheet, index) => {
    sheet.drawLine({ start: { x: margin, y: 34 }, end: { x: pageWidth - margin, y: 34 }, thickness: 0.5, color: rgb(0.78, 0.85, 0.8) })
    sheet.drawText(`Summerfield Tea Bar  |  ${copy === 'manager' ? 'Manager copy' : 'Internal copy'}  |  Page ${index + 1}`, { x: margin, y: 20, size: 7.5, font: regular, color: rgb(0.4, 0.46, 0.42) })
  })
  return pdf.save()
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes.length)
  copy.set(bytes)
  const url = URL.createObjectURL(new Blob([copy], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
