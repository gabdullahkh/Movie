// ==UserScript==
// @name         Panel for AsuraScan — Mobile Navigation
// @namespace    https://kh2030.vercel.app/
// @version      1.1.0
// @description  Two compact shortcuts without changing AsuraScan's own layout or login.
// @match        https://asurascans.com/*
// @match        https://www.asurascans.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
    'use strict';
    if (window.__panelAsuraV11) return;
    window.__panelAsuraV11 = true;

    // Remove navigation injected by the previous version, if present.
    document.getElementById('panel-asura-shortcuts')?.remove();
    document.getElementById('panel-asura-styles')?.remove();
    document.getElementById('panel-asura-mobile')?.remove();

    // Shadow DOM isolates these styles from the original AsuraScan website.
    // No site CSS, account credentials, session state, or page contents are modified.
    const root = document.createElement('div');
    root.id = 'panel-asura-mobile';
    root.style.cssText = 'all:initial;position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom, 0px));transform:translateX(-50%);z-index:2147483000;width:max-content;max-width:calc(100vw - 24px)';
    const shadow = root.attachShadow({mode:'open'});
    shadow.innerHTML = `
        <style>
            * { box-sizing:border-box; }
            .nav {
                display:flex;align-items:center;gap:5px;padding:6px;
                border:1px solid #58546d;border-radius:15px;
                background:rgba(17,20,31,.97);box-shadow:0 10px 30px #0008;
                font-family:-apple-system,BlinkMacSystemFont,sans-serif;
                -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
            }
            a {
                display:block;padding:12px 12px;text-decoration:none;
                color:#f6f3ff;background:#2c3043;border-radius:10px;
                font-size:12px;line-height:1.1;font-weight:750;white-space:nowrap;
            }
            a.active { background:#c5b6ff;color:#171324; }
            button {
                border:0;min-width:34px;padding:10px 7px;border-radius:9px;
                background:transparent;color:#ddd2ff;font-size:18px;
                font-weight:750;cursor:pointer;
            }
            .restore {
                background:#20243b;color:#e4dcff;
                border:1px solid #6f638a;border-radius:100px;
                padding:12px 18px;font-size:13px;
                box-shadow:0 8px 24px #0008;
                font-family:-apple-system,BlinkMacSystemFont,sans-serif;
            }
            [hidden] { display:none!important; }
            @media(max-width:370px) { a {padding:11px 7px;font-size:11px;} .nav {gap:3px;} }
        </style>
        <nav class="nav" aria-label="Panel quick navigation">
            <a href="/bookmarks/comics" id="continue">Continue Reading</a>
            <a href="/comics" id="latest">Trending / Latest</a>
            <button type="button" id="hide" aria-label="Minimize shortcuts">−</button>
        </nav>
        <button type="button" class="restore" id="show" hidden>Panel ✦</button>
    `;
    const current = location.pathname.replace(/\/$/,'');
    if (current === '/bookmarks/comics') shadow.querySelector('#continue').classList.add('active');
    if (current === '/comics') shadow.querySelector('#latest').classList.add('active');
    const nav = shadow.querySelector('.nav');
    const show = shadow.querySelector('#show');
    shadow.querySelector('#hide').addEventListener('click', () => { nav.hidden=true; show.hidden=false; });
    show.addEventListener('click', () => { show.hidden=true; nav.hidden=false; });
    document.body.appendChild(root);
})();
