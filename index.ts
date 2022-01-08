import AdmZip from "adm-zip";
import fs from "fs-extra";
import inquirer from "inquirer";
import _ from "lodash";
import path from "path";
import {
  getChromeProfiles,
  getChromiumExtensions,
  getEdgeProfiles,
} from "./lib/chromium";
import { getFirefoxExtensions, getFirefoxProfiles } from "./lib/firefox";
import { Browsers } from "./lib/types";

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

  const result = await inquirer
    .prompt([
      {
        type: "list",
        name: "browser",
        message: "Choose a browser",
        choices: installedBrowsers,
      },
      {
        type: "list",
        name: "profile",
        message: answers => `Choose your ${answers.browser} profile`,
        choices: answers => {
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
        choices: answers => {
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
    zip.extractAllTo(__dirname + "/safarify/" + extension.name, true);
  } else {
    console.log(`Copying ${extension.name} to the current folder...`);
    await fs.copy(
      extension.value,
      path.resolve(__dirname, "safarify", extension.name)
    );
  }

  console.log("Converting to a Safari extension project...");
})();
