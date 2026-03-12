import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";

async function createSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();
  const fontSize = 30;

  page.drawText("PDFab Sample Document", {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0.53, 0.71),
  });

  page.drawText("This is a test PDF for the PDFab Editor.", {
    x: 50,
    y: height - 10 * fontSize,
    size: 20,
    font: timesRomanFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(
    "You can use the tools above to annotate, sign, and edit this page.",
    {
      x: 50,
      y: height - 12 * fontSize,
      size: 14,
      font: timesRomanFont,
      color: rgb(0.4, 0.4, 0.4),
    },
  );

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync("public/sample.pdf", pdfBytes);
}

createSamplePdf().catch(console.error);
