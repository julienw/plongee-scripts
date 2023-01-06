import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { convertFromAssoconnectFormat } from "./import/assoconnect.js";

function extractUrlFromAssoconnectField(input) {
  const startUrl = input.lastIndexOf(" - ");
  if (startUrl < 0) {
    return null;
  }

  const startType = input.lastIndexOf(".", startUrl);
  const type = startType < 0 ? "xxx" : input.slice(startType + 1, startUrl);

  return {
    type,
    url: input.slice(startUrl + 3).replaceAll("&amp;", "&"),
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

const fileToRead = process.argv[2];
if (!fileToRead) {
  console.error("Please provide a file to read as the first argument");
  process.exit(-1);
}

const directoryToWrite = process.argv[3];
if (!directoryToWrite) {
  console.error("Please provide a directory name to write to");
  process.exit(-1);
}

const caciDir = path.join(directoryToWrite, "caci");
const diplomeDir = path.join(directoryToWrite, "diplome");
await mkdir(caciDir, { recursive: true });
await mkdir(diplomeDir, { recursive: true });

const rawData = await readFile(fileToRead, { encoding: "utf-8" });
const data = await convertFromAssoconnectFormat(rawData);

const promises = data.map(async (participant) => {
  const nom = participant.Nom;
  const prenom = participant.Prénom;
  const caciInformation = participant["CACI 2022-2023"];
  const diplomeInformation = participant["Scan des diplômes 2022-2023"];

  const caciUrl = extractUrlFromAssoconnectField(caciInformation);
  const diplomeUrl = extractUrlFromAssoconnectField(diplomeInformation);

  if (caciUrl) {
    await fetchAndSave({
      dir: caciDir,
      nom,
      prenom,
      urlInformation: caciUrl,
      what: "CACI",
    });
  }
  if (diplomeUrl) {
    await fetchAndSave({
      dir: diplomeDir,
      nom,
      prenom,
      urlInformation: diplomeUrl,
      what: "diplome",
    });
  }
});

await Promise.all(promises);
