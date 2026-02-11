import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder, SERVICE_TYPE_LABELS } from '@/types/serviceOrder';
import logoSrc from '@/assets/logo.png';

// Dark navy header color matching dashboard: hsl(215, 40%, 16%) ≈ rgb(25, 31, 57)
const HEADER_R = 25;
const HEADER_G = 31;
const HEADER_B = 57;

// Primary blue for table headers
const PRIMARY_R = 33;
const PRIMARY_G = 100;
const PRIMARY_B = 180;

export const generatePDF = (order: ServiceOrder) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - dark navy like dashboard
  doc.setFillColor(HEADER_R, HEADER_G, HEADER_B);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Add logo to header
  try {
    doc.addImage(logoSrc, 'PNG', 14, 5, 30, 30);
  } catch {
    // logo unavailable
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE SERVIÇO', pageWidth / 2 + 10, 18, { align: 'center' });
  doc.setFontSize(13);
  doc.text(`Ordem de Serviço #${order.id}`, pageWidth / 2 + 10, 30, { align: 'center' });

  // Reset color
  doc.setTextColor(0, 0, 0);
  let y = 50;

  // Client Info
  autoTable(doc, {
    startY: y,
    head: [['CLIENTE', 'TELEFONE']],
    body: [[order.clientName, order.clientPhone || '-']],
    theme: 'grid',
    headStyles: { fillColor: [HEADER_R, HEADER_G, HEADER_B], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: y,
    head: [['TIPO DE SERVIÇO', 'ENDEREÇO']],
    body: [[SERVICE_TYPE_LABELS[order.serviceType], order.address]],
    theme: 'grid',
    headStyles: { fillColor: [HEADER_R, HEADER_G, HEADER_B], textColor: 255, fontStyle: 'bold' },
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
    headStyles: { fillColor: [HEADER_R, HEADER_G, HEADER_B], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(HEADER_R, HEADER_G, HEADER_B);
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
  doc.setTextColor(HEADER_R, HEADER_G, HEADER_B);
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
  doc.setTextColor(HEADER_R, HEADER_G, HEADER_B);
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
      // Show up to 2 photos per phase
      photos.slice(0, 2).forEach((photo, pIdx) => {
        try {
          const photoY = y + 3 + pIdx * 35;
          doc.addImage(photo, 'JPEG', x + 2, photoY, colWidth - 4, 32);
        } catch {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text('Foto indisponível', x + colWidth / 2, y + 20 + pIdx * 35, { align: 'center' });
        }
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('-', x + colWidth / 2, y + 20, { align: 'center' });
    }
  });

  y += 75;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Costs
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(HEADER_R, HEADER_G, HEADER_B);
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
        data.cell.styles.fillColor = [HEADER_R, HEADER_G, HEADER_B];
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

  // Warranty
  y = (doc as any).lastAutoTable.finalY + 15;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(HEADER_R, HEADER_G, HEADER_B);
  doc.roundedRect(14, y, pageWidth - 28, 18, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('⚡ GARANTIA DE 90 DIAS', pageWidth / 2, y + 7, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este serviço possui garantia de 90 dias a partir da data de conclusão.', pageWidth / 2, y + 14, { align: 'center' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2,
    footerY - 5,
    { align: 'center' }
  );
  doc.text('© 2026 IT Digital. Todos os direitos reservados.', pageWidth / 2, footerY, { align: 'center' });

  doc.save(`Relatorio_OS_${order.id}.pdf`);
};
