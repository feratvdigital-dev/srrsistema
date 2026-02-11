import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder, SERVICE_TYPE_LABELS } from '@/types/serviceOrder';

export const generatePDF = (order: ServiceOrder) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(33, 150, 243);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE SERVIÇO', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Ordem de Serviço #${order.id}`, pageWidth / 2, 28, { align: 'center' });

  // Reset color
  doc.setTextColor(0, 0, 0);
  let y = 45;

  // Client Info
  autoTable(doc, {
    startY: y,
    head: [['CLIENTE', 'TELEFONE']],
    body: [[order.clientName, order.clientPhone || '-']],
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: y,
    head: [['TIPO DE SERVIÇO', 'ENDEREÇO']],
    body: [[SERVICE_TYPE_LABELS[order.serviceType], order.address]],
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: y,
    head: [['DATA DE ABERTURA', 'DATA DE CONCLUSÃO']],
    body: [[
      new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      order.closedAt ? new Date(order.closedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
    ]],
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 150, 243);
  doc.text('DESCRIÇÃO DO PROBLEMA', 14, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 7;
  const descLines = doc.splitTextToSize(order.description || '-', pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 5 + 8;

  // Service performed
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 150, 243);
  doc.text('SERVIÇO REALIZADO', 14, y);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 7;
  const obsLines = doc.splitTextToSize(order.observation || '-', pageWidth - 28);
  doc.text(obsLines, 14, y);
  y += obsLines.length * 5 + 8;

  // Photos
  if (y > 200) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 150, 243);
  doc.text('REGISTRO FOTOGRÁFICO', 14, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  const phases = [
    { key: 'before' as const, label: 'ANTES' },
    { key: 'during' as const, label: 'DURANTE' },
    { key: 'after' as const, label: 'DEPOIS' },
  ];

  const colWidth = (pageWidth - 28) / 3;
  phases.forEach((phase, i) => {
    const x = 14 + i * colWidth;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.label, x + colWidth / 2, y, { align: 'center' });

    const photos = order.photos[phase.key];
    if (photos.length > 0) {
      try {
        doc.addImage(photos[0], 'JPEG', x + 2, y + 3, colWidth - 4, 40);
      } catch {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Foto indisponível', x + colWidth / 2, y + 20, { align: 'center' });
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('-', x + colWidth / 2, y + 20, { align: 'center' });
    }
  });

  y += 55;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Costs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 150, 243);
  doc.text('CUSTOS', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    body: [
      ['Mão de Obra', `R$ ${order.laborCost.toFixed(2)}`],
      ['Materiais', `R$ ${order.materialCost.toFixed(2)}`],
      ['TOTAL', `R$ ${(order.laborCost + order.materialCost).toFixed(2)}`],
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fillColor = [33, 150, 243];
        data.cell.styles.textColor = 255;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  if (order.materialDescription) {
    y = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Materiais: ${order.materialDescription}`, 14, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.save(`Relatorio_OS_${order.id}.pdf`);
};
