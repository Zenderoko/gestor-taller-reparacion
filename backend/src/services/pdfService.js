import PDFDocument from 'pdfkit';

export function generateRepairOrderPDF(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];

  doc.on('data', (chunk) => buffers.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE REPARACIÓN', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`#${order.orderNumber}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Cliente:');
    doc.font('Helvetica').text(`${order.client.name}`);
    if (order.client.phone) doc.text(`Tel: ${order.client.phone}`);
    if (order.client.email) doc.text(`Email: ${order.client.email}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Equipo:');
    doc.font('Helvetica').text(`${order.equipment.brand} ${order.equipment.model}`);
    doc.text(`Tipo: ${order.equipment.type}`);
    if (order.equipment.serialNumber) doc.text(`Serial: ${order.equipment.serialNumber}`);
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Problema Reportado:');
    doc.font('Helvetica').text(order.reportedIssue);
    doc.moveDown();

    if (order.diagnosis) {
      doc.font('Helvetica-Bold').text('Diagnóstico:');
      doc.font('Helvetica').text(order.diagnosis);
      doc.moveDown();
    }

    doc.font('Helvetica-Bold').text('Estado:');
    doc.font('Helvetica').text(order.status);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    const fmt = (n) => `$${Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    doc.font('Helvetica-Bold').text('Costos:');
    doc.font('Helvetica').text(`Presupuesto: ${fmt(order.estimatedCost)}`);
    if (Number(order.totalCost) > 0) doc.text(`Costo final: ${fmt(order.totalCost)}`);
    if (Number(order.deposit) > 0) doc.text(`Abono: ${fmt(order.deposit)}`);
    doc.moveDown(2);

    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text(`Creado: ${new Date(order.createdAt).toLocaleString('es-CL')}`);
    doc.text(`Última actualización: ${new Date(order.updatedAt).toLocaleString('es-CL')}`);

    doc.fontSize(10).fillColor('#000');
    doc.moveDown(3);
    doc.text('Firma del cliente: __________________________', { align: 'center' });

    doc.end();
  });
}
