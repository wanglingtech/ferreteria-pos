import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  constructor() {}

  /**
   * Genera un PDF profesional con QR a partir de un elemento HTML
   * @param elementId ID del elemento HTML que contiene el diseño del ticket (oculto)
   * @param fileName Nombre del archivo PDF a descargar
   * @param qrData Datos para el QR (opcional). Si se provee, se añade al PDF.
   */
  async generateTicketPdf(
    elementId: string,
    fileName: string = 'ticket-venta.pdf',
    qrData?: string,
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`No se encontró el elemento con ID: ${elementId}`);
      return;
    }

    // Clonar el elemento para no afectar la vista oculta
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    try {
      // Si hay datos para QR, añadimos una imagen QR al clon
      if (qrData) {
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrData, { width: 150, margin: 2 });
        const qrImg = document.createElement('img');
        qrImg.src = qrCanvas.toDataURL();
        qrImg.style.width = '100px';
        qrImg.style.marginTop = '10px';
        qrImg.style.display = 'block';
        qrImg.style.marginLeft = 'auto';
        qrImg.style.marginRight = 'auto';
        // Insertar QR al final del contenido (ajusta según tu diseño)
        clone.appendChild(qrImg);
      }

      const canvas = await html2canvas(clone, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      const imgData = canvas.toDataURL('image/png');

      // Formato ticket (80mm de ancho)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      document.body.removeChild(clone);
    }
  }

  /**
   * Genera factura tamaño A4 con QR
   */
  async generateFacturaPdf(
    elementId: string,
    fileName: string = 'factura.pdf',
    qrData?: string,
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) return;

    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);

    try {
      if (qrData) {
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, qrData, { width: 200, margin: 2 });
        const qrImg = document.createElement('img');
        qrImg.src = qrCanvas.toDataURL();
        qrImg.style.width = '120px';
        qrImg.style.marginTop = '15px';
        qrImg.style.display = 'block';
        qrImg.style.marginLeft = 'auto';
        clone.appendChild(qrImg);
      }

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar factura:', error);
    } finally {
      document.body.removeChild(clone);
    }
  }

  // Dentro de la clase PdfGeneratorService, agrega:

  /**
   * Genera un PDF directamente desde un elemento HTML (no por ID)
   */
  async generatePdfFromElement(
    element: HTMLElement,
    fileName: string = 'documento.pdf',
  ): Promise<void> {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.display = 'block';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '-9999px';
    document.body.appendChild(clone);
    try {
      const canvas = await html2canvas(clone, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error('Error al generar PDF desde elemento:', error);
      throw error;
    } finally {
      document.body.removeChild(clone);
    }
  }
}
