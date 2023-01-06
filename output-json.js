import { readFile } from "node:fs/promises";
import { convertFromAssoconnectFormat } from "./import/assoconnect.js";

const fileToRead = process.argv[2];
if (!fileToRead) {
  console.log("Please provide a file to read as the first argument");
  process.exit(-1);
}
const rawData = await readFile(fileToRead, { encoding: "utf-8" });
const data = await convertFromAssoconnectFormat(rawData);
console.log(JSON.stringify(data));
