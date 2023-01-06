import { execFileSync } from "child_process";
import { readdirSync, mkdirSync, openSync, closeSync } from "fs";
import path from "path";

const groups = ["PN1", "PN2", "PN3", "NAGE", "APNEE"];
const groupIds = {
  PN1: 5,
  PN2: 6,
  PN3: 7,
  APNEE: 11,
  NAGE: 16,
};

const baseOutputDir = "output";
const { outputDir, previousOutputDir } = findOutputDir();
const inputFile = process.argv[2];
if (!inputFile) {
  throw new Error("Please give the name of an input file.");
}
const fixedInputFile = path.join(outputDir, "liste-membres.xml");

function findOutputDir() {
  mkdirSync(baseOutputDir, { recursive: true });
  const existingDirs = readdirSync(baseOutputDir);
  const dirsWithNumbers = existingDirs
    .filter(
      // Keep only directories with numbers
      (dir) => !/[^\d]/.test(dir)
    )
    .map((dir) => +dir);
  const maxValue = dirsWithNumbers.length ? Math.max(...dirsWithNumbers) : 0;
  const oldOutput =
    maxValue > 0 ? path.join(baseOutputDir, String(maxValue)) : null;
  const newOutput = path.join(baseOutputDir, String(maxValue + 1));
  mkdirSync(newOutput);
  return { outputDir: newOutput, previousOutputDir: oldOutput };
}

function fixInputFile() {
  execFileSync("ftfy", ["-e", "latin-1", "-o", fixedInputFile, inputFile]);
}

console.log(">>>>> Tout va être écrit dans:", outputDir);
fixInputFile();
for (const group of groups) {
  const groupId = groupIds[group];
  const filter = `.users.user[] | select(.statut == "2" and (.groupes.groupe | [(.["@id"]? // .[]["@id"])] | index("${groupId}"))) | [.nom, .prenom, .email, (.mobile // .fixe)] | @csv`;
  const inputFd = openSync(fixedInputFile);
  const outputFd = openSync(path.join(outputDir, `group-${group}.csv`), "w");
  execFileSync("xq", ["-r", filter], {
    stdio: [inputFd, outputFd, process.stderr],
  });
  closeSync(inputFd);
  closeSync(outputFd);
}
