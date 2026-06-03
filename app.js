/* ===========================================================================
   Arrow builder — the own-your-site browser website builder.
   Self-hosted GrapesJS editor. Builds a MULTI-page site a non-technical owner
   can download as OWNED static files that render with zero builder runtime.

   Everything runs in the browser. The download is plain vanilla HTML/CSS that
   needs no server, no CDN, and no subscription. Per page the export:
     - multiple pages via GrapesJS PageManager (add/rename/delete/set-home)
     - in-editor link picker: link to another page (page:<id> token, resolved on export)
     - home -> index.html at root; others -> <slug>/index.html
     - ONE shared css/style.css (minified; @font-face + @media preserved)
     - ONE shared assets/ with cross-page de-duplication
     - per page: injected <meta viewport>, custom root (no double <body>),
       depth-aware asset/css/link rewrite, per-page SEO <head>
     - a "Part of Discnxt" backlink injected at assembly time
     - robots.txt (permissive) + sitemap.xml listing every page
     - favicon + Rubik OFL license bundled
   ======================================================================== */
(function () {
  'use strict';

  // ---- where this builder is served from -----------------------------------
  // Everything the editor references at an absolute path (the canvas font, the
  // starter photo, the export-time asset fetch) hangs off BASE, so the builder
  // is portable: "/build/" on the hosted instance, "/" for a cloned repo served
  // at the web root, "/arrow-builder/" under a project subpath — all just work.
  var BASE = location.pathname.replace(/[^/]*$/, '');
  var ASSET_RE = new RegExp(BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'assets/', 'g');

  // ---- project identity + storage (localStorage MVP floor) -----------------
  // Multi-page state is just JSON (pages + styles + assets) and fits localStorage
  // comfortably; server-side per-project storage stays the deliberate later slice.
  var PROJECT_ID = (new URLSearchParams(location.search).get('id') || 'my-site')
                     .replace(/[^a-z0-9_-]/gi, '').slice(0, 60) || 'my-site';
  var STORAGE_KEY = 'arrow:project:' + PROJECT_ID;
  var META_KEY = STORAGE_KEY + ':meta';

  // Site-level meta: { url, ogImage, homePageId, pages: { <pageId>: {title,desc} } }
  function loadMeta() {
    try { var m = JSON.parse(localStorage.getItem(META_KEY)) || {}; if (!m.pages) m.pages = {}; return m; }
    catch (e) { return { pages: {} }; }
  }
  function saveMeta(m) { localStorage.setItem(META_KEY, JSON.stringify(m)); }

  // ---- exported-site theme (added to the CSS COMPOSER -> it exports) --------
  // The @font-face lives in the CSS composer so it carries into getCss()/export.
  // url() is authored at the in-EDITOR-correct absolute path (BASE + assets/...)
  // so the canvas preview loads with NO 404, then rewritten to the export-relative
  // ../assets/ path at download time. One source of truth, clean console.
  var THEME_CSS = [
    "@font-face{font-family:'Rubik';src:url('" + BASE + "assets/fonts/rubik-latin.woff2') format('woff2');font-weight:300 700;font-style:normal;font-display:swap}",
    "*{box-sizing:border-box}",
    "body{margin:0;font-family:'Rubik',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#16202e;line-height:1.6;background:#fff}",
    "img{max-width:100%;height:auto;display:block}",
    "a{color:#0b7676}",
    ".site-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 28px;background:#0d1b2a}",
    ".site-nav__brand{color:#fff;font-weight:700;font-size:20px;letter-spacing:.2px;text-decoration:none}",
    ".site-nav__links{list-style:none;display:flex;gap:22px;margin:0;padding:0}",
    ".site-nav__links a{color:#cde7e7;text-decoration:none;font-weight:500}",
    ".site-nav__links a:hover{color:#fff}",
    ".hero{position:relative;color:#fff;text-align:center;background:#0d1b2a}",
    ".hero__img{width:100%;height:auto;display:block;filter:brightness(.6)}",
    ".hero__inner{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}",
    ".hero__title{font-size:clamp(28px,5vw,52px);margin:0 0 12px;max-width:18ch;line-height:1.15}",
    ".hero__text{font-size:clamp(15px,2.2vw,20px);margin:0 0 22px;max-width:40ch}",
    ".btn{display:inline-block;background:#0a7575;color:#fff;padding:13px 26px;border-radius:6px;text-decoration:none;font-weight:600}",
    ".btn:hover{background:#085f5f}",
    ".section{max-width:1040px;margin:0 auto;padding:56px 28px}",
    ".section__title{font-size:clamp(24px,3.4vw,34px);margin:0 0 16px;color:#0d1b2a}",
    ".prose p{margin:0 0 16px;color:#3a4960;font-size:17px}",
    ".features{display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:1040px;margin:0 auto;padding:56px 28px}",
    ".features__col h3{font-size:21px;margin:0 0 10px;color:#0d1b2a}",
    ".features__col p{margin:0;color:#3a4960}",
    ".media{max-width:1040px;margin:0 auto;padding:24px 28px}",
    ".media img{width:100%;border-radius:10px}",
    ".cta{background:#0f2536;color:#fff;text-align:center;padding:64px 28px}",
    ".cta__title{font-size:clamp(24px,3.6vw,36px);margin:0 0 12px}",
    ".cta__text{margin:0 auto 24px;max-width:46ch;color:#cde7e7;font-size:18px}",
    ".cta__contact{margin:18px 0 0;color:#9fb3c8;font-size:15px}",
    ".cta__contact a{color:#cde7e7}",
    ".site-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:26px 28px;background:#0d1b2a;color:#9fb3c8;font-size:14px}",
    ".site-footer a{color:#cde7e7}",
    // styling for the assembly-time backlink that appears only if the owner
    // deleted their footer block (AC6) — harmless when unused.
    ".arrow-attribution{padding:16px 28px;background:#0d1b2a;color:#9fb3c8;font-size:13px;text-align:center;margin:0}",
    ".arrow-attribution a{color:#cde7e7}",
    "@media (max-width:768px){.features{grid-template-columns:1fr;padding:40px 22px}.site-nav{flex-direction:column;gap:12px}.section{padding:40px 22px}.cta{padding:48px 22px}}"
  ].join('\n');

  // ---- curated starter blocks for a small-business owner -------------------
  var IMG = BASE + 'assets/img/starter-hero.jpg'; // in-editor absolute; rewritten on export
  function icon(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="#0d8a8a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';}

  var BLOCKS = [
    { id:'arrow-nav', label:'Navigation', media:icon('<line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="14" y2="12"/><line x1="3" y1="17" x2="18" y2="17"/>'),
      content:
        '<nav class="site-nav">'+
          '<a class="site-nav__brand" href="#">Your Business</a>'+
          '<ul class="site-nav__links"><li><a href="#about">About</a></li><li><a href="#visit">Visit</a></li><li><a href="#contact">Contact</a></li></ul>'+
        '</nav>' },

    { id:'arrow-hero', label:'Hero', media:icon('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 14l5-4 4 3 4-4 5 4"/>'),
      content:
        '<header class="hero">'+
          '<img class="hero__img" src="'+IMG+'" alt="Photo of your business"/>'+
          '<div class="hero__inner">'+
            '<h1 class="hero__title">A headline that says what you do</h1>'+
            '<p class="hero__text">One welcoming sentence about your business and who it is for.</p>'+
            '<a class="btn" href="#contact">Get in touch</a>'+
          '</div>'+
        '</header>' },

    { id:'arrow-text', label:'Text section', media:icon('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="16" y2="14"/>'),
      content:
        '<section class="section prose" id="about">'+
          '<h2 class="section__title">About us</h2>'+
          '<p>Tell your story here. Two or three short sentences about how you started, what you care about, and why people come to you. Plain words beat fancy ones.</p>'+
          '<p>Mention what makes you different — the thing a big chain can\'t copy.</p>'+
        '</section>' },

    { id:'arrow-features', label:'Two columns', media:icon('<rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="4" width="7" height="16" rx="1"/>'),
      content:
        '<section class="features">'+
          '<div class="features__col"><h3>What we offer</h3><p>List your main service or product. Keep it concrete — what someone actually walks away with.</p></div>'+
          '<div class="features__col"><h3>Where to find us</h3><p>Your address and hours. Street parking, transit, whatever helps a first-timer show up.</p></div>'+
        '</section>' },

    { id:'arrow-image', label:'Image', media:icon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/>'),
      content:'<div class="media"><img src="'+IMG+'" alt="Describe this photo for search engines and screen readers"/></div>' },

    { id:'arrow-cta', label:'Contact / call-to-action', media:icon('<path d="M4 4h16v12H7l-3 3z"/>'),
      content:
        '<section class="cta" id="contact">'+
          '<h2 class="cta__title">Come say hello</h2>'+
          '<p class="cta__text">A friendly nudge to call, email, or stop by. Tell people the easiest way to reach you.</p>'+
          '<a class="btn" href="tel:+10000000000">Call us</a>'+
          '<p class="cta__contact">123 Main St · Your Town · <a href="mailto:hello@yourbusiness.com">hello@yourbusiness.com</a></p>'+
        '</section>' },

    { id:'arrow-footer', label:'Footer', media:icon('<line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="14" x2="21" y2="14"/>'),
      content:
        '<footer class="site-footer">'+
          '<p>&copy; Your Business</p>'+
          '<p><a href="https://discnxt.com">Part of Discnxt</a></p>'+
        '</footer>' }
  ];

  // ---- one-page starter template (canvas is never blank) -------------------
  var STARTER = BLOCKS.map(function (b) { return b.content; }).join('\n');

  // ---- in-editor link picker: a trait that links to another page -----------
  // Stores href as a stable "page:<id>" token; exportSite() resolves it to the
  // correct depth-aware relative path per source page. (AC1 — no hand-typed URL.)
  function registerPageLinkTrait(editor) {
    editor.TraitManager.addType('page-link', {
      createInput: function () {
        var el = document.createElement('select');
        el.style.width = '100%';
        return el;
      },
      onUpdate: function (o) {
        var el = o.elem, comp = o.component;
        var href = comp.getAttributes().href || '';
        var current = /^page:(.+)$/.exec(href);
        var html = '<option value="">— not a page link —</option>';
        editor.Pages.getAll().forEach(function (p) {
          var sel = current && current[1] === p.getId() ? ' selected' : '';
          html += '<option value="' + p.getId() + '"' + sel + '>' + escAttr(p.get('name') || p.getId()) + '</option>';
        });
        el.innerHTML = html;
      },
      onEvent: function (o) {
        var el = o.elem, comp = o.component;
        var id = el.value;
        if (id) comp.addAttributes({ href: 'page:' + id });
        else { var a = comp.getAttributes(); if (/^page:/.test(a.href || '')) comp.removeAttributes('href'); }
      }
    });

    // attach the trait to any selected link, once
    editor.on('component:selected', function (comp) {
      if (!comp || comp.get('tagName') !== 'a') return;
      var has = (comp.get('traits') || []).filter(function (t) { return t.get && t.get('name') === 'arrowPage'; }).length;
      if (!has) comp.addTrait({ name: 'arrowPage', type: 'page-link', label: 'Link to page' }, { at: 0 });
    });
  }

  // ---- init editor ---------------------------------------------------------
  var editor = grapesjs.init({
    container: '#gjs',
    height: '100%',
    fromElement: false,
    avoidInlineStyle: true,
    // Self-hosted editor icons. GrapesJS defaults cssIcons to a cloudflare CDN
    // copy of Font Awesome; we vendor it (vendor/fontawesome/) so the builder
    // is genuinely zero-CDN — it works fully offline, with no third-party calls.
    cssIcons: BASE + 'vendor/fontawesome/font-awesome.min.css',
    storageManager: {
      type: 'local', autosave: true, stepsBeforeSave: 1,
      options: { local: { key: STORAGE_KEY } }
    },
    // PageManager: multi-page is core in GrapesJS 0.23. A default page exists; we
    // give it a friendly name and build the page-bar UI around editor.Pages.
    pageManager: { pages: [ { id: 'home', name: 'Home' } ] },
    assetManager: {
      assets: [ { type:'image', src: IMG, name:'Starter photo' } ],
      noAssets: 'No images yet — upload one or pick the starter photo.'
    },
    deviceManager: {
      devices: [
        { id:'desktop', name:'Desktop', width:'' },
        { id:'mobile',  name:'Mobile',  width:'360px', widthMedia:'768px' }
      ]
    },
    plugins: ['grapesjs-plugin-export'],
    pluginsOpts: { 'grapesjs-plugin-export': {} },
    blockManager: { appendTo: undefined }
  });

  registerPageLinkTrait(editor);

  // register curated blocks (replace the plugin/default noise)
  var bm = editor.BlockManager;
  BLOCKS.forEach(function (b) {
    bm.add(b.id, { label: b.label, category: 'Sections', media: b.media, content: b.content, activate: true });
  });

  // make Rubik selectable in the typography font picker (AC3: selectable webfont)
  editor.on('load', function () {
    try {
      var sm = editor.StyleManager;
      var prop = sm.getProperty('typography', 'font-family');
      if (prop && prop.get) {
        var opts = prop.get('options') || prop.get('list') || [];
        var has = opts.some(function (o) { return /Rubik/.test(o.value || o.name || ''); });
        if (!has) { opts.unshift({ id:'Rubik', value:"'Rubik', system-ui, sans-serif", name:'Rubik (self-hosted)' });
                    prop.set('options', opts); }
      }
    } catch (e) { /* non-fatal: picker still works without the extra entry */ }
  });

  // Ensure the export-ready theme (incl. @font-face) is in the CSS composer.
  // CSS is shared across all pages — adding once covers every page's export.
  function ensureTheme() {
    var css = editor.getCss() || '';
    if (css.indexOf('@font-face') === -1 || css.indexOf('.site-nav') === -1) {
      editor.Css.addRules(THEME_CSS);
    }
  }

  // load starter on a fresh project; otherwise the saved state auto-loads
  editor.on('load', function () {
    ensureTheme(); // adds the theme (incl. @font-face) once if not already stored
    var hasContent = editor.getComponents().length > 0;
    if (!hasContent) {
      editor.setComponents(STARTER); // theme already in the composer from ensureTheme()
      editor.store();
    }
    renderPageBar();
  });

  // keep the page bar in sync with the PageManager
  editor.on('page', renderPageBar);
  editor.on('page:select', renderPageBar);
  editor.on('page:add page:remove page:update', renderPageBar);

  // ---- page bar UX ---------------------------------------------------------
  var pagesEl = document.getElementById('arrow-pages');

  function homeId() {
    var m = loadMeta();
    var all = editor.Pages.getAll();
    if (m.homePageId && all.some(function (p) { return p.getId() === m.homePageId; })) return m.homePageId;
    return all.length ? all[0].getId() : null;
  }

  function renderPageBar() {
    if (!pagesEl) return;
    var all = editor.Pages.getAll();
    var sel = editor.Pages.getSelected();
    var hid = homeId();
    pagesEl.innerHTML = '';
    all.forEach(function (p) {
      var isSel = sel && sel.getId() === p.getId();
      var isHome = p.getId() === hid;
      var tab = document.createElement('div');
      tab.className = 'arrow-page';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', isSel ? 'true' : 'false');

      if (isHome) { var h = document.createElement('span'); h.className = 'arrow-page__home'; h.textContent = '⌂'; h.title = 'Home page (exports as index.html)'; tab.appendChild(h); }

      var nameBtn = document.createElement('button');
      nameBtn.type = 'button'; nameBtn.className = 'arrow-page__name';
      nameBtn.textContent = p.get('name') || p.getId();
      nameBtn.title = 'Switch to this page (double-click to rename)';
      nameBtn.addEventListener('click', function () { editor.Pages.select(p); });
      nameBtn.addEventListener('dblclick', function () { renamePage(p); });
      tab.appendChild(nameBtn);

      if (!isHome) {
        var home = document.createElement('button');
        home.type = 'button'; home.className = 'arrow-page__act'; home.textContent = '⌂';
        home.title = 'Make this the home page'; home.setAttribute('aria-label', 'Set as home page');
        home.addEventListener('click', function (e) { e.stopPropagation(); setHome(p); });
        tab.appendChild(home);
      }
      if (all.length > 1) {
        var del = document.createElement('button');
        del.type = 'button'; del.className = 'arrow-page__act'; del.textContent = '✕';
        del.title = 'Delete this page'; del.setAttribute('aria-label', 'Delete page');
        del.addEventListener('click', function (e) { e.stopPropagation(); deletePage(p); });
        tab.appendChild(del);
      }
      pagesEl.appendChild(tab);
    });
  }

  function addPage() {
    var name = (prompt('Name this page (e.g. About, Menu, Contact):', 'New page') || '').trim();
    if (!name) return;
    var p = editor.Pages.add({ name: name }, { select: true });
    // new page starts with a nav + a text section so the canvas is never blank
    editor.setComponents(
      '<nav class="site-nav"><a class="site-nav__brand" href="#">Your Business</a>'+
      '<ul class="site-nav__links"><li><a href="#">Home</a></li></ul></nav>'+
      '<section class="section prose"><h2 class="section__title">'+escHtml(name)+'</h2>'+
      '<p>Add your content for this page here.</p></section>'+
      '<footer class="site-footer"><p>&copy; Your Business</p>'+
      '<p><a href="https://discnxt.com">Part of Discnxt</a></p></footer>'
    );
    ensureTheme(); editor.store(); renderPageBar();
  }

  function renamePage(p) {
    var name = (prompt('Rename page:', p.get('name') || '') || '').trim();
    if (!name) return;
    p.set('name', name); editor.store(); renderPageBar();
  }

  function setHome(p) {
    var m = loadMeta(); m.homePageId = p.getId(); saveMeta(m); renderPageBar();
    toast('"' + (p.get('name') || 'page') + '" is now your home page.');
  }

  function deletePage(p) {
    var all = editor.Pages.getAll();
    if (all.length <= 1) { toast('A site needs at least one page.', true); return; }
    if (!confirm('Delete "' + (p.get('name') || 'this page') + '"? This cannot be undone.')) return;
    var wasHome = p.getId() === homeId();
    editor.Pages.remove(p);
    var m = loadMeta();
    if (m.pages) { delete m.pages[p.getId()]; }
    if (wasHome) { m.homePageId = editor.Pages.getAll()[0].getId(); }
    saveMeta(m); editor.store(); renderPageBar();
  }

  document.getElementById('arrow-addpage-btn').addEventListener('click', addPage);

  // ---- save / load UX ------------------------------------------------------
  var savedEl = document.getElementById('arrow-saved');
  editor.on('storage:start', function () { if (savedEl){ savedEl.textContent='saving…'; savedEl.dataset.state='saving'; } });
  editor.on('storage:end',   function () { if (savedEl){ savedEl.textContent='saved'; savedEl.dataset.state=''; } });

  document.getElementById('arrow-save-btn').addEventListener('click', function () {
    ensureTheme(); editor.store(); toast('Saved to this browser.');
  });

  // ---- site details modal (per-page title/desc + site-wide url/og) ---------
  var modal = document.getElementById('arrow-settings');
  var fTitle = document.getElementById('set-title');
  var fDesc  = document.getElementById('set-desc');
  var fUrl   = document.getElementById('set-url');
  var fOg    = document.getElementById('set-ogimage');
  var fPageName = document.getElementById('set-pagename');

  function imageAssets() {
    try {
      return editor.AssetManager.getAll().filter(function (a) {
        var t = a.get && a.get('type'); var s = (a.get && a.get('src')) || '';
        return t === 'image' || /\.(jpe?g|png|webp|gif|svg)$/i.test(s);
      }).map(function (a) { return a.get('src'); });
    } catch (e) { return []; }
  }

  function openSettings() {
    var m = loadMeta();
    var sel = editor.Pages.getSelected();
    var pid = sel ? sel.getId() : 'home';
    var pm = (m.pages && m.pages[pid]) || {};
    fPageName.textContent = '— ' + ((sel && sel.get('name')) || 'Home');
    fTitle.value = pm.title || '';
    fDesc.value  = pm.desc  || '';
    fUrl.value   = m.url || '';
    // populate og:image picker from the asset manager (any uploaded image)
    fOg.innerHTML = '<option value="">Auto — first photo on the page</option>';
    imageAssets().forEach(function (src) {
      // normalise any in-editor src to its owned local assets/ path.
      var rel = src.replace(/^.*\/assets\//, 'assets/');
      var o = document.createElement('option'); o.value = rel; o.textContent = rel.split('/').pop();
      if (m.ogImage === rel) o.selected = true; fOg.appendChild(o);
    });
    modal.hidden = false;
  }
  function closeSettings() { modal.hidden = true; }
  document.getElementById('arrow-settings-btn').addEventListener('click', openSettings);
  document.getElementById('set-cancel').addEventListener('click', closeSettings);
  document.getElementById('set-save').addEventListener('click', function () {
    var m = loadMeta();
    var sel = editor.Pages.getSelected();
    var pid = sel ? sel.getId() : 'home';
    if (!m.pages) m.pages = {};
    m.pages[pid] = { title: fTitle.value.trim(), desc: fDesc.value.trim() };
    m.url = fUrl.value.trim();
    m.ogImage = fOg.value;
    saveMeta(m);
    closeSettings(); toast('Site details saved.');
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeSettings(); });

  // ---- helpers -------------------------------------------------------------
  function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function escHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escAttr(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function esc(s){ return escAttr(s); }

  // Conservative CSS minifier (AC7): strip comments + collapse whitespace, but
  // NEVER touch the inside of url()/strings, and keep @media / @font-face intact.
  // Our urls are relative (no spaces, no ':'), so token-trimming is safe.
  function minifyCss(css) {
    return String(css)
      .replace(/\/\*[\s\S]*?\*\//g, '')       // drop comments
      .replace(/\s+/g, ' ')                    // collapse whitespace runs
      .replace(/\s*([{}:;,>])\s*/g, '$1')      // trim around structural tokens
      .replace(/;}/g, '}')                     // drop the last semicolon in a block
      .trim();
  }

  // Build the export plan: every page with a unique slug + its on-disk path/depth.
  // Home -> index.html (depth 0). Others -> <slug>/index.html (depth 1).
  function buildPagePlan() {
    var hid = homeId();
    var all = editor.Pages.getAll();
    var used = {}; var plan = [];
    // home first
    all.sort(function (a, b) { return (a.getId() === hid ? -1 : b.getId() === hid ? 1 : 0); });
    all.forEach(function (p) {
      var isHome = p.getId() === hid;
      var s = slug(p.get('name') || p.getId()) || ('page-' + (plan.length));
      if (isHome) {
        plan.push({ page: p, id: p.getId(), name: p.get('name') || 'Home', isHome: true, slug: '', path: 'index.html', depth: 0 });
      } else {
        var base = s, n = 2; while (used[s]) { s = base + '-' + (n++); } used[s] = 1;
        plan.push({ page: p, id: p.getId(), name: p.get('name') || s, isHome: false, slug: s, path: s + '/index.html', depth: 1 });
      }
    });
    used[''] = 1;
    return plan;
  }

  // Resolve a page:<id> link from a source page (depth-aware relative path).
  function resolvePageLink(targetId, plan, sourceDepth) {
    var t = null; for (var i=0;i<plan.length;i++){ if (plan[i].id === targetId){ t = plan[i]; break; } }
    if (!t) return '#'; // dangling (e.g. deleted target) — safe no-op
    var prefix = sourceDepth === 0 ? '' : '../';
    return prefix + t.path; // home path is 'index.html'; sub path is '<slug>/index.html'
  }

  // ---- export: assemble owned MULTI-page static bundle + zip + download -----
  document.getElementById('arrow-export-btn').addEventListener('click', function () {
    exportSite().catch(function (e) { console.error(e); toast('Export failed: ' + e.message, true); });
  });

  async function exportSite() {
    ensureTheme();
    var meta = loadMeta();
    var plan = buildPagePlan();
    if (!plan.length) { toast('Nothing to export yet.', true); return; }

    // ONE shared stylesheet for the whole site. keepUnusedStyles ensures every
    // page's rules ship even if a rule isn't matched on the currently-selected
    // page. Then minify (AC7). url() inside is anchored at css/ -> ../assets/.
    var rawCss = editor.getCss({ keepUnusedStyles: true }) || editor.getCss();
    rawCss = rawCss.replace(ASSET_RE, '../assets/');
    var css = minifyCss(rawCss);

    var assets = new Set();
    assets.add('assets/fonts/rubik-latin.woff2'); // webfont always travels

    // pull css-referenced assets once (shared)
    css.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, function (m, u) {
      var cu = u.replace(/^\.\.\//, '');
      if (/^assets\//.test(cu)) assets.add(cu); return m;
    });

    // assemble each page. getHtml({component}) serializes each page's own tree
    // without selecting it — selecting would trigger an async canvas rebuild we
    // neither need nor want mid-export.
    var pageDocs = [];
    plan.forEach(function (pg) {
      var body = editor.getHtml({ component: pg.page.getMainComponent() });

      // depth-aware rewrites
      var assetPrefix = pg.depth === 0 ? 'assets/' : '../assets/';
      body = body.replace(ASSET_RE, assetPrefix);

      // resolve in-editor page:<id> links -> static relative paths
      body = body.replace(/(href\s*=\s*)(["'])page:([^"']+)\2/g, function (m, pre, q, id) {
        return pre + q + resolvePageLink(id, plan, pg.depth) + q;
      });

      // collect this page's image/media asset refs (normalise to root-relative)
      body.replace(/(?:src|href)\s*=\s*["']([^"']+)["']/g, function (m, u) {
        var cu = u.replace(/^\.\.\//, '');
        if (/^assets\//.test(cu)) assets.add(cu); return m;
      });

      // og:image — per-page: explicit site setting, else first image on the page
      var ogRel = meta.ogImage || '';
      if (!ogRel) {
        var found = '';
        body.replace(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi, function (m, u) {
          var cu = u.replace(/^\.\.\//, '').replace(/^assets\//, 'assets/');
          if (!found && /assets\//.test(cu) && cu.indexOf('fonts/') === -1) found = cu.replace(/^.*assets\//, 'assets/');
          return m;
        });
        ogRel = found;
      }

      // AC6: ensure the crawler-visible "Part of Discnxt" backlink exists, even
      // if the owner deleted their footer block. Injected at assembly time like
      // the viewport meta — structural, not a deletable decoration.
      if (!/href\s*=\s*["']https?:\/\/discnxt\.com/i.test(body)) {
        body = body.replace(/<\/body>\s*$/i,
          '<footer class="arrow-attribution"><a href="https://discnxt.com">Part of Discnxt</a></footer></body>');
      }

      pageDocs.push({ pg: pg, body: body, ogRel: ogRel });
    });

    // per-page <head> (depth-aware css/favicon/og + canonical from site url)
    var base = (meta.url || '').replace(/\/+$/, '');
    var siteTitle = (meta.pages && meta.pages[plan[0].id] && meta.pages[plan[0].id].title) || 'My website';

    var zip = new JSZip();

    pageDocs.forEach(function (d) {
      var pg = d.pg;
      var pm = (meta.pages && meta.pages[pg.id]) || {};
      var title = pm.title || (pg.isHome ? siteTitle : (siteTitle.replace(/ —.*$/, '') + ' — ' + pg.name));
      var desc  = pm.desc || '';
      var up    = pg.depth === 0 ? '' : '../';
      var canon = base ? (pg.isHome ? base + '/' : base + '/' + pg.slug + '/') : '';
      // og:image absolute when we know the base, else depth-relative
      var ogAbs = d.ogRel ? (base ? base + '/' + d.ogRel : up + d.ogRel) : '';

      var head =
        '<!doctype html>\n<html lang="en">\n<head>\n' +
        '  <meta charset="utf-8">\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1">\n' +
        '  <title>' + esc(title) + '</title>\n' +
        (desc  ? '  <meta name="description" content="' + esc(desc) + '">\n' : '') +
        (canon ? '  <link rel="canonical" href="' + esc(canon) + '">\n' : '') +
        '  <meta property="og:type" content="website">\n' +
        '  <meta property="og:title" content="' + esc(title) + '">\n' +
        (desc  ? '  <meta property="og:description" content="' + esc(desc) + '">\n' : '') +
        (ogAbs ? '  <meta property="og:image" content="' + esc(ogAbs) + '">\n' : '') +
        '  <meta name="theme-color" content="#0d1b2a">\n' +
        '  <link rel="icon" href="' + up + 'favicon.svg" type="image/svg+xml">\n' +
        '  <link rel="stylesheet" href="' + up + 'css/style.css">\n' +
        '</head>';

      zip.file(pg.path, head + '\n' + d.body + '\n</html>\n');
    });

    // shared stylesheet
    zip.file('css/style.css', css);

    // robots.txt (permissive — exported sites should be crawlable) + sitemap.xml
    var sitemapUrl = base ? base + '/sitemap.xml' : 'sitemap.xml';
    zip.file('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + sitemapUrl + '\n');

    var urls = plan.map(function (pg) {
      var loc = base ? (pg.isHome ? base + '/' : base + '/' + pg.slug + '/') : (pg.isHome ? 'index.html' : pg.slug + '/index.html');
      return '  <url><loc>' + esc(loc) + '</loc></url>';
    }).join('\n');
    zip.file('sitemap.xml',
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');

    // favicon (neutral generic mark — NOT discnxt-branded; BP 100, no 404)
    try { zip.file('favicon.svg', await (await fetch('assets/site-favicon.svg')).text()); }
    catch (e) { /* non-fatal */ }

    // Rubik OFL license MUST travel with the font (SIL OFL §2 / DD invariant)
    try { zip.file('assets/fonts/OFL.txt', await (await fetch('assets/fonts/OFL.txt')).text()); }
    catch (e) { /* non-fatal */ }

    // copy every referenced asset once, de-duplicated across all pages. Every byte
    // comes from this builder's own files (BASE + path) — no external host, so the
    // exported zip is truly self-contained.
    for (var p of assets) {
      try {
        var res = await fetch(BASE + p);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        zip.file(p, await res.arrayBuffer());
      } catch (e) { console.warn('asset skipped:', p, e.message); }
    }

    var blob = await zip.generateAsync({ type: 'blob' });
    var name = (slug(siteTitle) || 'my-site') + '.zip';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast('Downloaded ' + name + ' — ' + plan.length + ' page' + (plan.length>1?'s':'') + ', all yours to keep.');
  }

  // ---- toast ---------------------------------------------------------------
  var toastEl;
  function toast(msg, isErr) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'arrow-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.className = 'arrow-toast arrow-toast--show' + (isErr ? ' arrow-toast--err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.className = 'arrow-toast' + (isErr ? ' arrow-toast--err' : ''); }, 3200);
  }

  window.__arrowEditor = editor;     // for headless verification
  window.__arrowExport = exportSite; // gate harness can trigger export directly
})();
