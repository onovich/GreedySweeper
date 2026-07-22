# Local font assets

The production UI loads only the WOFF2 files in this directory. They are subsets of the official Google Fonts binaries and retain the upstream SIL Open Font License.

| Asset                          | Upstream source                                         | Weight           | Subset                     |
| ------------------------------ | ------------------------------------------------------- | ---------------- | -------------------------- |
| `noto-sans-sc-ui.woff2`        | `google/fonts/ofl/notosanssc/NotoSansSC[wght].ttf`      | variable 500–900 | glyphs in `glyphs.txt`     |
| `ibm-plex-mono-medium.woff2`   | `google/fonts/ofl/ibmplexmono/IBMPlexMono-Medium.ttf`   | 500              | ASCII, digits, punctuation |
| `ibm-plex-mono-semibold.woff2` | `google/fonts/ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf` | 600              | ASCII, digits, punctuation |

The source binaries are not committed. Update `glyphs.txt`, regenerate the subsets with `fonttools subset --flavor=woff2`, then update `manifest.json`. UI copy must pass the repository glyph coverage test before merge.
