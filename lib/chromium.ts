import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import glob from "tiny-glob";
import { BrowserProfile, Browsers, ChromiumExtension } from "./types.js";

export async function getChromeProfiles(
  variant: "Chrome" | "Chrome Canary"
): Promise<BrowserProfile[]> {
  const chromeFolder = path.resolve(
    os.homedir(),
    "Library",
    "Application Support",
    "Google",
    variant
  );
  const localStateFile = await fs.readFile(
    path.resolve(chromeFolder, "Local State"),
    "utf-8"
  );
  const localState = JSON.parse(localStateFile || "");
  return _(localState.profile.info_cache)
    .keys()
    .map(key => {
      return {
        name: key,
        value: path.resolve(chromeFolder, key, "Extensions"),
        browser: Browsers.CHROME,
      };
    })
    .value();
}

export async function getEdgeProfiles(
  variant: "Edge" | "Edge Canary"
): Promise<BrowserProfile[]> {
  const chromeFolder = path.resolve(
    os.homedir(),
    "Library",
    "Application Support",
    `Microsoft ${variant}`
  );
  const localStateFile = await fs.readFile(
    path.resolve(chromeFolder, "Local State"),
    "utf-8"
  );
  const localState = JSON.parse(localStateFile || "");
  return _(localState.profile.info_cache)
    .keys()
    .map(key => {
      return {
        name: key,
        value: path.resolve(chromeFolder, key, "Extensions"),
        browser: Browsers.EDGE,
      };
    })
    .value();
}

export async function getChromiumExtensions(
  extensionsPath: string
): Promise<ChromiumExtension[]> {
  const manifestFiles = await glob(`${extensionsPath}/**/manifest.json`, {
    absolute: true,
  });

  let extensions: ChromiumExtension[] = [];

  for (const file of manifestFiles) {
    const name = await getExtensionName(file);
    if (!name) {
      continue;
    }
    extensions.push({
      name,
      value: {
        name,
        value: path.dirname(file),
      },
    });
  }

  return extensions;
}

async function getExtensionName(
  manifestFilePath: string
): Promise<string | undefined> {
  const manifestFile = await fs.readFile(manifestFilePath, "utf-8");
  const extensionFolder = path.dirname(manifestFile);
  const manifest = JSON.parse(manifestFile || "");
  const name = String(manifest.name);

  if (!name.startsWith("__MSG_")) {
    return name;
  }

  try {
    const defaultLocale = String(manifest.default_locale).replace(/-/g, "_");
    const rawMessageFile = await fs.readFile(
      path.resolve(extensionFolder, "_locales", defaultLocale, "messages.json"),
      "utf-8"
    );
    const messages = JSON.parse(rawMessageFile || "");
    const messageKey = name.replace("__MSG_", "").replace(/__$/, "");

    return messages[messageKey]?.message || undefined;
  } catch (e) {
    return undefined;
  }
}
