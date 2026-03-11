import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function bakeAnnotations(
  originalPdfBytes: Uint8Array,
  annotations: any[] // In a real app, this would be highly typed
) {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  for (const annotation of annotations) {
    const page = pages[annotation.pageIndex];
    if (!page) continue;

    const { height } = page.getSize();

    if (annotation.type === 'TEXT') {
      page.drawText(annotation.data.text, {
        x: annotation.data.left,
        y: height - annotation.data.top - annotation.data.fontSize,
        size: annotation.data.fontSize,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
    } else if (annotation.type === 'DRAW') {
      // Simplification: In a real app, you'd iterate over path data
      // For now, we'll just draw a placeholder for the drawing
      page.drawRectangle({
        x: annotation.data.left,
        y: height - annotation.data.top - annotation.data.height,
        width: annotation.data.width,
        height: annotation.data.height,
        color: rgb(1, 0.45, 0.08), // Primary Orange
        opacity: 0.5,
      });
    }
  }

  return await pdfDoc.save();
}
