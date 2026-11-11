import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Match } from '../types/fixture';
import { SOMISA_CREST_URL } from './assets';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function exportOfficialSheetPdf(
  matches: Match[],
  title = 'CLUB SOMISA - PLANILLA OFICIAL DE PARTIDOS'
): Promise<void> {
  // Use landscape orientation for clear multi-column view
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Top header banner in SOMISA Royal Navy Blue
  doc.setFillColor(30, 64, 175); // Royal Navy Blue (#1e40af)
  doc.rect(14, 10, 269, 18, 'F');

  // Load and embed the official Club SOMISA crest
  try {
    const crest = await loadImage(SOMISA_CREST_URL);
    if (crest) {
      doc.addImage(crest, 'PNG', 16, 11, 16, 16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 35, 20);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title, 18, 20);
    }
  } catch (e) {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 18, 20);
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const now = new Date();
  const fechaEmision = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  doc.text(`Emitido: ${fechaEmision} | SOMISA Básquetbol Formativas y Mini`, 195, 20);

  // Sub-bar
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.text(
    `Total de partidos: ${matches.length} | Club SOMISA (A y B) - Sede San Nicolás de los Arroyos`,
    14,
    33
  );

  // Prepare table headers and rows exactly matching the tournament spreadsheet
  const headers = [
    ['CATEGORIA', 'RAMA (F/M)', 'LOCAL', 'VISITANTE', 'FECHA', 'HORA', 'OBSERV. CANCHA', 'OBSERVACIONES'],
  ];

  const bodyData = matches.map((m) => [
    m.categoria,
    m.rama,
    m.local,
    m.visitante,
    m.fecha || '-',
    m.hora || '-',
    m.observCancha || '',
    m.observaciones || '',
  ]);

  autoTable(doc, {
    head: headers,
    body: bodyData,
    startY: 36,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // Deep blue as in user screenshot
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
      cellPadding: 2.2,
      lineWidth: 0.2,
      lineColor: [203, 213, 225],
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineWidth: 0.2,
      lineColor: [226, 232, 240],
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' }, // Categoria
      1: { cellWidth: 24, halign: 'center' }, // Rama
      2: { cellWidth: 38 }, // Local
      3: { cellWidth: 38 }, // Visitante
      4: { cellWidth: 26, halign: 'center' }, // Fecha
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, // Hora
      6: { cellWidth: 34, halign: 'center' }, // Observ cancha
      7: { cellWidth: 57 }, // Observaciones
    },
    didParseCell: (data) => {
      // Highlight conditional rows in light yellow (same as user sheet: "J3 Si es necesario")
      const rowIndex = data.row.index;
      const match = matches[rowIndex];
      if (data.section === 'body' && match) {
        if (match.esCondicional || match.observaciones.toLowerCase().includes('necesario')) {
          data.cell.styles.fillColor = [254, 240, 138]; // Yellow-200
        }

        // Highlight red text for observations and court notices (Gim 2, Promo, Finales)
        if (data.column.index === 6 && match.observCancha) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index === 7 && match.observaciones) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    foot: [
      [
        'OBSERVACIÓN:',
        '',
        'Club SOMISA: Av. Central y Calle 27, San Nicolás',
        '',
        'Asociación de Básquetbol',
        '',
        'Canchas: Gimnasio Principal / Gim 2',
        'Validez sujeta a confirmación reglamentaria',
      ],
    ],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [100, 116, 139],
      fontSize: 7,
      fontStyle: 'italic',
    },
  });

  // Footer notes at bottom of page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} | Club SOMISA Básquet - Planilla Oficial de Coordinación`,
      14,
      202
    );
  }

  doc.save('SOMISA_Planilla_Oficial_Basquet.pdf');
}
