import { parseStringPromise as parseString } from "xml2js";

export async function convertFromAssoconnectFormat(input) {
  const json = await parseString(input);
  const rows = json.Workbook.Worksheet[0].Table[0].Row.map((row) => {
    return row.Cell.map((cellData) => cellData.Data[0]._);
  });

  const header = rows[0];
  const values = rows.slice(1);
  const result = values.map((valueList) =>
    Object.fromEntries(valueList.map((value, i) => [header[i], value]))
  );

  return result;
}
