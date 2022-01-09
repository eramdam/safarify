import AdmZip from "adm-zip";
import fs from "fs-extra";
import ini from "ini";
import _ from "lodash";
import os from "os";
import path from "path";
import glob from "tiny-glob";
import { BrowserProfile, Browsers, FirefoxExtension } from "./types.js";

export async function getFirefoxProfiles(): Promise<BrowserProfile[]> {
  const firefoxFolder = path.resolve(
    os.homedir(),
    "Library",
    "Application Support",
    "Firefox"
  );
  const profilesFile = await fs.readFile(
    path.resolve(firefoxFolder, "profiles.ini"),
    "utf-8"
  );
  const parsedIni = ini.parse(profilesFile);

  const defaultProfiles = _(parsedIni)
    .values()
    .reject(profile => {
      return profile.Locked === "1";
    })
    .map(profile => {
      if (!profile.Name || !profile.IsRelative || !profile.Path) {
        return undefined;
      }
      return {
        name: profile.Name,
        isRelative: profile.IsRelative,
        path: profile.Path,
      };
    })
    .compact()
    .map(profile => {
      return {
        name: String(profile.name),
        value: path.resolve(firefoxFolder, profile.path, "extensions"),
        browser: Browsers.FIREFOX,
      };
    })
    .sortBy(profile => profile.name)
    .orderBy(
      [
        profile =>
          profile.name.includes("-release") || profile.name.includes("-esr"),
        profile => profile.name.startsWith("default-"),
      ],
      "desc"
    )

    .value();

  return defaultProfiles;
}

export async function getFirefoxExtensions(
  extensionsPath: string
): Promise<FirefoxExtension[]> {
  const xpiFiles = await glob(`${extensionsPath}/*.xpi`, {
    absolute: true,
  });
  let extensions: FirefoxExtension[] = [];

  for (const file of xpiFiles) {
    const zip = new AdmZip(file);
    const name = getExtensionName(zip);
    if (!name) {
      continue;
    }
    extensions.push({
      name,
      file,
      value: {
        name,
        value: file,
      },
    });
  }

  return _(extensions)
    .sortBy(e => e.name)
    .value();
}

function getExtensionName(extension: AdmZip): string | undefined {
  const manifestFile = extension.getEntry("manifest.json");

  if (!manifestFile) {
    return undefined;
  }

  const manifest = JSON.parse(manifestFile.getData().toString());
  const name = String(manifest.name);

  if (!name.startsWith("__MSG_")) {
    return manifest.name;
  }

  try {
    const defaultLocale = String(manifest.default_locale).replace(/-/g, "_");
    const rawMessageFile = extension
      .getEntry(`_locales/${defaultLocale}/messages.json`)
      ?.getData()
      .toString();
    const messages = JSON.parse(rawMessageFile || "");
    const messageKey = name.replace("__MSG_", "").replace(/__$/, "");

    return messages[messageKey]?.message;
  } catch (e) {
    return undefined;
  }
}
