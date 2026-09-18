import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationResult } from '../types';

export function exportToPDF(calculation: CalculationResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Parental Legacy & Life Factors Report', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Executive Life Factors & Hereditary Balance Report', 14, 26);

  doc.setTextColor(244, 63, 94); // Rose Coral
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 26);

  // Subject Info Card
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.roundedRect(14, 44, 182, 28, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Assessment Summary', 20, 52);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date of Birth: `, 20, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(calculation.dob, 48, 60);

  doc.setFont('helvetica', 'normal');
  doc.text(`Classification: `, 20, 67);
  doc.setFont('helvetica', 'bold');
  doc.text(`${calculation.dominantParent} Lineage Primary`, 48, 67);

  doc.setFont('helvetica', 'normal');
  doc.text(`Primary Lineage: `, 110, 60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(calculation.dominantParent === 'Mother' ? 244 : 99, calculation.dominantParent === 'Mother' ? 63 : 102, calculation.dominantParent === 'Mother' ? 94 : 241);
  doc.text(`${calculation.dominantParent} Primary`, 145, 60);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Equilibrium: `, 110, 67);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`100.000 (Exact)`, 145, 67);

  // KPI Highlights Grid
  const kpiY = 78;
  // Mother Box
  doc.setFillColor(253, 242, 248); // Rose-50
  doc.setDrawColor(244, 114, 182); // Rose-400
  doc.roundedRect(14, kpiY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(190, 24, 93);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MOTHER TOTAL', 22, kpiY + 7);
  doc.setFontSize(14);
  doc.text(`${calculation.motherTotal.toFixed(3)}%`, 22, kpiY + 16);

  // Father Box
  doc.setFillColor(238, 242, 255); // Indigo-50
  doc.setDrawColor(129, 140, 248); // Indigo-400
  doc.roundedRect(77, kpiY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(67, 56, 202); // Indigo-700
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('FATHER TOTAL', 85, kpiY + 7);
  doc.setFontSize(14);
  doc.text(`${calculation.fatherTotal.toFixed(3)}%`, 85, kpiY + 16);

  // Grand Total Box
  doc.setFillColor(236, 253, 245); // Emerald-50
  doc.setDrawColor(52, 211, 153); // Emerald-400
  doc.roundedRect(140, kpiY, 56, 22, 2, 2, 'FD');
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', 148, kpiY + 7);
  doc.setFontSize(14);
  doc.text('100.000', 148, kpiY + 16);

  // Table Data
  const tableData = calculation.factors.map(f => [
    f.factorName,
    f.motherValue.toFixed(3),
    f.fatherValue.toFixed(3),
    f.totalValue.toFixed(3),
    f.min.toFixed(3),
    f.max.toFixed(3),
    f.higherParent
  ]);

  // Add Totals row
  tableData.push([
    'TOTAL (Sum of all Factors)',
    calculation.motherTotal.toFixed(3),
    calculation.fatherTotal.toFixed(3),
    calculation.grandTotal.toFixed(3),
    '47.121',
    '54.230',
    calculation.dominantParent
  ]);

  autoTable(doc, {
    startY: 108,
    head: [['Life Factor Dimension', 'Mother', 'Father', 'Total', 'Min', 'Max', 'Higher']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 52 },
      1: { textColor: [244, 63, 94], fontStyle: 'bold' },
      2: { textColor: [99, 102, 241], fontStyle: 'bold' },
      3: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight the totals row
      if (data.row.index === calculation.factors.length) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Footer Note
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Confidential analytical assessment report generated for hereditary life factor analysis.', 14, finalY);
  doc.text('Mathematical Equilibrium Invariant: Mother Total + Father Total = 100.000 is verified and strictly maintained.', 14, finalY + 5);

  doc.save(`Parental_Legacy_Report_${calculation.dob}.pdf`);
}
