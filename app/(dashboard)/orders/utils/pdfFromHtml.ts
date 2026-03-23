/**
 * Render HTML element to PDF and trigger download using html2pdf.js
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  if (typeof window === 'undefined') return;
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = {
    margin: 8,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };
  await html2pdf().set(opt).from(element).save();
}
