const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generarFacturaPDF(venta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on("error", reject);

    // ==================== CABECERA CON LOGO CENTRADO ====================
    // Ruta CORRECTA al logo (copia el logo a backend/src/assets/ para simplificar)
    // Opción recomendada: copia el logo a backend/src/assets/logo.png
    let logoPath = path.join(__dirname, "../../assets/logo_ferreteria.png");
    if (!fs.existsSync(logoPath)) {
      // Fallback: ruta original (frontend)
      logoPath = path.join(
        __dirname,
        "../../../../../frontend/ferreteriaApp/src/assets/logo/logo_ferreteria.png",
      );
    }

    const logoWidth = 70;
    const pageWidth = doc.page.width; // 595.28 pt en A4
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 40; // posición vertical (más arriba)

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoX, logoY, { width: logoWidth });
      console.log("Logo cargado correctamente");
    } else {
      console.warn(
        "Logo no encontrado en ninguna ruta. El PDF se generará sin logo.",
      );
    }

    // Título de la empresa (centrado, justo debajo del logo)
    doc
      .fontSize(20)
      .text("Ferretería July", 0, logoY + logoWidth + 10, { align: "center" });
    doc
      .fontSize(10)
      .text("RUC: 10097428951", 0, logoY + logoWidth + 35, { align: "center" });
    doc.text(
      "Av. México 118, Urb. Huaquillay, Comas",
      0,
      logoY + logoWidth + 50,
      { align: "center" },
    );
    doc.text("Teléfono: 942479469", 0, logoY + logoWidth + 65, {
      align: "center",
    });
    doc.moveDown(2);

    // ==================== DATOS DE LA VENTA ====================
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("COMPROBANTE DE VENTA", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).font("Helvetica");
    const startY = doc.y;
    doc.text(`Venta N°: ${venta.code}`, 50, startY);
    doc.text(
      `Fecha: ${new Date(venta.createdAt).toLocaleString()}`,
      50,
      startY + 15,
    );
    doc.text(`Vendedor: ${venta.seller.fullName}`, 50, startY + 30);
    doc.text(
      `Cliente: ${venta.customerName || "Consumidor Final"}`,
      50,
      startY + 45,
    );
    doc.moveDown(4);

    // ==================== TABLA DE PRODUCTOS ====================
    const tableTop = doc.y;
    const colCant = 50;
    const colProducto = 100;
    const colPrecio = 350;
    const colSubtotal = 450;

    doc.font("Helvetica-Bold");
    doc.text("Cant", colCant, tableTop);
    doc.text("Producto", colProducto, tableTop);
    doc.text("P.Unit", colPrecio, tableTop);
    doc.text("Subtotal", colSubtotal, tableTop, { width: 80, align: "right" });
    doc.font("Helvetica");

    let y = tableTop + 20;
    let subtotal = 0;
    venta.items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      doc.text(`${item.quantity}`, colCant, y);
      doc.text(item.product.name, colProducto, y, { width: 220 });
      doc.text(`S/ ${item.unitPrice.toFixed(2)}`, colPrecio, y);
      doc.text(`S/ ${lineTotal.toFixed(2)}`, colSubtotal, y, {
        align: "right",
      });
      y += 20;
    });

    // ==================== TOTALES ====================
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    const totalY = y + 20;
    doc.text(`Subtotal: S/ ${subtotal.toFixed(2)}`, colSubtotal - 100, totalY, {
      align: "right",
    });
    doc.text(
      `IGV (18%): S/ ${igv.toFixed(2)}`,
      colSubtotal - 100,
      totalY + 15,
      { align: "right" },
    );
    doc
      .font("Helvetica-Bold")
      .text(`TOTAL: S/ ${total.toFixed(2)}`, colSubtotal - 100, totalY + 30, {
        align: "right",
      });

    // ==================== PIE DE PÁGINA ====================
    doc.moveDown(4);
    doc.fontSize(9).text("¡Gracias por su compra!", { align: "center" });
    doc.text("Válido como comprobante de pago", { align: "center" });

    doc.end();
  });
}

module.exports = { generarFacturaPDF };
