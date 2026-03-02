import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceOrder, SERVICE_TYPE_LABELS } from '@/types/serviceOrder';
import logoSrc from '@/assets/logo.png';

// Premium color palette
const NAVY = { r: 15, g: 23, b: 42 };       // Dark navy
const ACCENT = { r: 59, g: 130, b: 246 };    // Blue accent
const ACCENT_DARK = { r: 30, g: 64, b: 175 }; // Darker blue
const LIGHT_BG = { r: 241, g: 245, b: 249 }; // Slate-100
const SUCCESS = { r: 22, g: 163, b: 74 };     // Green
const MUTED = { r: 100, g: 116, b: 139 };     // Slate-500

const fmt = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const drawRoundedRect = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, color: { r: number; g: number; b: number }) => {
  doc.setFillColor(color.r, color.g, color.b);
  doc.roundedRect(x, y, w, h, r, r, 'F');
};

const drawSectionTitle = (doc: jsPDF, title: string, x: number, y: number, icon?: string) => {
  // Accent line
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(x, y, 3, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  doc.text(title, x + 7, y + 6);
  return y + 14;
};

const drawInfoBox = (doc: jsPDF, label: string, value: string, x: number, y: number, w: number) => {
  drawRoundedRect(doc, x, y, w, 20, 2, LIGHT_BG);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(label.toUpperCase(), x + 5, y + 7);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(NAVY.r, NAVY.g, NAVY.b);
  const lines = doc.splitTextToSize(value || '-', w - 10);
  doc.text(lines[0], x + 5, y + 15);
};

const checkPageBreak = (doc: jsPDF, y: number, needed: number): number => {
  if (y + needed > doc.internal.pageSize.getHeight() - 25) {
    doc.addPage();
    return 20;
  }
  return y;
};

export const generatePDF = (order: ServiceOrder) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pw - margin * 2;

  // ═══════════════════════════════════════════════
  // HEADER - Premium gradient style
  // ═══════════════════════════════════════════════
  doc.setFillColor(NAVY.r, NAVY.g, NAVY.b);
  doc.rect(0, 0, pw, 48, 'F');
  
  // Accent stripe at bottom of header
  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.rect(0, 46, pw, 2, 'F');

  // Logo
  try {
    doc.addImage(logoSrc, 'PNG', margin, 7, 32, 32);
  } catch { /* fallback */ }

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE SERVIÇO', pw - margin, 20, { align: 'right' });
  
  // OS number badge
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.text(`OS #${order.id}`, pw - margin, 30, { align: 'right' });

  // Date under header
  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(`${SERVICE_TYPE_LABELS[order.serviceType]}`, pw - margin, 38, { align: 'right' });

  let y = 58;

  // ═══════════════════════════════════════════════
  // CLIENT INFO - Modern card grid
  // ═══════════════════════════════════════════════
  y = drawSectionTitle(doc, 'INFORMAÇÕES DO CLIENTE', margin, y);
  
  const halfW = (contentW - 5) / 2;
  drawInfoBox(doc, 'Cliente', order.clientName, margin, y, halfW);
  drawInfoBox(doc, 'Telefone', order.clientPhone || '-', margin + halfW + 5, y, halfW);
  y += 25;

  if (order.clientEmail) {
    drawInfoBox(doc, 'E-mail', order.clientEmail, margin, y, contentW);
    y += 25;
  }

  drawInfoBox(doc, 'Endereço', order.address, margin, y, contentW);
  y += 28;

  // ═══════════════════════════════════════════════
  // SERVICE DETAILS
  // ═══════════════════════════════════════════════
  y = drawSectionTitle(doc, 'DETALHES DO SERVIÇO', margin, y);

  drawInfoBox(doc, 'Tipo de Serviço', SERVICE_TYPE_LABELS[order.serviceType], margin, y, halfW);
  drawInfoBox(doc, 'Técnico', order.assignedTechnician || '-', margin + halfW + 5, y, halfW);
  y += 25;

  drawInfoBox(doc, 'Abertura', fmtDate(order.createdAt), margin, y, halfW);
  drawInfoBox(doc, 'Conclusão', order.closedAt ? fmtDate(order.closedAt) : '-', margin + halfW + 5, y, halfW);
  y += 28;

  // ═══════════════════════════════════════════════
  // DESCRIPTION & OBSERVATION
  // ═══════════════════════════════════════════════
  y = checkPageBreak(doc, y, 50);
  y = drawSectionTitle(doc, 'DESCRIÇÃO DO PROBLEMA', margin, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(order.description || '-', contentW - 4);
  drawRoundedRect(doc, margin, y - 2, contentW, descLines.length * 5 + 10, 2, LIGHT_BG);
  doc.text(descLines, margin + 5, y + 5);
  y += descLines.length * 5 + 15;

  y = checkPageBreak(doc, y, 50);
  y = drawSectionTitle(doc, 'SERVIÇO REALIZADO', margin, y);

  const obsLines = doc.splitTextToSize(order.observation || '-', contentW - 4);
  drawRoundedRect(doc, margin, y - 2, contentW, obsLines.length * 5 + 10, 2, LIGHT_BG);
  doc.setTextColor(51, 65, 85);
  doc.text(obsLines, margin + 5, y + 5);
  y += obsLines.length * 5 + 18;

  // ═══════════════════════════════════════════════
  // PHOTOS - Modern grid
  // ═══════════════════════════════════════════════
  y = checkPageBreak(doc, y, 90);
  y = drawSectionTitle(doc, 'REGISTRO FOTOGRÁFICO', margin, y);

  const phases = [
    { key: 'before' as const, label: 'ANTES', color: { r: 245, g: 158, b: 11 } },
    { key: 'during' as const, label: 'DURANTE', color: ACCENT },
    { key: 'after' as const, label: 'DEPOIS', color: SUCCESS },
  ];

  const colW = (contentW - 10) / 3;
  phases.forEach((phase, i) => {
    const x = margin + i * (colW + 5);
    
    // Phase label badge
    doc.setFillColor(phase.color.r, phase.color.g, phase.color.b);
    doc.roundedRect(x, y, colW, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(phase.label, x + colW / 2, y + 5.5, { align: 'center' });

    const photos = order.photos[phase.key];
    if (photos.length > 0) {
      photos.slice(0, 2).forEach((photo, pIdx) => {
        try {
          const photoY = y + 10 + pIdx * 34;
          // Photo frame
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.roundedRect(x, photoY, colW, 32, 2, 2, 'S');
          doc.addImage(photo, 'JPEG', x + 1, photoY + 1, colW - 2, 30);
        } catch {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
          doc.text('Foto indisponível', x + colW / 2, y + 28 + pIdx * 34, { align: 'center' });
        }
      });
    } else {
      drawRoundedRect(doc, x, y + 10, colW, 32, 2, LIGHT_BG);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text('Sem fotos', x + colW / 2, y + 28, { align: 'center' });
    }
  });

  y += 80;

  // ═══════════════════════════════════════════════
  // COSTS - Premium table
  // ═══════════════════════════════════════════════
  y = checkPageBreak(doc, y, 70);
  y = drawSectionTitle(doc, 'CUSTOS DO SERVIÇO', margin, y);

  const total = order.laborCost + order.materialCost;

  autoTable(doc, {
    startY: y,
    head: [['Descrição', 'Valor']],
    body: [
      ['Mão de Obra', fmt(order.laborCost)],
      ['Materiais', fmt(order.materialCost)],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b],
      textColor: [MUTED.r, MUTED.g, MUTED.b],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [NAVY.r, NAVY.g, NAVY.b],
    },
    columnStyles: {
      0: { cellWidth: contentW * 0.65 },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
    styles: { cellPadding: 5 },
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // Total highlight bar
  drawRoundedRect(doc, margin, y, contentW, 16, 3, NAVY);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 8, y + 11);
  doc.setFontSize(14);
  doc.text(fmt(total), pw - margin - 8, y + 11, { align: 'right' });
  y += 22;

  // Materials description
  if (order.materialDescription) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(`Materiais utilizados: ${order.materialDescription}`, margin, y);
    y += 10;
  }

  // ═══════════════════════════════════════════════
  // WARRANTY - Premium badge
  // ═══════════════════════════════════════════════
  y = checkPageBreak(doc, y, 30);
  y += 5;

  // Warranty card with icon feel
  doc.setFillColor(SUCCESS.r, SUCCESS.g, SUCCESS.b);
  doc.roundedRect(margin, y, 4, 18, 2, 2, 'F');
  drawRoundedRect(doc, margin + 4, y, contentW - 4, 18, 2, { r: 240, g: 253, b: 244 });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(SUCCESS.r, SUCCESS.g, SUCCESS.b);
  doc.text('GARANTIA', margin + 10, y + 7);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Este serviço possui garantia de 90 dias a partir da data de conclusão.', margin + 10, y + 14);

  // ═══════════════════════════════════════════════
  // FOOTER - Clean & minimal
  // ═══════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, ph - 18, pw - margin, ph - 18);
    
    doc.setFontSize(7);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      margin,
      ph - 12
    );
    doc.text(`Página ${i} de ${totalPages}`, pw / 2, ph - 12, { align: 'center' });
    doc.text('© 2026 IT Digital', pw - margin, ph - 12, { align: 'right' });
  }

  doc.save(`Relatorio_OS_${order.id}.pdf`);
};
