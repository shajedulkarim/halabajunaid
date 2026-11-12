/* Menu / catalogue + quick availability view. */
(function () {
  "use strict";
  var A = window.A;
  var M = { cats: [], items: [], q: "", flt: "all", closed: {}, host: null };

  function load() {
    return Promise.all([A.sb.from("categories").select("*").order("sort"), A.sb.from("menu_items").select("*").order("sort")]).then(function (r) {
      if (r[0].error || r[1].error) throw (r[0].error || r[1].error);
      M.cats = r[0].data; M.items = r[1].data;
    });
  }
  function catItems(cid) { return M.items.filter(function (i) { return i.category_id === cid; }).sort(function (a, b) { return a.sort - b.sort; }); }
  function itemById(id) { return M.items.filter(function (i) { return i.id === id; })[0]; }
  function matches(i) {
    var q = M.q.trim().toLowerCase();
    if (M.flt === "hidden" && !i.hidden) return false; if (M.flt === "sold" && !i.sold_out) return false; if (M.flt === "visible" && (i.hidden || i.sold_out)) return false;
    return !q || (i.name_en + " " + i.name_ar + " " + i.desc_en).toLowerCase().indexOf(q) > -1;
  }
  function thumb(i) { return i.photo_url ? '<img class="th" loading="lazy" alt="" src="' + A.esc(i.photo_url) + '">' : '<div class="th"></div>'; }

  /* ---------- Menu view ---------- */
  function drawMenu() {
    var host = M.host; if (!host) return;
    var n = { all: M.items.length, visible: 0, hidden: 0, sold: 0 };
    M.items.forEach(function (i) { if (i.hidden) n.hidden++; if (i.sold_out) n.sold++; if (!i.hidden && !i.sold_out) n.visible++; });
    host.querySelector("#mchips").innerHTML = [["all", "All"], ["visible", "On sale"], ["sold", "Sold out"], ["hidden", "Hidden"]].map(function (x) { return '<button type="button" class="chip" aria-pressed="' + (M.flt === x[0]) + '" data-f="' + x[0] + '">' + x[1] + '<span class="n">' + n[x[0]] + "</span></button>"; }).join("");
    var out = "", any = false;
    M.cats.slice().sort(function (a, b) { return a.sort - b.sort; }).forEach(function (c, ci, arr) {
      var all = catItems(c.id), list = all.filter(matches);
      if ((M.q || M.flt !== "all") && !list.length) return;
      any = true;
      out += '<section class="card cat' + (M.closed[c.id] ? " closed" : "") + '" data-cat="' + c.id + '"><header><button class="h" type="button" data-toggle="' + c.id + '" aria-expanded="' + !M.closed[c.id] + '"><span class="caret">' + A.ico("chevron") + "</span>" + A.esc(c.name_en) + (c.name_ar ? ' <span class="muted sm">' + A.esc(c.name_ar) + "</span>" : "") + '<span class="tag">' + all.length + "</span>" + (c.hidden ? '<span class="tag warn">Hidden</span>' : "") + "</button>" +
        '<button class="iconbtn" data-cup="' + c.id + '" aria-label="Move section up"' + (ci === 0 ? " disabled" : "") + ">" + A.ico("up") + '</button><button class="iconbtn" data-cdown="' + c.id + '" aria-label="Move section down"' + (ci === arr.length - 1 ? " disabled" : "") + ">" + A.ico("down") + '</button><button class="iconbtn" data-cedit="' + c.id + '" aria-label="Edit section">' + A.ico("edit") + '</button><button class="btn sm" data-add="' + c.id + '">' + A.ico("plus") + "Item</button></header>" +
        '<div class="items items-grid">' + (list.length ? list.map(function (i, idx) { return itemRow(i, idx, list.length, !(M.q || M.flt !== "all")); }).join("") : '<div class="empty" style="margin:12px;border:0">No items in this section yet.</div>') + "</div></section>";
    });
    host.querySelector("#mlist").innerHTML = any ? out : '<div class="empty"><b>' + (M.cats.length ? "Nothing matches" : "The menu is empty") + "</b>" + (M.cats.length ? "Clear the search or filter." : "Add a section first, then add items to it.") + "</div>";
    bindMenu();
  }

  function itemRow(i, idx, len, canMove) {
    return '<div class="irow' + (i.hidden ? " is-hidden" : "") + '" data-item="' + i.id + '">' + thumb(i) + '<div><div class="name">' + A.esc(i.name_en) + '</div><div class="muted sm"><span class="num">' + A.money(i.price) + " " + A.cur + "</span> " + (i.name_ar ? "&middot; " + A.esc(i.name_ar) : "") + "</div>" + (i.sold_out ? '<span class="tag warn">Sold out</span> ' : "") + (i.hidden ? '<span class="tag">Hidden</span>' : "") + '</div><div class="acts">' +
      (canMove ? '<button class="iconbtn" data-up="' + i.id + '" aria-label="Move up"' + (idx === 0 ? " disabled" : "") + ">" + A.ico("up") + '</button><button class="iconbtn" data-down="' + i.id + '" aria-label="Move down"' + (idx === len - 1 ? " disabled" : "") + ">" + A.ico("down") + "</button>" : "") +
      '<button class="iconbtn' + (i.sold_out ? " on" : "") + '" data-sold="' + i.id + '" aria-label="Toggle sold out" aria-pressed="' + i.sold_out + '" title="Sold out">' + A.ico("tag") + '</button><button class="iconbtn' + (i.hidden ? " on" : "") + '" data-hide="' + i.id + '" aria-label="Toggle hidden" aria-pressed="' + i.hidden + '" title="Hide from site">' + A.ico(i.hidden ? "eyeoff" : "eye") + '</button><button class="iconbtn" data-dup="' + i.id + '" aria-label="Duplicate" title="Duplicate">' + A.ico("dup") + '</button><button class="iconbtn" data-edit="' + i.id + '" aria-label="Edit" title="Edit">' + A.ico("edit") + '</button><button class="iconbtn" data-del="' + i.id + '" aria-label="Delete" title="Delete">' + A.ico("trash") + "</button></div></div>";
  }

  function bindMenu() {
    var h = M.host;
    h.querySelectorAll("[data-f]").forEach(function (b) { b.onclick = function () { M.flt = b.getAttribute("data-f"); drawMenu(); }; });
    h.querySelectorAll("[data-toggle]").forEach(function (b) { b.onclick = function () { var id = b.getAttribute("data-toggle"); M.closed[id] = !M.closed[id]; drawMenu(); }; });
    h.querySelectorAll("[data-add]").forEach(function (b) { b.onclick = function () { itemDialog(null, b.getAttribute("data-add")); }; });
    h.querySelectorAll("[data-edit]").forEach(function (b) { b.onclick = function () { itemDialog(itemById(b.getAttribute("data-edit"))); }; });
    h.querySelectorAll("[data-sold]").forEach(function (b) { b.onclick = function () { var i = itemById(b.getAttribute("data-sold")); setFlag(i, "sold_out", !i.sold_out); }; });
    h.querySelectorAll("[data-hide]").forEach(function (b) { b.onclick = function () { var i = itemById(b.getAttribute("data-hide")); setFlag(i, "hidden", !i.hidden); }; });
    h.querySelectorAll("[data-dup]").forEach(function (b) { b.onclick = function () { dup(itemById(b.getAttribute("data-dup"))); }; });
    h.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { del(itemById(b.getAttribute("data-del"))); }; });
    h.querySelectorAll("[data-up]").forEach(function (b) { b.onclick = function () { move(itemById(b.getAttribute("data-up")), -1); }; });
    h.querySelectorAll("[data-down]").forEach(function (b) { b.onclick = function () { move(itemById(b.getAttribute("data-down")), 1); }; });
    h.querySelectorAll("[data-cup]").forEach(function (b) { b.onclick = function () { moveCat(b.getAttribute("data-cup"), -1); }; });
    h.querySelectorAll("[data-cdown]").forEach(function (b) { b.onclick = function () { moveCat(b.getAttribute("data-cdown"), 1); }; });
    h.querySelectorAll("[data-cedit]").forEach(function (b) { b.onclick = function () { catDialog(M.cats.filter(function (c) { return c.id === b.getAttribute("data-cedit"); })[0]); }; });
  }

  function setFlag(i, key, val) {
    var prev = i[key];
    A.optimistic(function () { i[key] = val; redraw(); }, function () { i[key] = prev; redraw(); },
      function () { var p = {}; p[key] = val; return A.sb.from("menu_items").update(p).eq("id", i.id); }, i.name_en + ": " + (key === "sold_out" ? (val ? "marked sold out" : "back in stock") : (val ? "hidden from site" : "shown on site")) + ".");
  }
  function redraw() { if (A.state.tab === "menu") drawMenu(); else drawAvail(); }

  function reindex(cid, order) {
    var changes = [];
    order.forEach(function (it, idx) { if (it.sort !== idx + 1) { changes.push({ it: it, from: it.sort, to: idx + 1 }); } });
    return changes;
  }
  function move(i, dir) {
    var list = catItems(i.category_id), idx = list.indexOf(i), j = idx + dir; if (j < 0 || j >= list.length) return;
    var order = list.slice(); order.splice(idx, 1); order.splice(j, 0, i);
    var ch = reindex(i.category_id, order);
    A.optimistic(function () { ch.forEach(function (c) { c.it.sort = c.to; }); drawMenu(); }, function () { ch.forEach(function (c) { c.it.sort = c.from; }); drawMenu(); },
      function () { return Promise.all(ch.map(function (c) { return A.sb.from("menu_items").update({ sort: c.to }).eq("id", c.it.id); })).then(function (rs) { var e = rs.filter(function (r) { return r.error; })[0]; return e || {}; }); });
  }
  function moveCat(id, dir) {
    var list = M.cats.slice().sort(function (a, b) { return a.sort - b.sort; }), c = list.filter(function (x) { return x.id === id; })[0], idx = list.indexOf(c), j = idx + dir; if (j < 0 || j >= list.length) return;
    list.splice(idx, 1); list.splice(j, 0, c);
    var ch = []; list.forEach(function (x, k) { if (x.sort !== k + 1) ch.push({ it: x, from: x.sort, to: k + 1 }); });
    A.optimistic(function () { ch.forEach(function (x) { x.it.sort = x.to; }); drawMenu(); }, function () { ch.forEach(function (x) { x.it.sort = x.from; }); drawMenu(); },
      function () { return Promise.all(ch.map(function (x) { return A.sb.from("categories").update({ sort: x.to }).eq("id", x.it.id); })).then(function (rs) { return rs.filter(function (r) { return r.error; })[0] || {}; }); });
  }

  function dup(i) {
    var copy = Object.assign({}, i, { id: A.uid(), name_en: i.name_en + " (copy)", sort: catItems(i.category_id).length + 1, created_at: undefined }); delete copy.created_at;
    A.optimistic(function () { M.items.push(copy); drawMenu(); }, function () { M.items.splice(M.items.indexOf(copy), 1); drawMenu(); },
      function () { return A.sb.from("menu_items").insert(copy); }, "Duplicated. Edit the copy to rename it.");
  }

  function del(i) {
    A.confirm("Delete " + i.name_en + "?", "It disappears from the website. You can undo right after.", "Delete").then(function (ok) {
      if (!ok) return; var idx = M.items.indexOf(i);
      A.optimistic(function () { M.items.splice(idx, 1); drawMenu(); }, function () { M.items.splice(idx, 0, i); drawMenu(); },
        function () { return A.sb.from("menu_items").delete().eq("id", i.id); }, "Deleted " + i.name_en + ".",
        { action: { label: "Undo", fn: function () { A.optimistic(function () { M.items.push(i); drawMenu(); }, function () { M.items.splice(M.items.indexOf(i), 1); drawMenu(); }, function () { return A.sb.from("menu_items").insert(i); }, "Restored " + i.name_en + "."); } } });
    });
  }

  /* ---------- dialogs ---------- */
  function itemDialog(item, cid) {
    var isNew = !item; item = item || { id: A.uid(), category_id: cid, name_en: "", name_ar: "", desc_en: "", desc_ar: "", price: 0, photo_url: null, hidden: false, sold_out: false };
    var opts = M.cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === item.category_id ? " selected" : "") + ">" + A.esc(c.name_en) + "</option>"; }).join("");
    var d = A.dialog(isNew ? "Add item" : "Edit item",
      '<form id="if" class="field-row"><div class="field-row two"><label class="f">Name (English)<input name="name_en" required value="' + A.esc(item.name_en) + '"></label><label class="f">Name (Arabic)<input name="name_ar" dir="rtl" value="' + A.esc(item.name_ar) + '"></label></div>' +
      '<div class="field-row two"><label class="f">Description (English)<textarea name="desc_en">' + A.esc(item.desc_en) + '</textarea></label><label class="f">Description (Arabic)<textarea name="desc_ar" dir="rtl">' + A.esc(item.desc_ar) + "</textarea></label></div>" +
      '<div class="field-row two"><label class="f">Price (' + A.cur + ')<input name="price" type="number" min="0" step="0.001" required value="' + item.price + '"></label><label class="f">Section<select name="category_id">' + opts + "</select></label></div>" +
      '<div class="row wrap-row"><img id="ipv" class="th" style="width:64px;height:80px;object-fit:cover;background:var(--sand-3)" alt="" ' + (item.photo_url ? 'src="' + A.esc(item.photo_url) + '"' : "") + '><label class="btn ghost sm" style="cursor:pointer">Choose photo<input id="ifile" type="file" accept="image/*" class="sr"></label><button class="btn ghost sm" type="button" id="irm"' + (item.photo_url ? "" : " hidden") + ">Remove photo</button></div>" +
      '<div class="row wrap-row"><label class="chk"><input type="checkbox" name="sold_out"' + (item.sold_out ? " checked" : "") + '> Sold out</label><label class="chk"><input type="checkbox" name="hidden"' + (item.hidden ? " checked" : "") + "> Hidden from site</label></div></form>",
      '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="isave">Save</button>');
    var pending = null, removed = false;
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    d.querySelector("#ifile").onchange = function (e) { var f = e.target.files[0]; if (!f) return; pending = f; removed = false; d.querySelector("#ipv").src = URL.createObjectURL(f); d.querySelector("#irm").hidden = false; };
    d.querySelector("#irm").onclick = function () { pending = null; removed = true; d.querySelector("#ipv").removeAttribute("src"); this.hidden = true; };
    d.querySelector("#isave").onclick = function () {
      var f = d.querySelector("#if"); if (!f.reportValidity()) return;
      var vals = { name_en: f.name_en.value.trim(), name_ar: f.name_ar.value.trim(), desc_en: f.desc_en.value.trim(), desc_ar: f.desc_ar.value.trim(), price: Math.round(parseFloat(f.price.value) * 1000) / 1000, category_id: f.category_id.value, sold_out: f.sold_out.checked, hidden: f.hidden.checked };
      var btn = this; btn.disabled = true;
      var up = pending ? A.uploadImage(pending, "items", 1200).then(function (r) { return r.url; }) : Promise.resolve(removed ? null : item.photo_url);
      up.then(function (url) {
        vals.photo_url = url; var snap = Object.assign({}, item);
        if (isNew) {
          var row = Object.assign({}, item, vals, { sort: catItems(vals.category_id).length + 1 });
          d.close(); return A.optimistic(function () { M.items.push(row); drawMenu(); }, function () { M.items.splice(M.items.indexOf(row), 1); drawMenu(); }, function () { return A.sb.from("menu_items").insert(row); }, "Added " + row.name_en + ".");
        }
        d.close(); return A.optimistic(function () { Object.assign(item, vals); drawMenu(); }, function () { Object.assign(item, snap); drawMenu(); }, function () { return A.sb.from("menu_items").update(vals).eq("id", item.id); }, "Saved " + vals.name_en + ".");
      }).catch(function (e) { btn.disabled = false; A.toast("Photo upload failed: " + (e && e.message || "error"), { err: true }); });
    };
  }

  function catDialog(c) {
    var isNew = !c; c = c || { id: A.uid(), name_en: "", name_ar: "", hidden: false, sort: M.cats.length + 1 };
    var d = A.dialog(isNew ? "Add section" : "Edit section",
      '<form id="cf" class="field-row"><div class="field-row two"><label class="f">Name (English)<input name="name_en" required value="' + A.esc(c.name_en) + '"></label><label class="f">Name (Arabic)<input name="name_ar" dir="rtl" value="' + A.esc(c.name_ar) + '"></label></div><label class="chk"><input type="checkbox" name="hidden"' + (c.hidden ? " checked" : "") + "> Hide this section from the site</label></form>",
      (isNew ? "" : '<button class="btn danger" type="button" id="cdel" style="margin-inline-end:auto">Delete section</button>') + '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="csave">Save</button>');
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    d.querySelector("#csave").onclick = function () {
      var f = d.querySelector("#cf"); if (!f.reportValidity()) return;
      var vals = { name_en: f.name_en.value.trim(), name_ar: f.name_ar.value.trim(), hidden: f.hidden.checked }; d.close();
      if (isNew) { var row = Object.assign({}, c, vals); A.optimistic(function () { M.cats.push(row); drawMenu(); }, function () { M.cats.splice(M.cats.indexOf(row), 1); drawMenu(); }, function () { return A.sb.from("categories").insert(row); }, "Section added."); }
      else { var snap = Object.assign({}, c); A.optimistic(function () { Object.assign(c, vals); drawMenu(); }, function () { Object.assign(c, snap); drawMenu(); }, function () { return A.sb.from("categories").update(vals).eq("id", c.id); }, "Section saved."); }
    };
    var del = d.querySelector("#cdel");
    if (del) del.onclick = function () {
      var n = catItems(c.id).length; d.close();
      A.confirm("Delete section " + c.name_en + "?", n ? "This also deletes its " + n + " item" + (n > 1 ? "s" : "") + ". You can undo right after." : "It has no items.", "Delete section").then(function (ok) {
        if (!ok) return; var items = catItems(c.id), idx = M.cats.indexOf(c);
        A.optimistic(function () { M.cats.splice(idx, 1); M.items = M.items.filter(function (i) { return i.category_id !== c.id; }); drawMenu(); }, function () { M.cats.splice(idx, 0, c); M.items = M.items.concat(items); drawMenu(); },
          function () { return A.sb.from("categories").delete().eq("id", c.id); }, "Deleted section " + c.name_en + ".",
          { action: { label: "Undo", fn: function () { A.optimistic(function () { M.cats.push(c); M.items = M.items.concat(items); drawMenu(); }, function () { M.cats.splice(M.cats.indexOf(c), 1); M.items = M.items.filter(function (i) { return i.category_id !== c.id; }); drawMenu(); }, function () { return A.sb.from("categories").insert(c).then(function (r) { if (r.error) return r; return items.length ? A.sb.from("menu_items").insert(items) : {}; }); }, "Section restored."); } } });
      });
    };
  }

  /* ---------- bulk price ---------- */
  function bulkDialog() {
    var opts = '<option value="">All items</option>' + M.cats.map(function (c) { return '<option value="' + c.id + '">' + A.esc(c.name_en) + "</option>"; }).join("");
    var d = A.dialog("Adjust prices",
      '<div class="field-row three"><label class="f">Apply to<select id="bs">' + opts + '</select></label><label class="f">Change by<select id="bm"><option value="pct">Percent</option><option value="amt">Amount (' + A.cur + ')</option></select></label><label class="f">Value (negative lowers)<input id="bv" type="number" step="0.001" value="10"></label></div><label class="chk"><input type="checkbox" id="br" checked> Round to the nearest 0.500</label><div id="bp" style="max-height:38vh;overflow:auto"></div>',
      '<button class="btn ghost" type="button" data-x2>Cancel</button><button class="btn" type="button" id="bgo">Apply</button>', "wide");
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    function calc() {
      var cid = d.querySelector("#bs").value, mode = d.querySelector("#bm").value, v = parseFloat(d.querySelector("#bv").value) || 0, rnd = d.querySelector("#br").checked;
      return M.items.filter(function (i) { return !cid || i.category_id === cid; }).map(function (i) {
        var p = mode === "pct" ? i.price * (1 + v / 100) : i.price + v; if (rnd) p = Math.round(p * 2) / 2; p = Math.max(0, Math.round(p * 1000) / 1000); return { it: i, from: i.price, to: p };
      });
    }
    function prev() {
      var rows = calc();
      d.querySelector("#bp").innerHTML = rows.length ? '<table class="t"><thead><tr><th>Item</th><th class="r">Now</th><th class="r">New</th></tr></thead><tbody>' + rows.map(function (r) { return "<tr><td>" + A.esc(r.it.name_en) + '</td><td class="r">' + A.money(r.from) + '</td><td class="r"><b>' + A.money(r.to) + "</b></td></tr>"; }).join("") + "</tbody></table>" : '<div class="empty">No items to change.</div>';
      d.querySelector("#bgo").disabled = !rows.some(function (r) { return r.from !== r.to; });
    }
    ["#bs", "#bm", "#bv", "#br"].forEach(function (s) { d.querySelector(s).oninput = prev; d.querySelector(s).onchange = prev; }); prev();
    d.querySelector("#bgo").onclick = function () {
      var rows = calc().filter(function (r) { return r.from !== r.to; }); d.close();
      function applyTo(key) { rows.forEach(function (r) { r.it.price = r[key]; }); drawMenu(); }
      function remote(key) { return Promise.all(rows.map(function (r) { return A.sb.from("menu_items").update({ price: r[key] }).eq("id", r.it.id); })).then(function (rs) { return rs.filter(function (x) { return x.error; })[0] || {}; }); }
      A.optimistic(function () { applyTo("to"); }, function () { applyTo("from"); }, function () { return remote("to"); }, rows.length + " price" + (rows.length > 1 ? "s" : "") + " updated.",
        { action: { label: "Undo", fn: function () { A.optimistic(function () { applyTo("from"); }, function () { applyTo("to"); }, function () { return remote("from"); }, "Prices restored."); } } });
    };
  }

  A.views.menu = {
    render: function (host) {
      M.host = host; M.q = ""; M.flt = "all";
      host.innerHTML = A.topbar("Menu", '<button class="btn ghost sm" id="bulk">' + A.ico("tag") + 'Adjust prices</button><button class="btn ghost sm" id="addcat">' + A.ico("plus") + 'Section</button>') +
        '<div class="toolbar"><div class="search">' + A.ico("search") + '<input id="mq" type="search" placeholder="Search items" aria-label="Search items"></div></div><div class="toolbar"><div class="chips" id="mchips"></div></div><div id="mlist"><div class="muted">Loading menu...</div></div>';
      host.querySelector("#mq").oninput = A.debounce(function (e) { M.q = e.target.value; drawMenu(); }, 120);
      host.querySelector("#bulk").onclick = bulkDialog; host.querySelector("#addcat").onclick = function () { catDialog(null); };
      load().then(drawMenu).catch(function (e) { host.querySelector("#mlist").innerHTML = '<div class="notice err">Could not load the menu: ' + A.esc(e.message) + "</div>"; });
    }
  };

  /* ---------- Availability (quick view for staff) ---------- */
  function drawAvail() {
    var host = M.host; if (!host || A.state.tab !== "availability") return;
    var q = M.q.trim().toLowerCase(), out = "";
    M.cats.slice().sort(function (a, b) { return a.sort - b.sort; }).forEach(function (c) {
      var list = catItems(c.id).filter(function (i) { return !q || (i.name_en + i.name_ar).toLowerCase().indexOf(q) > -1; }); if (!list.length) return;
      out += '<section class="card cat" style="margin-bottom:12px"><header><div class="h" style="padding:0 6px;font-weight:600">' + A.esc(c.name_en) + '</div></header><div class="avail">' +
        list.map(function (i) { return '<div class="arow"><div class="nm">' + A.esc(i.name_en) + '<div class="muted sm">' + A.money(i.price) + " " + A.cur + '</div></div><label class="sw warn"><input type="checkbox" data-sold="' + i.id + '"' + (i.sold_out ? " checked" : "") + '> Sold out</label><label class="sw"><input type="checkbox" data-show="' + i.id + '"' + (i.hidden ? "" : " checked") + '> Shown on site</label></div>'; }).join("") + "</div></section>";
    });
    host.querySelector("#alist").innerHTML = out || '<div class="empty"><b>Nothing to show</b>No items match.</div>';
    host.querySelectorAll("[data-sold]").forEach(function (b) { b.onchange = function () { setAvail(itemById(b.getAttribute("data-sold")), { sold_out: b.checked }); }; });
    host.querySelectorAll("[data-show]").forEach(function (b) { b.onchange = function () { setAvail(itemById(b.getAttribute("data-show")), { hidden: !b.checked }); }; });
  }
  function setAvail(i, patch) {
    var prev = { sold_out: i.sold_out, hidden: i.hidden }, next = Object.assign({}, prev, patch);
    A.optimistic(function () { Object.assign(i, next); }, function () { Object.assign(i, prev); drawAvail(); },
      function () {
        return A.sb.rpc("set_availability", { item: i.id, new_sold_out: next.sold_out, new_hidden: next.hidden }).then(function (r) {
          if (r.error && /function|schema cache|PGRST202/i.test(r.error.message || "") && A.can("menu")) return A.sb.from("menu_items").update(next).eq("id", i.id);
          return r;
        });
      }, i.name_en + " updated.");
  }
  A.views.availability = {
    render: function (host) {
      M.host = host;
      host.innerHTML = A.topbar("Availability") + '<p class="muted" style="margin-top:-8px">Switch an item to sold out, or take it off the website. Changes show on the site straight away.</p><div class="toolbar"><div class="search">' + A.ico("search") + '<input id="aq" type="search" placeholder="Search items" aria-label="Search items"></div></div><div id="alist"><div class="muted">Loading...</div></div>';
      host.querySelector("#aq").oninput = A.debounce(function (e) { M.q = e.target.value; drawAvail(); }, 120);
      M.q = ""; load().then(drawAvail).catch(function (e) { host.querySelector("#alist").innerHTML = '<div class="notice err">Could not load items: ' + A.esc(e.message) + "</div>"; });
    }
  };
})();
