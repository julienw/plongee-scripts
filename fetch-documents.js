import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { convertFromAssoconnectFormat } from "./import/assoconnect.js";

function extractUrlFromAssoconnectField(input) {
  const startUrl = input.lastIndexOf("https:");
  if (startUrl < 0) {
    return null;
  }

  const startType = input.lastIndexOf(".", startUrl);
  if (startType < 0) {
    return null;
  }
  const endType = input.indexOf(" ", startType);
  if (endType < 0) {
    return null;
  }
  const type = input.slice(startType + 1, endType);

  return {
    type,
    url: input.slice(startUrl).replaceAll("&amp;", "&"),
  };
}

async function fetchAndSave({ nom, prenom, urlInformation, dir, what }) {
  const filename = path.join(dir, `${nom}-${prenom}.${urlInformation.type}`);
  const response = await fetch(urlInformation.url);
  if (!response.ok) {
    console.error(
      `Couldn't download ${what} for ${nom} ${prenom}: (${response.status}) ${response.statusText}`
    );
    console.error(urlInformation.url);
  } else {
    const buffer = await response.arrayBuffer();
    await writeFile(filename, new DataView(buffer));
    console.log(`${what} for ${nom} ${prenom} saved in ${filename}`);
  }
}

async function extractPropertieswithUrl(participant) {
  const nom = participant.Nom;
  const prenom = participant.Prénom;

  for (const [property, value] of Object.entries(participant)) {
    const urlInformation = extractUrlFromAssoconnectField(value);
    if (urlInformation) {
      const dir = path.join(directoryToWrite, property);
      await mkdir(dir, { recursive: true });
      await fetchAndSave({
        dir,
        nom,
        prenom,
        urlInformation,
        what: property,
      });
    }
  }
}

function printUsage() {
  console.log(`${process.argv[1]} <file to read> <output directory>`);
  console.log("\nThis script will fetch the documents present in the export.");
}

const nodeVersion = process.versions.node;
const nodeVersionMajor = nodeVersion.slice(0, nodeVersion.indexOf("."));
if (nodeVersionMajor < 18) {
  console.error(
    `This script needs node v18. Your current version is ${nodeVersion}.`
  );
  printUsage();
  process.exit(-1);
}

const fileToRead = process.argv[2];
if (!fileToRead) {
  console.error("Please provide a file to read as the first argument");
  printUsage();
  process.exit(-1);
}

if (fileToRead === "-h" || fileToRead === "--help") {
  printUsage();
  process.exit(0);
}

if (fileToRead.startsWith("-")) {
  console.error("No option is accepted besides -h or --help");
  printUsage();
  process.exit(-1);
}

const directoryToWrite = process.argv[3];
if (!directoryToWrite) {
  console.error("Please provide a directory name to write to");
  printUsage();
  process.exit(-1);
}

const rawData = await readFile(fileToRead, { encoding: "utf-8" });
const data = await convertFromAssoconnectFormat(rawData);

const promises = data.map(async (participant) => {
  await extractPropertieswithUrl(participant);
});

await Promise.all(promises);
