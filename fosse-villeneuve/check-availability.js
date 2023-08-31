/* Run with node v18 */
/* Spécifier la date voulue en premier argument, sous la forme de
 * YEAR-MONTH-DAY, par exemple 2023-04-02
 * Le script terminera avec le status 255 s'il n'y a aucun résultat.
 *
 * S'utilise en cron de cette manière par exemple:
```
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus

0 10,13,18 * * * /<path to node>/node /<path to script>/check-availability.js -q <target date> && notify-send "Les créneaux de fosse sont ouverts !"
```
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
  console.log("check-availability.js [-q] <date>");
  console.log("  -q     Quiet: no console output");
  console.log("  date   A date in the format YYYY-MM-DD");
}

function possiblyLog(...args) {
  if (!quiet) {
    console.log(...args);
  }
}

const [, , ...args] = process.argv;
let date = null;
let quiet = null;
while (date === null) {
  const arg = args.shift();
  if (!arg) {
    break;
  }
  if (arg.startsWith("-")) {
    if (arg === "-q") {
      quiet = true;
    } else {
      console.log(`Unknown argument ${arg}`);
      printHelp();
      process.exit(1);
    }
  } else {
    date = arg;
  }
}

if (date === null) {
  console.log("Not enough arguments.");
  printHelp();
  process.exit(1);
}

const sessionId = await startSession();
const results = await fetchInformationFromAqua92WebsiteForDate(sessionId, date);
const filteredResults = filterResults(results, date);
if (filteredResults.length) {
  possiblyLog(...filteredResults);
} else {
  possiblyLog("No result");
  process.exit(255);
}
