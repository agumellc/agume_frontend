/**
 * Render HTML element to PDF and trigger download using html2pdf.js
 */

export type PdfExportOptions = {
  orientation?: 'portrait' | 'landscape';
  /** Margin in mm (number or array [top, right, bottom, left]) */
  margin?: number | [number, number, number, number];
};

const defaultMargin = 8;

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: PdfExportOptions
): Promise<void> {
  if (typeof window === 'undefined') return;
  const html2pdf = (await import('html2pdf.js')).default;
  const orientation = options?.orientation ?? 'portrait';
  const margin = options?.margin ?? defaultMargin;
  const opt = {
    margin,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation },
  };
  await html2pdf().set(opt).from(element).save();
}
