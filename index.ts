import AdmZip from "adm-zip";
import { execa, execaCommand } from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
import _ from "lodash";
import path from "path";
import { URL } from "url";
import {
  getChromeProfiles,
  getChromiumExtensions,
  getEdgeProfiles,
} from "./lib/chromium.js";
import { getFirefoxExtensions, getFirefoxProfiles } from "./lib/firefox.js";
import { Browsers } from "./lib/types.js";

const getDirName = () => new URL(".", import.meta.url).pathname;

(async () => {
  const firefoxProfiles = await getFirefoxProfiles();
  const edgeProfiles = await getEdgeProfiles("Edge");
  const chromeProfiles = await getChromeProfiles("Chrome");
  const installedBrowsers = _([
    ...firefoxProfiles,
    ...edgeProfiles,
    ...chromeProfiles,
  ])
    .map(p => p.browser)
    .uniq()
    .value();

  interface Answers {
    browser: Browsers;
    extension: { name: string; value: string };
    profile: string;
  }

  const result = await inquirer
    .prompt<Answers>([
      {
        type: "list",
        name: "browser",
        message: "Choose a browser",
        choices: installedBrowsers,
      },
      {
        type: "list",
        name: "profile",
        message: (answers: Answers) => `Choose your ${answers.browser} profile`,
        choices: (answers: Answers) => {
          switch (answers.browser) {
            case Browsers.CHROME:
              return chromeProfiles;
            case Browsers.FIREFOX:
              return firefoxProfiles;
            case Browsers.EDGE:
              return edgeProfiles;
          }
        },
      },
      {
        type: "list",
        name: "extension",
        message: `Choose what extension to convert`,
        choices: (answers: Answers) => {
          switch (answers.browser) {
            case Browsers.FIREFOX:
              return getFirefoxExtensions(answers.profile);
            case Browsers.CHROME:
            case Browsers.EDGE:
              return getChromiumExtensions(answers.profile);
          }
        },
      },
    ])
    .then(answers => {
      return answers;
    });

  const { extension, browser } = result;

  if (browser === Browsers.FIREFOX) {
    console.log(`Extracting ${extension.name} to the current folder...`);
    const zip = new AdmZip(extension.value);
    zip.extractAllTo(
      getDirName() + "/safarify/extensions/" + extension.name,
      true
    );
  } else {
    console.log(`Copying ${extension.name} to the current folder...`);
    await fs.copy(
      extension.value,
      path.resolve(getDirName(), "safarify/", "extensions/", extension.name)
    );
  }

  console.log("Converting to a Safari extension project...");
  const finalPath = path.resolve(
    getDirName(),
    "safarify",
    "extensions",
    extension.name
  );
  const convert = execaCommand(
    `xcrun safari-web-extension-converter --project-location safarify --copy-resources --no-open --force --macos-only "${finalPath}"`,
    { shell: true }
  );
  convert.stdout?.pipe(process.stdout);
  convert.stderr?.pipe(process.stdout);
})();
