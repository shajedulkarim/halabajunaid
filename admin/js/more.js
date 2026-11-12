/* Insights, Settings, Team, Account. */
(function () {
  "use strict";
  var A = window.A;
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var PERMS = [["orders", "Orders", "See and update orders"], ["availability", "Availability", "Mark items sold out or hidden"], ["menu", "Menu", "Add, edit, delete items and prices"], ["insights", "Insights", "Revenue and busy-hour reports"], ["photos", "Photos", "Upload and edit photos"], ["settings", "Settings", "Banner, hours, rating, backup"]];

  /* ---------- Insights ---------- */
  var I = { range: "7", from: "", to: "" };
  function rangeDates() {
    var now = new Date(), s = new Date(now), e = new Date(now); e.setHours(23, 59, 59, 999);
    if (I.range === "today") s.setHours(0, 0, 0, 0);
    else if (I.range === "month") { s = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (I.range === "custom") { s = I.from ? new Date(I.from + "T00:00:00") : new Date(now.getTime() - 7 * 864e5); e = I.to ? new Date(I.to + "T23:59:59") : e; }
    else { s = new Date(now.getTime() - (parseInt(I.range, 10) - 1) * 864e5); s.setHours(0, 0, 0, 0); }
    return [s, e];
  }
  function drawInsights(host, orders, rng) {
    var live = orders.filter(function (o) { return o.status !== "cancelled"; }), rev = live.reduce(function (a, o) { return a + Number(o.total); }, 0), cancelled = orders.length - live.length;
    var hours = new Array(24).fill(0), items = {}, byDay = {};
    live.forEach(function (o) {
      var d = new Date(o.created_at); hours[d.getHours()]++;
      var k = d.toISOString().slice(0, 10); byDay[k] = (byDay[k] || 0) + Number(o.total);
      (o.items || []).forEach(function (i) { var x = items[i.name_en] || (items[i.name_en] = { n: i.name_en, q: 0, r: 0 }); x.q += i.qty; x.r += i.qty * i.price; });
    });
    var maxH = Math.max.apply(null, hours.concat(1)), top = Object.keys(items).map(function (k) { return items[k]; }).sort(function (a, b) { return b.q - a.q; }).slice(0, 8);
    var days = [], cur = new Date(rng[0]); cur.setHours(12); var guard = 0; while (cur <= rng[1] && guard++ < 62) { var k = cur.toISOString().slice(0, 10); days.push([k, byDay[k] || 0]); cur = new Date(cur.getTime() + 864e5); }
    var maxD = Math.max.apply(null, days.map(function (d) { return d[1]; }).concat(1));
    var busy = hours.indexOf(Math.max.apply(null, hours));
    host.querySelector("#ires").innerHTML = '<div class="kpis"><div class="card kpi"><b>' + A.money(rev) + '</b><span>Revenue (' + A.cur + ')</span></div><div class="card kpi"><b>' + live.length + '</b><span>Orders' + (cancelled ? ", " + cancelled + " cancelled" : "") + '</span></div><div class="card kpi"><b>' + A.money(live.length ? rev / live.length : 0) + '</b><span>Average order</span></div><div class="card kpi"><b>' + (live.length ? ("0" + busy).slice(-2) + ":00" : "none") + '</b><span>Busiest hour</span></div></div>' +
      '<div class="two-col"><div class="card"><h2>Revenue by day</h2><div class="bars" role="img" aria-label="Revenue by day">' + days.map(function (d) { return '<div class="' + (d[1] ? "" : "zero") + '" style="height:' + Math.max(2, d[1] / maxD * 100) + '%" title="' + d[0] + ": " + A.money(d[1]) + '"></div>'; }).join("") + '</div><div class="axis"><span>' + (days[0] ? days[0][0] : "") + "</span><span>" + (days.length ? days[days.length - 1][0] : "") + '</span></div><hr><h2>Busy hours</h2><div class="bars" role="img" aria-label="Orders by hour of day">' + hours.map(function (h, i) { return '<div class="' + (h ? "" : "zero") + '" style="height:' + Math.max(2, h / maxH * 100) + '%" title="' + i + ":00 - " + h + ' orders"></div>'; }).join("") + '</div><div class="axis"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div></div>' +
      '<div class="card"><h2>Top items</h2>' + (top.length ? '<table class="t"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">' + A.cur + '</th></tr></thead><tbody>' + top.map(function (t) { return "<tr><td>" + A.esc(t.n) + '</td><td class="r">' + t.q + '</td><td class="r">' + A.money(t.r) + "</td></tr>"; }).join("") + "</tbody></table>" : '<div class="empty" style="margin-top:10px">No orders in this range.</div>') + "</div></div>";
  }
  A.views.insights = {
    render: function (host) {
      host.innerHTML = A.topbar("Insights") + '<div class="toolbar"><div class="chips" id="rchips"></div><div class="row hide" id="rcustom"><input type="date" id="rf" aria-label="From"><input type="date" id="rt" aria-label="To"></div></div><div id="ires"><div class="muted">Loading...</div></div>';
      function run() {
        var rows = [["today", "Today"], ["7", "7 days"], ["30", "30 days"], ["month", "This month"], ["custom", "Custom"]];
        host.querySelector("#rchips").innerHTML = rows.map(function (r) { return '<button class="chip" type="button" data-r="' + r[0] + '" aria-pressed="' + (I.range === r[0]) + '">' + r[1] + "</button>"; }).join("");
        host.querySelector("#rcustom").classList.toggle("hide", I.range !== "custom");
        host.querySelectorAll("[data-r]").forEach(function (b) { b.onclick = function () { I.range = b.getAttribute("data-r"); run(); }; });
        var rng = rangeDates();
        A.sb.from("orders").select("*").gte("created_at", rng[0].toISOString()).lte("created_at", rng[1].toISOString()).order("created_at", { ascending: true }).limit(5000).then(function (r) {
          if (r.error) { host.querySelector("#ires").innerHTML = '<div class="notice err">Could not load: ' + A.esc(r.error.message) + "</div>"; return; } drawInsights(host, r.data, rng);
        });
      }
      host.querySelector("#rf").onchange = function (e) { I.from = e.target.value; run(); }; host.querySelector("#rt").onchange = function (e) { I.to = e.target.value; run(); };
      run();
    }
  };

  /* ---------- Password card (Settings + Account) ---------- */
  function passwordCard() {
    return '<section class="card sec"><h2>Change my password</h2><form class="field-row" data-pw><label class="f">New password (8+ characters)<input name="p" type="password" minlength="8" autocomplete="new-password" required></label><label class="f">Repeat it<input name="p2" type="password" minlength="8" autocomplete="new-password" required></label><div><button class="btn" type="submit">Update password</button></div></form></section>';
  }
  function bindPassword(host) {
    var f = host.querySelector("[data-pw]"); if (!f) return;
    f.onsubmit = function (e) {
      e.preventDefault(); if (f.p.value !== f.p2.value) return A.toast("The two passwords do not match.", { err: true });
      A.sb.auth.updateUser({ password: f.p.value }).then(function (r) { if (r.error) return A.toast("Failed: " + r.error.message, { err: true }); f.reset(); A.toast("Password updated."); });
    };
  }

  /* ---------- Settings ---------- */
  function saveSetting(key, value, okMsg, applyLocal, rollback) {
    return A.optimistic(applyLocal || function () {}, rollback || function () {}, function () { return A.sb.from("settings").upsert({ key: key, value: value, updated_at: new Date().toISOString() }); }, okMsg);
  }
  A.views.settings = {
    render: function (host) {
      host.innerHTML = A.topbar("Settings") + '<div class="muted" id="sload">Loading settings...</div>';
      A.sb.from("settings").select("*").then(function (r) {
        if (r.error) { host.innerHTML = A.topbar("Settings") + '<div class="notice err">Could not load settings: ' + A.esc(r.error.message) + "</div>"; return; }
        var S = {}; r.data.forEach(function (x) { S[x.key] = x.value; });
        var ban = S.banner || { enabled: false, text_en: "", text_ar: "" }, hrs = S.hours || [0, 1, 2, 3, 4, 5, 6].map(function (d) { return { day: d, open: "10:00", close: "22:00", closed: false }; }), rate = S.rating || { value: 0, count: 0, show: false }, snd = S.alert_sound || "chime";
        host.innerHTML = A.topbar("Settings") + '<div class="sec cols"><div class="sec">' +
          '<section class="card sec"><h2>Announcement banner</h2><p class="muted sm">A thin bar above the site header. Leave off when there is nothing to announce.</p><form id="fb" class="field-row"><label class="chk"><input type="checkbox" name="enabled"' + (ban.enabled ? " checked" : "") + '> Show the banner</label><label class="f">Text (English)<input name="en" value="' + A.esc(ban.text_en) + '" maxlength="140"></label><label class="f">Text (Arabic)<input name="ar" dir="rtl" value="' + A.esc(ban.text_ar) + '" maxlength="140"></label><div><button class="btn" type="submit">Save banner</button></div></form></section>' +
          '<section class="card sec"><h2>Opening hours</h2><form id="fh" class="hours-ed">' + [6, 0, 1, 2, 3, 4, 5].map(function (d) { var h = hrs.filter(function (x) { return x.day === d; })[0] || { day: d, open: "10:00", close: "22:00", closed: false }; return '<div class="hr" data-d="' + d + '"><b>' + DAYS[d] + '</b><input type="time" name="o' + d + '" value="' + h.open + '" aria-label="' + DAYS[d] + ' opens"><input type="time" name="c' + d + '" value="' + h.close + '" aria-label="' + DAYS[d] + ' closes"><label class="chk"><input type="checkbox" name="x' + d + '"' + (h.closed ? " checked" : "") + '> Closed</label></div>'; }).join("") + '<div><button class="btn" type="submit">Save hours</button></div></form></section>' +
          '</div><div class="sec">' +
          '<section class="card sec"><h2>Rating</h2><form id="fr" class="field-row"><div class="field-row two"><label class="f">Rating (0 to 5)<input name="v" type="number" min="0" max="5" step="0.1" value="' + rate.value + '"></label><label class="f">Number of reviews<input name="n" type="number" min="0" step="1" value="' + rate.count + '"></label></div><label class="chk"><input type="checkbox" name="show"' + (rate.show ? " checked" : "") + '> Show on the site</label><div><button class="btn" type="submit">Save rating</button></div></form></section>' +
          '<section class="card sec"><h2>New order alert sound</h2><form id="fs" class="row wrap-row"><select name="s" style="max-width:220px" aria-label="Alert sound">' + [["chime", "Chime"], ["bell", "Bell"], ["soft", "Soft"], ["none", "No sound"]].map(function (o) { return '<option value="' + o[0] + '"' + (snd === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + '</select><button class="btn ghost" type="button" id="stest">Play</button><button class="btn" type="submit">Save</button></form></section>' +
          passwordCard() +
          '<section class="card sec"><h2>Backup</h2><p class="muted sm">Downloads menu, sections, photos list, settings' + (A.can("orders") ? " and orders" : "") + ' as one JSON file. Photo files stay in storage.</p><div><button class="btn ghost" id="bk">' + A.ico("download") + "Download backup</button></div></section></div></div>";
        bindPassword(host);
        host.querySelector("#fb").onsubmit = function (e) { e.preventDefault(); var f = e.target; saveSetting("banner", { enabled: f.enabled.checked, text_en: f.en.value.trim(), text_ar: f.ar.value.trim() }, "Banner saved."); };
        host.querySelector("#fh").onsubmit = function (e) { e.preventDefault(); var f = e.target, v = [0, 1, 2, 3, 4, 5, 6].map(function (d) { return { day: d, open: f["o" + d].value, close: f["c" + d].value, closed: f["x" + d].checked }; }); saveSetting("hours", v, "Opening hours saved."); };
        host.querySelector("#fr").onsubmit = function (e) { e.preventDefault(); var f = e.target; saveSetting("rating", { value: Math.min(5, Math.max(0, parseFloat(f.v.value) || 0)), count: parseInt(f.n.value, 10) || 0, show: f.show.checked }, "Rating saved."); };
        host.querySelector("#fs").onsubmit = function (e) { e.preventDefault(); var v = e.target.s.value; saveSetting("alert_sound", v, "Alert sound saved.", function () { A.alertKind = v; }); };
        host.querySelector("#stest").onclick = function () { A.playAlert(host.querySelector("#fs").s.value); };
        host.querySelector("#bk").onclick = function () {
          var tables = ["categories", "menu_items", "photos", "settings"].concat(A.can("orders") ? ["orders"] : []), out = { exported_at: new Date().toISOString() };
          Promise.all(tables.map(function (t) { return A.sb.from(t).select("*").then(function (x) { if (x.error) throw x.error; out[t] = x.data; }); })).then(function () {
            A.download("hala-bajunaid-backup-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(out, null, 2), "application/json"); A.toast("Backup downloaded.");
          }).catch(function (e) { A.toast("Backup failed: " + e.message, { err: true }); });
        };
      });
    }
  };

  /* ---------- Account ---------- */
  A.views.account = {
    render: function (host) {
      var p = A.state.profile;
      host.innerHTML = A.topbar("Account") + '<div class="sec cols"><section class="card sec"><h2>' + A.esc(p.display_name || "Signed in") + '</h2><p class="muted">' + A.esc(p.email || "") + " &middot; " + (p.role === "owner" ? "Owner" : "Staff") + '</p><div class="chips">' + PERMS.filter(function (x) { return A.can(x[0]); }).map(function (x) { return '<span class="tag">' + x[1] + "</span>"; }).join("") + '</div><div><button class="btn ghost" id="so">' + A.ico("logout") + "Sign out</button></div></section>" + passwordCard() + "</div>";
      host.querySelector("#so").onclick = A.signOut; bindPassword(host);
    }
  };

  /* ---------- Team (owner) ---------- */
  var T = { staff: [], host: null };
  function drawTeam() {
    var h = T.host; if (!h) return;
    h.querySelector("#tlist").innerHTML = T.staff.length ? '<div class="grid orders">' + T.staff.map(function (s) {
      var perms = s.role === "owner" ? '<span class="tag">All access</span>' : PERMS.filter(function (x) { return s.permissions && s.permissions[x[0]]; }).map(function (x) { return '<span class="tag">' + x[1] + "</span>"; }).join(" ") || '<span class="muted sm">No permissions</span>';
      return '<article class="card"><div class="row"><b>' + A.esc(s.display_name || s.email) + '</b><span class="tag' + (s.active ? "" : " warn") + '">' + (s.role === "owner" ? "Owner" : s.active ? "Active" : "Switched off") + '</span></div><div class="muted sm" style="margin:2px 0 10px">' + A.esc(s.email || "") + '</div><div class="chips" style="margin-bottom:12px">' + perms + "</div>" + (s.role === "owner" ? "" : '<div class="row wrap-row"><button class="btn ghost sm" data-e="' + s.user_id + '">Edit access</button><button class="btn ghost sm" data-pw="' + s.user_id + '">New password</button><button class="btn danger sm" data-d="' + s.user_id + '">Remove</button></div>') + "</article>";
    }).join("") + "</div>" : '<div class="empty"><b>No team members yet</b>Add one to give them access.</div>';
    h.querySelectorAll("[data-e]").forEach(function (b) { b.onclick = function () { editDialog(find(b.getAttribute("data-e"))); }; });
    h.querySelectorAll("[data-pw]").forEach(function (b) { b.onclick = function () { resetDialog(find(b.getAttribute("data-pw"))); }; });
    h.querySelectorAll("[data-d]").forEach(function (b) { b.onclick = function () { var s = find(b.getAttribute("data-d")); A.confirm("Remove " + (s.display_name || s.email) + "?", "They lose access immediately. This deletes their login and cannot be undone.", "Remove").then(function (ok) { if (!ok) return; var i = T.staff.indexOf(s); A.optimistic(function () { T.staff.splice(i, 1); drawTeam(); }, function () { T.staff.splice(i, 0, s); drawTeam(); }, function () { return A.sb.rpc("admin_delete_user", { p_user: s.user_id }); }, "Removed."); }); }; });
  }
  function find(id) { return T.staff.filter(function (s) { return s.user_id === id; })[0]; }
  function permBoxes(cur) { return '<div class="perm-grid">' + PERMS.map(function (x) { return '<label class="chk"><input type="checkbox" name="' + x[0] + '"' + (cur && cur[x[0]] ? " checked" : "") + '><span><b>' + x[1] + '</b> <span class="muted sm">' + x[2] + "</span></span></label>"; }).join("") + "</div>"; }
  function readPerms(f) { var o = {}; PERMS.forEach(function (x) { o[x[0]] = !!f[x[0]].checked; }); return o; }
  function credBlock(email, pw) { return "Hala Bajunaid Boutique, staff admin\nAddress: " + location.origin + location.pathname + "\nEmail: " + email + "\nPassword: " + pw; }

  function addDialog() {
    var pw = A.genPassword();
    var d = A.dialog("Add team member", '<form id="af" class="field-row"><div class="field-row two"><label class="f">Name<input name="name" required></label><label class="f">Email<input name="email" type="email" required autocomplete="off"></label></div><label class="f">Password (generated, you can change it)<div class="row"><input name="pw" value="' + pw + '" minlength="8" required style="font-family:ui-monospace,Menlo,monospace"><button class="btn ghost sm" type="button" id="regen">New</button></div></label><div><b>Can use</b></div>' + permBoxes({ orders: true, availability: true }) + "</form>",
      '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="acreate">Create user</button>');
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    d.querySelector("#regen").onclick = function () { d.querySelector("[name=pw]").value = A.genPassword(); };
    d.querySelector("#acreate").onclick = function () {
      var f = d.querySelector("#af"); if (!f.reportValidity()) return; var btn = this; btn.disabled = true;
      var email = f.email.value.trim().toLowerCase(), pass = f.pw.value;
      A.sb.rpc("admin_create_user", { p_email: email, p_password: pass, p_name: f.name.value.trim(), p_permissions: readPerms(f) }).then(function (r) {
        if (r.error) { btn.disabled = false; return A.toast("Could not create the user: " + r.error.message, { err: true }); }
        d.close(); showCreds("User created. Share these details now: the password is not shown again.", email, pass); loadTeam();
      });
    };
  }
  function showCreds(title, email, pw) {
    var text = credBlock(email, pw);
    var d = A.dialog(title, '<div class="cred" id="ctext">' + A.esc(text) + "</div>", '<button class="btn ghost" type="button" data-x2>Close</button><button class="btn" type="button" id="ccopy">' + A.ico("copy") + "Copy details</button>");
    d.querySelector("[data-x2]").onclick = function () { d.close(); }; d.querySelector("#ccopy").onclick = function () { A.copy(text); };
  }
  function editDialog(s) {
    var d = A.dialog("Edit access: " + (s.display_name || s.email), '<form id="ef" class="field-row"><label class="f">Name<input name="name" value="' + A.esc(s.display_name) + '"></label><label class="chk"><input type="checkbox" name="active"' + (s.active ? " checked" : "") + "> Account is active</label>" + permBoxes(s.permissions) + "</form>",
      '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="esave">Save</button>');
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    d.querySelector("#esave").onclick = function () {
      var f = d.querySelector("#ef"), patch = { display_name: f.name.value.trim(), permissions: readPerms(f), active: f.active.checked }, snap = Object.assign({}, s); d.close();
      A.optimistic(function () { Object.assign(s, patch); drawTeam(); }, function () { Object.assign(s, snap); drawTeam(); }, function () { return A.sb.rpc("admin_update_staff", { p_user: s.user_id, p_name: patch.display_name, p_permissions: patch.permissions, p_active: patch.active }); }, "Access saved.");
    };
  }
  function resetDialog(s) {
    var pw = A.genPassword();
    var d = A.dialog("New password for " + (s.display_name || s.email), '<label class="f">Password<div class="row"><input id="np" value="' + pw + '" minlength="8" style="font-family:ui-monospace,Menlo,monospace"><button class="btn ghost sm" type="button" id="regen">New</button></div></label>', '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="rset">Set password</button>');
    d.querySelector("[data-x2]").onclick = function () { d.close(); }; d.querySelector("#regen").onclick = function () { d.querySelector("#np").value = A.genPassword(); };
    d.querySelector("#rset").onclick = function () {
      var p = d.querySelector("#np").value; if (p.length < 8) return A.toast("Use at least 8 characters.", { err: true });
      A.sb.rpc("admin_set_password", { p_user: s.user_id, p_password: p }).then(function (r) { if (r.error) return A.toast("Failed: " + r.error.message, { err: true }); d.close(); showCreds("Password changed. Share these details.", s.email, p); });
    };
  }
  function loadTeam() {
    return A.sb.rpc("admin_list_staff").then(function (r) {
      if (r.error) { T.host.querySelector("#tlist").innerHTML = /function|schema cache|PGRST202/i.test(r.error.message || "") ? A.setupNotice("User management is not set up (003_user_management.sql).") : '<div class="notice err">' + A.esc(r.error.message) + "</div>"; return; }
      T.staff = r.data; drawTeam();
    });
  }
  A.views.team = {
    render: function (host) {
      T.host = host;
      host.innerHTML = A.topbar("Team", '<button class="btn sm" id="tadd">' + A.ico("plus") + "Add team member</button>") + '<p class="muted" style="margin-top:-8px">Create a login for each person and choose what they can do. Permissions are enforced by the database, not only hidden in the menu.</p><div id="tlist"><div class="muted">Loading...</div></div>';
      host.querySelector("#tadd").onclick = addDialog; loadTeam();
    }
  };
})();
