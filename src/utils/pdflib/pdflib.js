import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const downloadPDF = async (content) => {
  const pdfDoc = await PDFDocument.create();

  let page = pdfDoc.addPage();
  let { width, height } = page.getSize();

  const fontSize = 10;
  const margin = 40;
  const lineHeight = 12;

  const font = await pdfDoc.embedFont(StandardFonts.Courier);

  // Dividir el contenido en líneas
  const lines = content.split('\n');

  let y = height - margin;

  for (let line of lines) {
    if (y < margin) {
      // Agregar nueva página si se queda sin espacio
      page = pdfDoc.addPage();
      ({ width, height } = page.getSize());
      y = height - margin;
    }

    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();

  // Descargar el PDF
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ticket.pdf';
  a.click();
  URL.revokeObjectURL(url);
};