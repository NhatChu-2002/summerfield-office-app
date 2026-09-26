import assert from 'node:assert/strict'
import test from 'node:test'
import { PDFDocument } from 'pdf-lib'
import { createInspectionPdf } from './pdf.ts'

test('manager PDF is a readable multi-page document for long inspections', async () => {
  const lines = [{ kind: 'heading', text: 'Section results' }, ...Array.from({ length: 110 }, (_, index) => ({ kind: 'bullet', text: `Question ${index + 1}: ${'Detailed observation '.repeat(5)}` }))]
  const bytes = await createInspectionPdf('Store One Store Walk-Through', '2026-09-26', 'manager', lines, [], {}, async () => { throw new Error('No photos expected') })
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), '%PDF')
  const document = await PDFDocument.load(bytes)
  assert.ok(document.getPageCount() > 1)
  assert.equal(document.getTitle(), 'Store One Store Walk-Through')
})
