import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

// A4 dimensions in mm
const A4_W_MM = 210
const A4_H_MM = 297

export type ProgressCallback = (progress: number, step: string) => void

/**
 * Captures all [data-pdf-page] divs inside a container,
 * converts each to a high-resolution PNG, and assembles
 * them into a multi-page A4 PDF.
 */
export async function captureAndAssemblePDF(
  container: HTMLElement,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const pages = container.querySelectorAll<HTMLElement>('[data-pdf-page]')
  if (pages.length === 0) throw new Error('No PDF pages found')

  const totalSteps = pages.length + 1 // capture each + assemble
  let completed = 0

  const report = (step: string) => {
    completed++
    onProgress?.(Math.round((completed / totalSteps) * 100), step)
  }

  // Step 1: Capture each page as a high-res PNG
  const images: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    // Give a small delay for rendering to settle (fonts, images)
    await new Promise(r => setTimeout(r, 80))

    const dataUrl = await toPng(page, {
      pixelRatio: 2, // 2x for crisp output
      quality: 1.0,
      cacheBust: true,
      skipAutoScale: true,
      // Filter out cross-origin resources that would taint the capture
      filter: (node) => {
        // Skip hidden elements
        if (node instanceof HTMLElement && node.style.display === 'none') return false
        return true
      },
    })
    images.push(dataUrl)
    report(`Captured page ${i + 1} of ${pages.length}`)
  }

  // Step 2: Assemble into PDF with jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  for (let i = 0; i < images.length; i++) {
    if (i > 0) pdf.addPage()
    pdf.addImage(images[i], 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST')
  }

  report('Assembling PDF')

  return pdf.output('blob')
}

/**
 * Triggers a browser download for a blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
