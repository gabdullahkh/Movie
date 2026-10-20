// ==UserScript==
// @name         Panel for AsuraScan — Authenticated Layout
// @namespace    https://kh2030.vercel.app/
// @version      1.0.0
// @description  Visual redesign on AsuraScan itself, keeping the site's own Google login, bookmarks, and subscription access.
// @match        https://asurascans.com/*
// @match        https://www.asurascans.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    if (window.__panelAsuraInstalled) return;
    window.__panelAsuraInstalled = true;

    // The script never reads, copies, or transmits cookies, passwords, tokens, or page content.
    // Authentication, bookmark access, premium entitlements, and chapter requests stay
    // entirely with the original asurascans.com website.
    const css = `
        :root { color-scheme: dark; }
        html { scroll-behavior: smooth; }
        body {
            background: #0b0e15 !important;
            color: #f2f4fa !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }
        main { max-width: 1450px; margin-left: auto; margin-right: auto; }
        a { -webkit-tap-highlight-color: transparent; }
        a[href*="/comics/"] img {
            border-radius: 12px !important;
            object-fit: cover !important;
            transition: transform .18s ease;
        }
        a[href*="/comics/"]:hover img { transform: scale(1.025); }
        [class*="card"], [class*="Card"] {
            border-radius: 12px !important;
        }
        button, select, input {
            font: inherit;
        }
        input, select {
            border-radius: 9px !important;
        }
        #panel-asura-shortcuts {
            position: sticky;
            top: 0;
            z-index: 999;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            width: 100%;
            padding: 10px max(12px, env(safe-area-inset-left));
            background: rgba(12, 16, 26, .96);
            border-bottom: 1px solid #3b4357;
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            scrollbar-width: none;
        }
        #panel-asura-shortcuts a {
            color: #e9eafa !important;
            text-decoration: none !important;
            font-size: 13px !important;
            font-weight: 650 !important;
            line-height: 1.2 !important;
            padding: 11px 15px !important;
            border-radius: 10px !important;
            white-space: nowrap !important;
            background: #222b3d !important;
            border: 1px solid #39445c !important;
        }
        #panel-asura-shortcuts a[aria-current="page"] {
            color: #161324 !important;
            background: #c3b3ff !important;
            border-color: #c3b3ff !important;
        }
        #panel-asura-shortcuts .panel-label {
            color: #c3b3ff;
            font-weight: 900;
            font-size: 15px;
            letter-spacing: -0.3px;
            flex: 0 0 auto;
        }
        @media (max-width: 600px) {
            body { overflow-x: hidden !important; }
            #panel-asura-shortcuts { gap: 7px; padding: 9px 11px; }
            #panel-asura-shortcuts .panel-label { font-size: 13px; }
            #panel-asura-shortcuts a { padding: 10px 11px !important; font-size: 12px !important; }
            a[href*="/comics/"] { min-width: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            a[href*="/comics/"] img { transition: none; }
        }
    `;

    const style = document.createElement('style');
    style.id = 'panel-asura-styles';
    style.textContent = css;
    document.head.appendChild(style);

    const nav = document.createElement('nav');
    nav.id = 'panel-asura-shortcuts';
    nav.setAttribute('aria-label', 'Panel quick navigation');
    const label = document.createElement('span');
    label.className = 'panel-label';
    label.textContent = 'PANEL ✦';
    nav.appendChild(label);

    const links = [
        ['Continue Reading', '/bookmarks/comics'],
        ['Trending / Latest', '/comics']
    ];

    for (const [name, path] of links) {
        const link = document.createElement('a');
        link.href = path;
        link.textContent = name;
        if (location.pathname === path) link.setAttribute('aria-current', 'page');
        nav.appendChild(link);
    }

    // Do not move or replace AsuraScan's own login or chapter content.
    document.body.prepend(nav);
})();
