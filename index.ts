#!/usr/bin/env node
import AdmZip from "adm-zip";
import clipboard from "clipboardy";
import { execaCommand } from "execa";
import fs from "fs-extra";
import inquirer from "inquirer";
// @ts-expect-error
import inquirerSearch from "inquirer-search-list";
import _ from "lodash";
import path from "path";
import {
  getChromeProfiles,
  getChromiumExtensions,
  getEdgeProfiles,
} from "./lib/chromium.js";
import { getFirefoxExtensions, getFirefoxProfiles } from "./lib/firefox.js";
import { Browsers } from "./lib/types.js";

inquirer.registerPrompt("search-list", inquirerSearch);

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
        type: "search-list",
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
    zip.extractAllTo("./safarify/extensions/" + extension.name, true);
  } else {
    console.log(`Copying ${extension.name} to the current folder...`);
    await fs.copy(
      extension.value,
      path.resolve("./safarify/", "extensions/", extension.name)
    );
  }

  console.log("Converting to a Safari extension project...");
  const finalPath = path.resolve("./safarify", "extensions", extension.name);
  const convert = execaCommand(
    `xcrun safari-web-extension-converter --project-location safarify --copy-resources --force --macos-only "${finalPath}"`,
    { shell: true }
  );
  convert.stderr?.pipe(process.stdout);
  await convert;

  console.log("Conversion done!");
  console.log("\n");
  console.log(
    `
  An Xcode project window should have opened, you should:
  1. Click on "${extension.name}" in the left sidebar
  2. Click on "${extension.name}" under "Targets"
  3. Select the "Signing & Capabilities" tab
  4. Check "Automatically manage signing"
  5. Select a Team in order to sign the extension
  6. Repeat steps 2 through 5 with "${extension.name} Extension"
  `.trim()
  );
  console.log("\n");
  console.log(
    "After you are done with the above, you can safely quit Xcode and run the following command. It has been copied to your clipboard for convenient"
  );
  console.log("\n");
  const buildCommand = `xcodebuild -config Release -project "safarify/${extension.name}/${extension.name}.xcodeproj/" build && open "safarify/${extension.name}/build/Release/${extension.name}.app"`;
  console.log(buildCommand);
  clipboard.writeSync(buildCommand);
})();
