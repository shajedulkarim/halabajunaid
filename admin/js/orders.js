/* Orders: live list, status flow, search, filters, print, CSV. */
(function () {
  "use strict";
  var A = window.A;
  var FLOW = ["new", "preparing", "ready", "done"];
  var NEXT_LABEL = { new: "Start preparing", preparing: "Mark ready", ready: "Mark done" };
  var LABEL = { new: "New", preparing: "Preparing", ready: "Ready", done: "Done", cancelled: "Cancelled" };
  var S = { orders: [], q: "", f: "open", seen: {}, chan: null, timer: null, host: null, loaded: false };

  function load(silent) {
    return A.sb.from("orders").select("*").order("created_at", { ascending: false }).limit(500).then(function (r) {
      if (r.error) { if (!silent) S.host.querySelector("#olist").innerHTML = '<div class="notice err">Could not load orders: ' + A.esc(r.error.message) + "</div>"; return; }
      var fresh = [];
      r.data.forEach(function (o) { if (S.loaded && !S.seen[o.id] && o.status === "new") fresh.push(o.id); S.seen[o.id] = 1; });
      S.orders = r.data; S.loaded = true;
      if (fresh.length) { A.playAlert(); A.toast(fresh.length + " new order" + (fresh.length > 1 ? "s" : "") + "."); }
      S.fresh = fresh; draw();
    });
  }

  function counts() { var c = { all: S.orders.length, open: 0 }; FLOW.concat("cancelled").forEach(function (s) { c[s] = 0; }); S.orders.forEach(function (o) { c[o.status] = (c[o.status] || 0) + 1; if (o.status !== "done" && o.status !== "cancelled") c.open++; }); return c; }

  function filtered() {
    var q = S.q.trim().toLowerCase();
    return S.orders.filter(function (o) {
      if (S.f === "open") { if (o.status === "done" || o.status === "cancelled") return false; } else if (S.f !== "all" && o.status !== S.f) return false;
      if (!q) return true;
      var hay = [o.ref, o.customer_name, o.customer_phone, o.notes].concat((o.items || []).map(function (i) { return i.name_en + " " + (i.name_ar || ""); })).join(" ").toLowerCase();
      return hay.indexOf(q) > -1;
    });
  }

  function card(o) {
    var items = (o.items || []).map(function (i) { return "<li><span>" + A.esc(i.qty) + " x " + A.esc(i.name_en) + '</span><span class="num">' + A.money(i.qty * i.price) + "</span></li>"; }).join("");
    var wa = o.customer_phone ? A.waLink(o.customer_phone, "Hello " + (o.customer_name || "") + ", this is Hala Bajunaid Boutique about your order " + o.ref + ".") : "";
    var cust = (o.customer_name || o.customer_phone) ? '<div class="cust"><b>' + A.esc(o.customer_name || "No name") + "</b>" +
      (o.customer_phone ? '<a class="btn ghost sm" href="' + wa + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + A.esc(o.customer_phone) + '">' + A.ico("wa") + A.esc(o.customer_phone) + '</a><a class="btn ghost sm" href="tel:' + A.esc(A.digits(o.customer_phone)) + '" aria-label="Call">' + A.ico("phone") + "Call</a>" : "") + "</div>" : '<div class="muted sm">No name or phone given. Reply in the WhatsApp chat.</div>';
    var acts = "";
    if (A.can("orders")) {
      if (NEXT_LABEL[o.status]) acts += '<button class="btn sm" data-next="' + o.id + '">' + NEXT_LABEL[o.status] + "</button>";
      if (o.status !== "cancelled" && o.status !== "done") acts += '<button class="btn danger sm" data-cancel="' + o.id + '">Cancel</button>';
      if (o.status === "cancelled" || o.status === "done") acts += '<button class="btn ghost sm" data-reopen="' + o.id + '">Reopen</button>';
    }
    return '<article class="card order s-' + o.status + (S.fresh && S.fresh.indexOf(o.id) > -1 ? " fresh" : "") + '" data-id="' + o.id + '"><header><span class="ref">' + A.esc(o.ref) + '</span><span class="badge b-' + o.status + '">' + LABEL[o.status] + '</span><span class="muted sm right">' + A.fmtTime(o.created_at) + "</span></header>" + cust +
      "<ul>" + items + "</ul>" + (o.notes ? '<div class="note-box">' + A.esc(o.notes) + "</div>" : "") + '<div class="tot"><span>Total</span><span class="num">' + A.money(o.total) + " " + A.cur + '</span></div><div class="acts">' + acts + "</div></article>";
  }

  function draw() {
    if (!S.host) return;
    var c = counts(), chips = [["open", "Open"], ["new", "New"], ["preparing", "Preparing"], ["ready", "Ready"], ["done", "Done"], ["cancelled", "Cancelled"], ["all", "All"]];
    S.host.querySelector("#ochips").innerHTML = chips.map(function (x) { return '<button type="button" class="chip" aria-pressed="' + (S.f === x[0]) + '" data-f="' + x[0] + '">' + x[1] + '<span class="n">' + (c[x[0]] || 0) + "</span></button>"; }).join("");
    var list = filtered(), el = S.host.querySelector("#olist");
    el.className = list.length ? "grid orders" : "";
    el.innerHTML = list.length ? list.map(card).join("") : '<div class="empty"><b>' + (S.orders.length ? "No orders match" : "No orders yet") + "</b>" + (S.orders.length ? "Try another filter or clear the search." : "New orders from the website appear here with a sound.") + "</div>";
    A.setDot("orders", c.new || 0);
    S.host.querySelectorAll("[data-f]").forEach(function (b) { b.onclick = function () { S.f = b.getAttribute("data-f"); draw(); }; });
    el.querySelectorAll("[data-next]").forEach(function (b) { b.onclick = function () { var o = byId(b.getAttribute("data-next")); setStatus(o, FLOW[FLOW.indexOf(o.status) + 1]); }; });
    el.querySelectorAll("[data-cancel]").forEach(function (b) { b.onclick = function () { var o = byId(b.getAttribute("data-cancel")); A.confirm("Cancel order " + o.ref + "?", "The customer is not notified automatically. You can reopen it later.", "Cancel order").then(function (ok) { if (ok) setStatus(o, "cancelled"); }); }; });
    el.querySelectorAll("[data-reopen]").forEach(function (b) { b.onclick = function () { setStatus(byId(b.getAttribute("data-reopen")), "new"); }; });
  }
  function byId(id) { return S.orders.filter(function (o) { return o.id === id; })[0]; }

  function setStatus(o, st) {
    var prev = o.status;
    A.optimistic(function () { o.status = st; draw(); }, function () { o.status = prev; draw(); },
      function () { return A.sb.from("orders").update({ status: st, handled_by: A.state.profile.user_id, updated_at: new Date().toISOString() }).eq("id", o.id); }, o.ref + " is now " + LABEL[st].toLowerCase() + ".");
  }

  function csv() {
    var rows = [["Ref", "Created", "Status", "Name", "Phone", "Items", "Total " + A.cur, "Notes"]];
    filtered().forEach(function (o) { rows.push([o.ref, o.created_at, o.status, o.customer_name || "", o.customer_phone || "", (o.items || []).map(function (i) { return i.qty + " x " + i.name_en; }).join("; "), A.money(o.total), o.notes || ""]); });
    var text = rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
    A.download("orders-" + new Date().toISOString().slice(0, 10) + ".csv", "﻿" + text, "text/csv");
    A.toast("CSV downloaded.");
  }

  A.views.orders = {
    render: function (host) {
      S.host = host; S.loaded = false;
      host.innerHTML = A.topbar("Orders", '<button class="iconbtn" id="mute" aria-label="Toggle alert sound" title="Alert sound">' + A.ico(A.sound.muted ? "bellOff" : "bell") + '</button><button class="btn ghost sm" id="prn">' + A.ico("print") + 'Print</button><button class="btn ghost sm" id="csv">' + A.ico("download") + "CSV</button>") +
        '<div class="toolbar"><div class="search">' + A.ico("search") + '<input id="oq" type="search" placeholder="Search name, phone, reference, item" aria-label="Search orders"></div></div><div class="toolbar"><div class="chips" id="ochips"></div></div><div id="olist"><div class="muted">Loading orders...</div></div>';
      host.querySelector("#oq").oninput = A.debounce(function (e) { S.q = e.target.value; draw(); }, 150);
      host.querySelector("#prn").onclick = function () { window.print(); };
      host.querySelector("#csv").onclick = csv;
      host.querySelector("#mute").onclick = function () { A.sound.muted = !A.sound.muted; try { localStorage.setItem("hb_mute", A.sound.muted ? "1" : "0"); } catch (e) {} this.innerHTML = A.ico(A.sound.muted ? "bellOff" : "bell"); if (!A.sound.muted) A.playAlert(); A.toast(A.sound.muted ? "Alert sound off." : "Alert sound on."); };
      load().then(function () {
        try {
          S.chan = A.sb.channel("orders-live").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, function () { load(true); }).subscribe();
        } catch (e) {}
        S.timer = setInterval(function () { load(true); }, 25000);
      });
    },
    leave: function () { clearInterval(S.timer); if (S.chan) { try { A.sb.removeChannel(S.chan); } catch (e) {} S.chan = null; } }
  };
  A.orderStore = S;
})();
