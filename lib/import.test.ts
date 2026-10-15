import { describe, it, expect } from 'vitest'
import { textToDoc, validateImportFile, titleFromName, ImportError } from './import'

describe('textToDoc', () => {
  it('turns blank-line separated text into paragraphs', () => {
    const doc = textToDoc('First\n\nSecond')
    expect(doc.content).toHaveLength(2)
  })
  it('keeps single newlines as hard breaks', () => {
    const doc = textToDoc('a\nb')
    expect(doc.content?.[0].content?.map((n) => n.type)).toEqual(['text', 'hardBreak', 'text'])
  })
  it('returns no content for whitespace-only input', () => {
    expect(textToDoc('   \n\n  ').content).toHaveLength(0)
  })
})

describe('validateImportFile', () => {
  it('rejects unsupported types', () => {
    expect(() => validateImportFile({ name: 'a.pdf', size: 10 })).toThrow(ImportError)
  })
  it('rejects empty and oversized files', () => {
    expect(() => validateImportFile({ name: 'a.txt', size: 0 })).toThrow(/empty/)
    expect(() => validateImportFile({ name: 'a.txt', size: 6 * 1024 * 1024 })).toThrow(/too large/)
  })
  it('accepts supported files', () => {
    expect(() => validateImportFile({ name: 'a.MD', size: 100 })).not.toThrow()
  })
})

describe('titleFromName', () => {
  it('strips the extension', () => {
    expect(titleFromName('notes.v2.md')).toBe('notes.v2')
  })
})