const XLSX = require('xlsx');
const fs = require('fs');

// Read the CSV file
const csvData = fs.readFileSync('./test-details-table.csv', 'utf8');
const rows = csvData.trim().split('\n');
const data = rows.map(row => row.split(','));

// Create a new workbook
const wb = XLSX.utils.book_new();

// Create a worksheet from the data
const ws = XLSX.utils.aoa_to_sheet(data);

// Set column widths
ws['!cols'] = [
  { wch: 30 }, // תיאור הבדיקה
  { wch: 35 }, // אופן ביצוע
  { wch: 40 }, // תוצאה רצויה
  { wch: 40 }, // תוצאה מתקבלת
];

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(wb, ws, 'Test Details');

// Write the workbook to a file
XLSX.writeFile(wb, './test-details-table.xlsx');

console.log('Excel file created successfully: test-details-table.xlsx');
