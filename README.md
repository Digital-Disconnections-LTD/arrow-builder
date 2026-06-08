# Arrow

> "If it runs on your phone or your computer or your device and nowhere else,
> you shouldn't have to pay rent to use it."

The website builders charge rent. Arrow does not.

## The wrong

GoDaddy's Airo. Squarespace. Wix. The builder runs in your browser tab. The
files live on their servers. Export is paywalled or broken. Stop paying, the
site disappears — along with everything you built.

## The answer

Arrow is free and open-source. You don't build the site — we build it for you.

Answer a short questionnaire: what the business is, what you do, where you are,
whether you have a Facebook page or an existing site. Agents research your real
business footprint and build a site in plain owned HTML and CSS — filled with
your actual hours, services, and contact information, not placeholder text. When
the build finishes, the files are yours: a folder with no runtime, no database,
no scripts, no dependency on us. Tweak the text afterward with a simple editor
if you want to. Or don't — the site is already real.

That is the only arrangement we are willing to make.

## The offer

Arrow is free. The site we build you is free. The owned export is free.

Hosting is optional: $195 every three years. Your site lives on infrastructure
we manage — but you have a copy, always, because the exit is part of the deal.

If you do not want our hosting, the files run on GitHub Pages, your own server,
anywhere. We do not need to be in the picture.

---

Built by agents on [Ollama Cloud](https://ollama.com/cloud). Post-build editing:
[GrapesJS](https://grapesjs.com/) (BSD-3-Clause).
Part of [Digital Disconnections](https://digitaldisconnections.com/).

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
