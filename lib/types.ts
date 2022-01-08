export enum Browsers {
  FIREFOX = "Firefox",
  EDGE = "Edge",
  CHROME = "Chrome",
}

export interface BrowserProfile {
  name: string;
  value: string;
  browser: Browsers;
}

export interface FirefoxExtension {
  name: string;
  file: string;
  value: string;
}

export interface ChromiumExtension {
  name: string;
  value: string;
}
