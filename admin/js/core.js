/* Admin core: state, helpers, auth, shell, routing. */
(function () {
  "use strict";
  var CFG = window.HB_CONFIG || {};
  var A = window.A = { cfg: CFG, views: {}, state: { profile: null, tab: null, setupIssues: [] } };

  /* ---------- helpers ---------- */
  A.$ = function (s, r) { return (r || document).querySelector(s); };
  A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  A.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  A.money = function (n) { return Number(n || 0).toFixed(3); };
  A.cur = CFG.CURRENCY || "OMR";
  A.fmtTime = function (iso) { var d = new Date(iso); return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); };
  A.uid = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "id" + Date.now() + Math.random().toString(16).slice(2); };
  A.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };
  A.digits = function (p) { return String(p || "").replace(/[^\d]/g, ""); };
  A.waLink = function (phone, text) {
    var d = A.digits(phone); if (d.length === 8) d = "968" + d; if (d.indexOf("00") === 0) d = d.slice(2);
    return "https://wa.me/" + d + (text ? "?text=" + encodeURIComponent(text) : "");
  };

  var ICONS = {
    orders: '<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
    availability: '<rect x="3" y="8" width="18" height="8" rx="4"/><circle cx="8" cy="12" r="2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    insights: '<path d="M5 20v-8M12 20V4M19 20v-5"/>',
    photos: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-4-8 7"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.5M18 14.3c1.8.8 3 2.6 3 5.7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    up: '<path d="M6 14l6-6 6 6"/>', down: '<path d="M6 10l6 6 6-6"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.5 7.4A16 16 0 0 0 2 12s4 7 10 7a9 9 0 0 0 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', print: '<path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', chevron: '<path d="M6 9l6 6 6-6"/>',
    wa: '<path d="M4 20l1.4-4.6A8 8 0 1 1 8.7 18.7z"/>', phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>', bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4"/>', bellOff: '<path d="M3 3l18 18M6 17V11a6 6 0 0 1 1-3.3M18 11v6l1.5 2H9M10 21h4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>', dup: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>', undo: '<path d="M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>'
  };
  A.ico = function (n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || "") + "</svg>"; };

  /* ---------- toast ---------- */
  A.toast = function (msg, opts) {
    opts = opts || {};
    var el = document.createElement("div"); el.className = "toast" + (opts.err ? " err" : "");
    el.innerHTML = "<span>" + A.esc(msg) + "</span>";
    if (opts.action) { var b = document.createElement("button"); b.type = "button"; b.textContent = opts.action.label; b.onclick = function () { el.remove(); opts.action.fn(); }; el.appendChild(b); }
    A.$("#toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, opts.ms || (opts.action ? 8000 : opts.err ? 6000 : 3200));
  };

  /* Optimistic update: apply now, roll back and toast on failure. */
  A.optimistic = function (apply, rollback, remote, okMsg, opts) {
    apply();
    return Promise.resolve().then(remote).then(function (res) {
      if (res && res.error) throw res.error;
      if (okMsg) A.toast(okMsg, opts);
      return res;
    }).catch(function (e) {
      rollback(); A.toast("Failed: " + (e && e.message ? e.message : "could not save") + ". Change reverted.", { err: true }); return { error: e };
    });
  };

  /* ---------- dialogs ---------- */
  A.dialog = function (title, bodyHtml, footHtml, cls) {
    var d = document.createElement("dialog"); if (cls) d.className = cls;
    d.innerHTML = '<div class="dlg"><div class="dh"><h2>' + A.esc(title) + '</h2><button class="iconbtn" type="button" data-x aria-label="Close">' + A.ico("x") + '</button></div><div class="db">' + bodyHtml + "</div>" + (footHtml ? '<div class="df">' + footHtml + "</div>" : "") + "</div>";
    document.body.appendChild(d);
    d.querySelector("[data-x]").onclick = function () { d.close(); };
    d.addEventListener("close", function () { setTimeout(function () { d.remove(); }, 50); });
    d.addEventListener("click", function (e) { if (e.target === d) d.close(); });
    d.showModal(); return d;
  };
  A.confirm = function (title, text, okLabel) {
    return new Promise(function (res) {
      var d = A.dialog(title, "<p>" + A.esc(text) + "</p>", '<button class="btn ghost" data-no type="button">Cancel</button><button class="btn danger" data-ok type="button">' + A.esc(okLabel || "Confirm") + "</button>");
      var done = false;
      d.querySelector("[data-no]").onclick = function () { done = true; d.close(); res(false); };
      d.querySelector("[data-ok]").onclick = function () { done = true; d.close(); res(true); };
      d.addEventListener("close", function () { if (!done) res(false); });
    });
  };

  /* ---------- sound ---------- */
  var actx;
  A.sound = { muted: false };
  try { A.sound.muted = localStorage.getItem("hb_mute") === "1"; } catch (e) {}
  A.playAlert = function (kind) {
    kind = kind || A.alertKind || "chime"; if (kind === "none" || A.sound.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
      var seqs = { chime: [[880, 0, .18], [1320, .16, .32]], bell: [[660, 0, .5], [990, 0, .5], [1320, 0, .5]], soft: [[520, 0, .25], [660, .22, .3]] };
      (seqs[kind] || seqs.chime).forEach(function (n) {
        var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + n[1];
        o.type = "sine"; o.frequency.value = n[0]; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(.25, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + n[2] + .35);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + n[2] + .4);
      });
    } catch (e) {}
  };

  /* ---------- tabs ---------- */
  var TABS = [
    { id: "orders", label: "Orders", perm: "orders" },
    { id: "availability", label: "Availability", perm: "availability", onlyIfNo: "menu" },
    { id: "menu", label: "Menu", perm: "menu" },
    { id: "insights", label: "Insights", perm: "insights" },
    { id: "photos", label: "Photos", perm: "photos" },
    { id: "settings", label: "Settings", perm: "settings" },
    { id: "team", label: "Team", owner: true },
    { id: "account", label: "Account", always: true }
  ];
  A.can = function (p) { var pr = A.state.profile; return !!pr && pr.active !== false && (pr.role === "owner" || (pr.permissions && pr.permissions[p] === true)); };
  A.isOwner = function () { return A.state.profile && A.state.profile.role === "owner"; };
  function allowedTabs() {
    return TABS.filter(function (t) {
      if (t.always) return true; if (t.owner) return A.isOwner();
      if (t.onlyIfNo && A.can(t.onlyIfNo)) return false;
      return A.can(t.perm);
    });
  }

  /* ---------- boot / auth ---------- */
  var app;
  A.boot = function () {
    app = A.$("#app");
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_KEY) return screenMsg("Backend not connected yet", "Add the Supabase URL and publishable key to config.js, then run the three SQL files in /supabase. Until then the public site runs on its bundled defaults and the admin has nothing to sign in to.");
    if (!window.supabase || !window.supabase.createClient) return screenMsg("Could not load the sign-in library", "Check your connection and reload. If this keeps happening, the CDN script is blocked on this network.");
    A.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    A.sb.auth.onAuthStateChange(function (ev, session) {
      if (ev === "PASSWORD_RECOVERY") { renderRecovery(); return; }
      if (ev === "SIGNED_OUT") { A.state.profile = null; renderLogin(); }
    });
    A.sb.auth.getSession().then(function (r) {
      if (/type=recovery/.test(location.hash)) return renderRecovery();
      if (r && r.data && r.data.session) return afterLogin(); renderLogin();
    }).catch(function () { renderLogin(); });
    window.addEventListener("hashchange", route);
  };

  function screenMsg(t, p) { app.innerHTML = '<div class="login"><div class="card"><div class="brand-s">HALA BAJUNAID</div><h1>' + A.esc(t) + '</h1><p class="muted">' + A.esc(p) + "</p></div></div>"; }

  function renderLogin(msg) {
    app.innerHTML = '<div class="login"><div class="card"><div class="brand-s">HALA BAJUNAID</div><h1>Staff sign in</h1><p class="muted sm">Hala Bajunaid Boutique admin</p>' +
      '<form id="lf"><label class="f">Email<input name="email" type="email" autocomplete="username" required></label><label class="f">Password<input name="password" type="password" autocomplete="current-password" required></label>' +
      '<p class="sm" id="lerr" role="alert" style="color:var(--alert);min-height:1.2em">' + A.esc(msg || "") + '</p><button class="btn" type="submit">Sign in</button><button class="btn ghost" type="button" id="forgot">Forgot password</button></form></div></div>';
    A.$("#lf").onsubmit = function (e) {
      e.preventDefault(); var f = e.target, b = f.querySelector("button[type=submit]"); b.disabled = true;
      A.sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
        if (r.error) { A.$("#lerr").textContent = "Email or password is wrong."; b.disabled = false; return; }
        afterLogin();
      }).catch(function () { A.$("#lerr").textContent = "Could not reach the server."; b.disabled = false; });
    };
    A.$("#forgot").onclick = function () {
      var email = A.$("#lf").email.value.trim(); if (!email) { A.$("#lerr").textContent = "Type your email first, then press Forgot password."; return; }
      A.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) {
        A.$("#lerr").style.color = r.error ? "var(--alert)" : "var(--ink)";
        A.$("#lerr").textContent = r.error ? "Could not send the email." : "If that email has an account, a reset link is on its way.";
      });
    };
  }

  function renderRecovery() {
    app.innerHTML = '<div class="login"><div class="card"><div class="brand-s">HALA BAJUNAID</div><h1>Set a new password</h1><form id="rf"><label class="f">New password (8+ characters)<input name="p" type="password" minlength="8" autocomplete="new-password" required></label><p class="sm" id="rerr" style="color:var(--alert);min-height:1.2em"></p><button class="btn" type="submit">Save password</button></form></div></div>';
    A.$("#rf").onsubmit = function (e) { e.preventDefault(); A.sb.auth.updateUser({ password: e.target.p.value }).then(function (r) { if (r.error) { A.$("#rerr").textContent = r.error.message; return; } history.replaceState(null, "", location.pathname); A.toast("Password updated."); afterLogin(); }); };
  }

  function afterLogin() {
    A.sb.rpc("my_profile").then(function (r) {
      if (r.error) { A.state.setupIssues.push("002"); return screenSetup("The database setup is not finished", "Run these in the Supabase SQL Editor, in order: 001_schema.sql, 002_staff_permissions.sql, 003_user_management.sql. Then reload this page.", r.error.message); }
      var p = r.data;
      if (!p) return screenSetup("This account has no staff access", "Sign in with the owner account, or ask the owner to add you. If you are the owner and this is the first setup, run: select public.bootstrap_owner('your-email'); in the SQL Editor.", null, true);
      if (p.active === false) return screenSetup("This account is switched off", "Ask the owner to turn it back on.", null, true);
      A.state.profile = p; renderShell();
    }).catch(function (e) { screenSetup("Could not load your profile", e.message || "", null, true); });
  }
  function screenSetup(t, p, detail, signout) {
    app.innerHTML = '<div class="login"><div class="card"><div class="brand-s">HALA BAJUNAID</div><h1>' + A.esc(t) + '</h1><p class="muted">' + A.esc(p) + "</p>" + (detail ? '<p class="sm muted">Detail: ' + A.esc(detail) + "</p>" : "") + '<button class="btn ghost" id="so" style="margin-top:12px">Sign out</button></div></div>';
    A.$("#so").onclick = function () { A.sb.auth.signOut(); };
  }

  /* ---------- shell ---------- */
  function renderShell() {
    var tabs = allowedTabs(), pr = A.state.profile;
    var nav = tabs.map(function (t) { return '<button type="button" data-tab="' + t.id + '"><span class="ic">' + A.ico(t.id === "account" ? "logout" : t.id) + "</span><span>" + t.label + '</span><span class="dot hide" data-dot="' + t.id + '"></span></button>'; }).join("");
    app.innerHTML = '<div class="shell"><aside class="side"><div class="brand"><b>HALA BAJUNAID</b><i>STAFF ADMIN</i></div><nav aria-label="Sections">' + nav + '</nav><div class="who"><b>' + A.esc(pr.display_name || pr.email || "") + '</b><div class="muted">' + (pr.role === "owner" ? "Owner" : "Staff") + '</div></div></aside><main class="main" id="view"></main><nav class="bnav" aria-label="Sections">' + nav + "</nav></div>";
    A.$$("[data-tab]").forEach(function (b) { b.onclick = function () { location.hash = b.getAttribute("data-tab"); }; });
    A.loadAlertKind(); route();
  }
  A.loadAlertKind = function () {
    A.sb.from("settings").select("*").eq("key", "alert_sound").maybeSingle().then(function (r) { if (r && r.data) A.alertKind = r.data.value; });
  };
  function route() {
    if (!A.state.profile) return;
    var tabs = allowedTabs(), id = (location.hash || "").replace("#", "").split("?")[0];
    if (!tabs.some(function (t) { return t.id === id; })) id = tabs[0].id;
    if (A.state.tab && A.views[A.state.tab] && A.views[A.state.tab].leave) A.views[A.state.tab].leave();
    A.state.tab = id;
    A.$$("[data-tab]").forEach(function (b) { if (b.getAttribute("data-tab") === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var host = A.$("#view"); host.innerHTML = "";
    var v = A.views[id]; if (v) v.render(host); window.scrollTo(0, 0);
  }
  A.setDot = function (tab, n) { A.$$('[data-dot="' + tab + '"]').forEach(function (d) { d.textContent = n > 99 ? "99+" : n; d.classList.toggle("hide", !n); }); };
  A.topbar = function (title, actionsHtml) { return '<div class="topbar"><h1>' + A.esc(title) + '</h1><div class="row acts">' + (actionsHtml || "") + "</div></div>"; };
  A.setupNotice = function (what) { return '<div class="notice err"><b>' + A.esc(what) + "</b><br>This part of the database is not set up yet. Run the SQL files in /supabase in order (001, 002, 003) in the Supabase SQL Editor, then reload.</div>"; };
  A.signOut = function () { A.sb.auth.signOut(); };
  A.download = function (name, text, type) { var b = new Blob([text], { type: type || "text/plain" }), a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  A.copy = function (text) { return (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { A.toast("Copied."); }).catch(function () { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); A.toast("Copied."); } catch (e) { A.toast("Copy failed. Select the text and copy it.", { err: true }); } t.remove(); }); };
  A.genPassword = function () { var c = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789", a = new Uint32Array(14); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (n) { return c[n % c.length]; }).join(""); };
})();
