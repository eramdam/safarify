# Safarify

This is a tool allowing you to convert an existing Chromium/Firefox extension to a Safari extension, it handles searching your home folder for Firefox/Edge/Chrome profiles and extensions installed there.

# Disclaimer

This tool simply re-packages the extensions using [safari-web-extension-converter](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari), so if the extension requires modifications in order to work on Safari because of API differences, this tool won't be able to magically solve that!

Tested on macOS 12.1, with Safari 15, using Node 17 and XCode 13.2.1

# Tested extensions

| Name                                                                                  | Version | Working? | Caveats |
| ------------------------------------------------------------------------------------- | ------- | -------- | ------- |
| [Hover Zoom+](https://addons.mozilla.org/en-US/firefox/addon/hover-zoom-for-firefox/) | 1.0.166 | Yes      | /       |
