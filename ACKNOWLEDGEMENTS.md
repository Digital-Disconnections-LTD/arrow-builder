# Acknowledgements

Arrow — the free, owned website builder behind **digitaldisconnections.com/build** —
stands on open-source work that other people gave away so anyone could build on it.
That is the whole point: Arrow exists so a small business can own its own site instead
of renting it from a platform. We are not going to be quiet about whose shoulders that
stands on.

Each library below ships with its upstream `LICENSE` file vendored alongside our own
(see `vendor/LICENSE-*.txt`), so the credit travels with the code.

## Front-end builder

| Project | Version | License | Source |
|---|---|---|---|
| **GrapesJS** — the drag-and-drop engine Arrow is built around | 0.23.2 | BSD-3-Clause | https://github.com/GrapesJS/grapesjs |
| **grapesjs-plugin-export** — the export panel that lets you walk away with your HTML/CSS | 1.0.12 | BSD-3-Clause | https://github.com/GrapesJS/export |
| **JSZip** — packages the owned-export bundle you download | 3.10.1 | MIT or GPLv3 (dual) | https://github.com/Stuk/jszip |
| **pako** — zlib port bundled inside JSZip | (via JSZip 3.10.1) | MIT | https://github.com/nodeca/pako |
| **CodeMirror** — the code view, bundled transitively through GrapesJS | (via GrapesJS 0.23.2) | MIT | https://github.com/codemirror/codemirror5 |
| **Font Awesome** — the editor's UI icons (vendored locally so the builder is zero-CDN) | 4.7.0 | Font: SIL OFL 1.1 · CSS: MIT | https://fontawesome.com/v4/ |

GrapesJS in particular is load-bearing: it is the reason Arrow can hand you a real,
portable export instead of locking your pages inside a proprietary editor. The BSD-3
copyright notice is retained in the vendored bundles and reproduced at publish time.

---

*If we have used your code or your structures anywhere in Arrow and you are not credited
here, that is a bug — open an issue and we will fix it.*
