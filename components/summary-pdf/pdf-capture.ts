import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

// A4 dimensions in mm
const A4_W_MM = 210
const A4_H_MM = 297

export type ProgressCallback = (progress: number, step: string) => void

/** Yield to the browser so it can repaint (keeps animations alive). */
const yieldToBrowser = () => new Promise<void>(r => setTimeout(r, 0))

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

  // Two phases (capture + assemble), each counts as one step per page
  const totalSteps = pages.length * 2
  let completed = 0

  const report = (step: string) => {
    completed++
    onProgress?.(Math.round((completed / totalSteps) * 100), step)
  }

  // Phase 1: Capture each page as a high-res PNG
  const images: string[] = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    // 80ms pause: lets fonts/images settle AND allows the browser to repaint the spinner
    await new Promise(r => setTimeout(r, 80))

    const dataUrl = await toPng(page, {
      pixelRatio: 2, // 2x for crisp output
      quality: 1.0,
      cacheBust: true,
      skipAutoScale: true,
      filter: (node) => {
        if (node instanceof HTMLElement && node.style.display === 'none') return false
        return true
      },
    })
    images.push(dataUrl)
    report(`Captured page ${i + 1} of ${pages.length}`)
  }

  // Phase 2: Assemble into PDF with jsPDF
  // Each addImage call is CPU-heavy (PNG encoding), so we yield between pages
  // to keep the animation alive and give React a chance to update the progress bar.
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  for (let i = 0; i < images.length; i++) {
    // Yield before each addImage so the browser can repaint
    await yieldToBrowser()
    if (i > 0) pdf.addPage()
    pdf.addImage(images[i], 'PNG', 0, 0, A4_W_MM, A4_H_MM, undefined, 'FAST')
    report(`Assembling page ${i + 1} of ${images.length}`)
  }

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
