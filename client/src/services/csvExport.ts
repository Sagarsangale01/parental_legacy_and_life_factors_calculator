import { CalculationResult } from '../types';

export function exportToCSV(calculation: CalculationResult): void {
  const rows: string[] = [];

  rows.push('PARENTAL LEGACY & LIFE FACTORS CALCULATOR');
  rows.push(`Date of Birth: ${calculation.dob},Primary Lineage: ${calculation.dominantParent}`);
  rows.push(`Calculated At: ${new Date(calculation.calculatedAt).toLocaleString()}`);
  rows.push('');
  rows.push('LIFE FACTORS,MOTHER,FATHER,TOTAL,Minimum,Maximum,Dominant Contributor');

  for (const f of calculation.factors) {
    rows.push(
      `"${f.factorName}",${f.motherValue.toFixed(3)},${f.fatherValue.toFixed(3)},${f.totalValue.toFixed(3)},${f.min.toFixed(3)},${f.max.toFixed(3)},${f.higherParent}`
    );
  }

  rows.push(
    `TOTAL,${calculation.motherTotal.toFixed(3)},${calculation.fatherTotal.toFixed(3)},${calculation.grandTotal.toFixed(3)},47.121,54.230,${calculation.dominantParent}`
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `Parental_Legacy_${calculation.dob}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
