/* Run with node v18 */
/* Spécifier la date voulue en premier argument, sous la forme de
 * YEAR-MONTH-DAY, par exemple 2023-04-02
 * Le script terminera avec le status 255 s'il n'y a aucun résultat.
 */

async function startSession() {
  const response = await fetch(
    "https://aqua92.extraclub.fr/fo/prive/menu/reserver_site/index"
  );
  if (!response.ok) {
    throw new Error(
      `L'appel pour démarrer la session a échoué: (${response.status} ${response.statusText})`
    );
  }

  const cookie = response.headers.get("Set-Cookie");
  if (!cookie) {
    throw new Error(
      `Couldn't find the header "Set-Cookie". Headers are ${[
        ...response.headers,
      ].toString()}`
    );
  }
  const matchResult = /\bPHPSESSID=(\w+);/.exec(cookie);
  if (!matchResult) {
    throw new Error(
      `Couldn't find the pho session if in the cookie header ${cookie}`
    );
  }
  const [, phpSessionId] = matchResult;
  return phpSessionId;
}

async function fetchInformationFromAqua92WebsiteForDate(sessionId, date) {
  const urlParams = new URLSearchParams({
    inc: "ajax/reservation/planning2",
    displayDirection: "coursCollectif",
    date,
  });
  const response = await fetch(
    `https://aqua92.extraclub.fr/includer.php?${urlParams}`,
    {
      headers: { Cookie: `PHPSESSID=${sessionId}` },
    }
  );
  if (!response.ok) {
    throw new Error(
      `L'appel pour récupérer les infos a échoué: (${response.status} ${response.statusText})`
    );
  }

  const json = await response.json();
  return json.ressource[0].typeResa[24].access.map(({ from, to }) => ({
    from: new Date(from),
    to: new Date(to),
  }));
}

function filterResults(results, date) {
  return results.filter(({ from }) => from.toISOString().startsWith(date));
}

function printHelp() {
  console.log("check-availability.js <date>");
}

if (process.argv.length <= 2) {
  console.log("Not enough arguments.");
  printHelp();
  process.exit(1);
}

const date = process.argv[2];
const sessionId = await startSession();
const results = await fetchInformationFromAqua92WebsiteForDate(sessionId, date);
const filteredResults = filterResults(results, date);
if (filteredResults.length) {
  console.log(...filteredResults);
} else {
  console.log("No result");
  process.exit(255);
}
