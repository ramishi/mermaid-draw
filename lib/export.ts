import { toCanvas, toPng, toSvg } from 'html-to-image'
import { jsPDF } from 'jspdf'

export type CanvasExportFormat = 'png' | 'svg' | 'webp' | 'pdf'

function getExportOptions() {
  return {
    backgroundColor: '#f7f8fa',
    cacheBust: true,
    pixelRatio: Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2),
    filter: (node: HTMLElement) => {
      const className = typeof node.className === 'string' ? node.className : ''
      return !className.includes('react-flow__controls') && !className.includes('react-flow__minimap')
    },
  }
}

function getCanvasTarget() {
  const target = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (!target) throw new Error('Canvas is not ready for export')
  return target
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}

export async function exportCanvas(format: CanvasExportFormat) {
  const target = getCanvasTarget()

  if (format === 'svg') {
    downloadDataUrl(await toSvg(target, getExportOptions()), 'diagram.svg')
    return
  }

  if (format === 'png') {
    downloadDataUrl(await toPng(target, getExportOptions()), 'diagram.png')
    return
  }

  const canvas = await toCanvas(target, getExportOptions())
  if (format === 'webp') {
    downloadDataUrl(canvas.toDataURL('image/webp', 0.95), 'diagram.webp')
    return
  }

  const imageData = canvas.toDataURL('image/png')
  const orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [canvas.width, canvas.height],
  })
  pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save('diagram.pdf')
}
