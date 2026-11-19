/*
 * EuroPass Academy i18n
 * Interface languages: ar (source, default), en, fr, es.
 * Pages are authored in Arabic. For another language we translate Arabic text
 * nodes and attributes at runtime from window.EP_DICT (assets/js/i18n-dict.js),
 * and keep translating whatever Alpine renders later via a MutationObserver.
 * Switching language stores the choice and reloads, so Arabic is always restored
 * from the untouched source.
 */
(function () {
    'use strict';
    var LANGS = [
        { id: 'ar', label: 'العربية', short: 'AR', dir: 'rtl', locale: 'ar-MA' },
        { id: 'en', label: 'English', short: 'EN', dir: 'ltr', locale: 'en-GB' },
        { id: 'fr', label: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-FR' },
        { id: 'es', label: 'Español', short: 'ES', dir: 'ltr', locale: 'es-ES' }
    ];
    var lang = 'ar';
    try {
        var q = new URLSearchParams(location.search).get('lang');
        if (q && LANGS.some(function (l) { return l.id === q; })) localStorage.setItem('ep_lang', q);
        var s = localStorage.getItem('ep_lang');
        if (LANGS.some(function (l) { return l.id === s; })) lang = s;
    } catch (e) { /* storage unavailable */ }

    var cfg = LANGS.filter(function (l) { return l.id === lang; })[0];
    window.epLang = lang;
    window.epLocale = cfg.locale;

    var root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', cfg.dir);

    var AR = /[؀-ۿ]/;
    var DIAC = /[ً-ٰٟـ]/g;       // tashkeel + tatweel
    var norm = function (t) { return t.replace(DIAC, '').replace(/\s+/g, ' ').trim(); };

    var idx = lang === 'ar' ? -1 : ['en', 'fr', 'es'].indexOf(lang);
    var exact = {}, parts = [];

    function build() {
        var d = window.EP_DICT || {};
        Object.keys(d).forEach(function (k) {
            var nk = norm(k), v = d[k][idx];
            if (!v) return;
            exact[nk] = v;
            // Short single words only match exactly (avoid mangling longer text).
            if (nk.length >= 12 || nk.indexOf(' ') > -1) parts.push([nk, v]);
        });
        parts.sort(function (a, b) { return b[0].length - a[0].length; });
    }

    var cache = {};
    function tr(text) {
        var n = norm(text);
        if (cache[n] !== undefined) return cache[n];
        var out = exact[n];
        if (out === undefined) {
            out = n;
            // m:s style durations from the dashboard timer
            out = out.replace(/(\d+)\s*د\s+(\d+)\s*ث/g, '$1m $2s').replace(/(\d+)\s*ث\b/g, '$1s');
            for (var i = 0; i < parts.length && AR.test(out); i++) {
                if (out.indexOf(parts[i][0]) > -1) out = out.split(parts[i][0]).join(parts[i][1]);
            }
        }
        cache[n] = out;
        return out;
    }
    window.epT = function (t) { return idx < 0 ? t : tr(t); };

    var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];

    function doText(node) {
        var v = node.nodeValue;
        if (!v || !AR.test(v)) return;
        var t = tr(v);
        if (t === norm(v) && AR.test(t)) return;        // untranslatable, leave
        var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
        var nv = lead + t + trail;
        if (nv !== v) node.nodeValue = nv;
    }
    function doEl(el) {
        for (var i = 0; i < ATTRS.length; i++) {
            var a = el.getAttribute && el.getAttribute(ATTRS[i]);
            if (a && AR.test(a)) { var t = tr(a); if (t !== a) el.setAttribute(ATTRS[i], t); }
        }
    }
    function walk(n) {
        if (n.nodeType === 3) { doText(n); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' && false) return;
        doEl(n);
        for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
        // <template> content (Alpine clones it later, we translate the clone then)
    }

    function revealSoon() {
        var h = document.getElementById('ep-hide');
        if (h) requestAnimationFrame(function () { requestAnimationFrame(function () { h.remove(); }); });
    }

    function start() {
        build();
        if (document.title) document.title = tr(document.title);
        walk(document.body);
        var mo = new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'characterData') doText(m.target);
                else if (m.type === 'attributes') doEl(m.target);
                else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
            }
        });
        mo.observe(document.body, { subtree: true, childList: true, characterData: true,
            attributes: true, attributeFilter: ATTRS });
        // Alpine renders after DOMContentLoaded; wait for it before unhiding.
        var done = false;
        var finish = function () { if (!done) { done = true; walk(document.body); revealSoon(); } };
        document.addEventListener('alpine:initialized', function () { setTimeout(finish, 60); });
        setTimeout(finish, 1500);
    }

    function widget() {
        var wrap = document.createElement('div');
        wrap.id = 'ep-lang';
        wrap.setAttribute('dir', 'ltr');
        wrap.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:60;font:500 13px/1 Cairo,system-ui,sans-serif;';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Language');
        btn.style.cssText = 'display:flex;align-items:center;gap:6px;padding:9px 13px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#fff;color:#0F172A;box-shadow:0 4px 14px rgba(0,0,0,.15);cursor:pointer;font:inherit;';
        btn.innerHTML = '<span style="font-size:15px">🌐</span><span>' + cfg.short + '</span>';
        var menu = document.createElement('div');
        menu.style.cssText = 'display:none;position:absolute;bottom:46px;left:0;min-width:140px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:6px;';
        LANGS.forEach(function (l) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = l.label;
            b.style.cssText = 'display:block;width:100%;text-align:start;padding:9px 12px;border:0;border-radius:9px;background:' + (l.id === lang ? '#EEF2FF' : 'transparent') + ';color:#0F172A;cursor:pointer;font:inherit;';
            b.onclick = function () {
                try { localStorage.setItem('ep_lang', l.id); } catch (e) { /* ignore */ }
                var u = new URL(location.href); u.searchParams.delete('lang');
                location.href = u.toString();
            };
            menu.appendChild(b);
        });
        btn.onclick = function (e) { e.stopPropagation(); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; };
        document.addEventListener('click', function () { menu.style.display = 'none'; });
        wrap.appendChild(menu); wrap.appendChild(btn);
        document.body.appendChild(wrap);
    }

    if (lang !== 'ar') {
        // Hide until translated to avoid a flash of Arabic.
        var st = document.createElement('style');
        st.id = 'ep-hide';
        st.textContent = 'body{visibility:hidden}';
        document.head.appendChild(st);
    }
    document.addEventListener('DOMContentLoaded', function () {
        widget();
        if (lang !== 'ar') start();
    });
})();
