import xlsx from "node-xlsx";

export function readCsvFile(filepath) {
  const parsedData = xlsx.parse(filepath);
  console.log(
    parsedData[0].data.forEach((row) => {
      if (row.length === 0) {
        return;
      }
      console.table(row);
    })
  );
}
