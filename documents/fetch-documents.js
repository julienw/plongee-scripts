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

function* extractPropertieswithUrl(participant) {
  const nom = participant.Nom;
  const prenom = participant.Prénom;

  for (const [property, value] of Object.entries(participant)) {
    const urlInformation = extractUrlFromAssoconnectField(value);
    if (urlInformation) {
      yield {
        nom,
        prenom,
        urlInformation,
        what: property,
      }
    }
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

const directoryToWrite = `export-${Date.now()}`;
const rawData = await readFile(fileToRead, { encoding: "utf-8" });

async function exportToZip() {
  const data = await convertFromAssoconnectFormat(rawData);

  const expected = data.length;
  let finished = 0;
  function notifyOne() {
    finished++;
  }

  const promises = []
  for (const participant of data) {
    for (const fetchInfo of extractPropertieswithUrl(participant)) {
      const dir = `${directoryToWrite}/${property}`;
    }
    notifyOne();
  };

  await Promise.all(promises);

}
