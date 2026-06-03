# Arrow — the own-your-site website builder

Build a website in your browser. Download the actual files. Keep them forever.

Arrow is a drag-and-drop website builder that runs entirely in your browser and
hands you **plain, owned static files** — vanilla HTML and CSS that open and render
on their own, with no Arrow runtime, no CDN, no server, and no subscription. When
you're done, you click **Download my site** and you get a `.zip` of your website.
That's the whole product. The files are yours. We can disappear tomorrow and your
site still works.

That is the entire point. The drag-and-drop platforms — the ones that rent you a
page and hold the relationship hostage behind a monthly bill — will not let you walk
away with what you built. Arrow does the opposite. It's not 1997, and you shouldn't
have to choose between "easy to build" and "actually yours."

## What you get

- **A real WYSIWYG editor** in the browser, built on [GrapesJS](https://github.com/GrapesJS/grapesjs).
- **Multi-page sites** — add, rename, delete, and link between pages.
- **Owned static export** — `Download my site` produces a `.zip` containing:
  - `index.html` for your home page, `your-page/index.html` for the rest
  - one shared, minified `css/style.css`
  - a de-duplicated `assets/` folder (your images, fonts)
  - `robots.txt` + `sitemap.xml` so search engines can find you
  - per-page `<title>`, meta description, viewport, and Open Graph tags
- **No lock-in.** The export depends on nothing of ours. Open `index.html` from the
  zip in any browser and it just works. Host it anywhere — a $0 static host, a
  USB stick, your own server.

## Run it

Arrow is static. There is no build step and no install.

```bash
git clone https://github.com/Digital-Disconnections-LTD/arrow-builder.git
cd arrow-builder
```

Then either open `index.html` directly in your browser, or serve the folder so the
editor can fetch its own assets cleanly:

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Build a page, then click **⬇ Download my site**. You'll get a zip of owned static
files. That export runs completely client-side — no network call leaves your
machine to make it happen.

## Your work is saved locally

Arrow auto-saves your project to your browser's `localStorage`. It never leaves your
device. There is no account, no login, and no server holding your draft. (That also
means clearing your browser data clears your draft — download your site to keep it.)

## License

Arrow is **free for everyone, including commercial use** — build sites with it, keep
what you build, and self-host the builder. It is licensed under **Apache-2.0 with the
Commons Clause**: source-available, attribution required, with one restriction — you
may not repackage Arrow and **resell its functionality as a hosted service** (e.g. a
competing website-builder SaaS). Because of that no-resale clause, Arrow is
source-available but not an OSI-approved "open source" license. Full text in
[`LICENSE`](LICENSE).

## Standing on open source

Arrow is built on work other people gave away. The drag-and-drop engine, the export
panel, and the zip packager are all open-source projects, and their upstream license
files travel with this repo under `vendor/`. Credits and versions are in
[`ACKNOWLEDGEMENTS.md`](ACKNOWLEDGEMENTS.md). If we've used your code and you're not
credited there, that's a bug — open an issue.

---

Part of [Discnxt](https://discnxt.com) — small businesses owning their own presence
on the web, instead of renting it.
