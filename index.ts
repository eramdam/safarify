import inquirer from "inquirer";
import _ from "lodash";
import {
  getChromeProfiles,
  getChromiumExtensions,
  getEdgeProfiles
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
    ...chromeProfiles
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
        choices: installedBrowsers
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
        }
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
        }
      }
    ])
    .then(answers => {
      return answers;
    });

  console.log({ result });
})();
