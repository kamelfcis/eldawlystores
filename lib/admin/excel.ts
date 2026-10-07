import ExcelJS from "exceljs";

function excelCell(value: string | number): string | number {
  if (typeof value === "number") return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export async function buildXlsx(
  sheetName: string,
  headers: string[],
  rows: Array<Array<string | number>>
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.views = [{ rightToLeft: true }];
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row.map((cell) => excelCell(cell)));
  }
  sheet.getRow(1).font = { bold: true };
  const raw = await workbook.xlsx.writeBuffer();
  return Uint8Array.from(raw as unknown as ArrayLike<number>);
}
