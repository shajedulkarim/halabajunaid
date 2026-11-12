(function () {
  "use strict";
  var CFG = window.HB_CONFIG || {};
  var DEF = window.HB_DEFAULTS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- i18n ---------- */
  var T = {
    en: {
      logo_sub: "BOUTIQUE", nav_offer: "What we offer", nav_collection: "Collection", nav_gallery: "Gallery", nav_visit: "Visit",
      hero_eyebrow: "Fashion boutique, Muscat",
      hero_h1: "Abayas and occasion wear, in Muscat since 2013.",
      hero_lede: "Black abayas with lace, embroidered National Day sashes and pieces for the day you need them. Pick what you want and send it to us on WhatsApp.",
      cta_order: "Start an order", cta_visit: "Visit the boutique",
      fact_since: "Open since", fact_city: "Muscat", fact_country: "Oman", fact_orders: "Orders and questions",
      hero_cap: "Sand satin sash over black and gold lace",
      offer_eyebrow: "What we offer", offer_h2: "Three things, done carefully.",
      offer1_t: "Abayas", offer1_d: "Open-front black abayas with lace panels, metal tags and wide sleeves. Plain for every day, detailed for evenings.",
      offer2_t: "National Day sashes", offer2_d: "Satin sashes in red and sand, embroidered in gold with patterns taken from the Omani dagger belt.",
      offer3_t: "Occasion wear", offer3_d: "Gold-thread lace and matching sashes for weddings, Eid and family gatherings.",
      offer1_alt: "Black abaya with a lace panel", offer2_alt: "Red satin sash with gold embroidery", offer3_alt: "Black and gold lace abaya",
      coll_eyebrow: "Collection", coll_h2: "Choose your pieces.",
      coll_lede: "Prices are in Omani rial. Add what you want, enter your name and phone if you like, and the order opens in WhatsApp for us to confirm sizes and delivery.",
      all: "All", add: "Add to order", sold: "Sold out", soldTag: "Sold out", remove: "Remove",
      order_t: "Your order", order_empty: "Nothing added yet.", total: "Total",
      f_name: "Name (optional)", f_phone: "Phone (optional)", f_note: "Notes: size, colour, date needed",
      send: "Send on WhatsApp", order_note: "Nothing is charged here. We reply on WhatsApp to confirm availability and payment.",
      bar_items: "items", bar_view: "View order",
      gal_eyebrow: "Gallery", gal_h2: "From the boutique.",
      visit_eyebrow: "Hours", visit_h2: "Opening hours", closed: "Closed",
      loc_eyebrow: "Location and contact", loc_h2: "Find us in Muscat",
      loc_addr: "Hala Bajunaid Boutique, Muscat, Oman. The map link has the exact spot.", map: "Open in Google Maps",
      foot_staff: "Staff", opening: "Opening your order in WhatsApp...", logfail: "", empty_cat: "Nothing in this section yet.",
      rated: "Rated", reviews: "reviews",
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      msg_hello: "Hello Hala Bajunaid Boutique, I would like to order:", msg_total: "Total", msg_name: "Name", msg_phone: "Phone", msg_note: "Notes", msg_ref: "Ref"
    },
    ar: {
      logo_sub: "بوتيك", nav_offer: "ما نقدمه", nav_collection: "المجموعة", nav_gallery: "المعرض", nav_visit: "زيارتنا",
      hero_eyebrow: "بوتيك أزياء في مسقط",
      hero_h1: "عبايات وأزياء مناسبات في مسقط منذ 2013.",
      hero_lede: "عبايات سوداء بالدانتيل، وأوشحة العيد الوطني المطرزة، وقطع للمناسبة التي تحتاجها. اختاري ما يناسبك وأرسليه لنا عبر واتساب.",
      cta_order: "ابدئي طلبك", cta_visit: "زوري البوتيك",
      fact_since: "منذ", fact_city: "مسقط", fact_country: "سلطنة عمان", fact_orders: "للطلبات والاستفسار",
      hero_cap: "وشاح ساتان رملي فوق دانتيل أسود وذهبي",
      offer_eyebrow: "ما نقدمه", offer_h2: "ثلاثة أشياء، بعناية.",
      offer1_t: "العبايات", offer1_d: "عبايات سوداء بفتحة أمامية، ولوح دانتيل، وشارة معدنية، وأكمام واسعة. سادة لكل يوم، ومفصلة للسهرات.",
      offer2_t: "أوشحة العيد الوطني", offer2_d: "أوشحة ساتان باللونين الأحمر والرملي، مطرزة بالذهبي بنقوش مستوحاة من حزام الخنجر العماني.",
      offer3_t: "أزياء المناسبات", offer3_d: "دانتيل بخيوط ذهبية وأوشحة مطابقة للأعراس والأعياد واللقاءات العائلية.",
      offer1_alt: "عباية سوداء بلوح دانتيل", offer2_alt: "وشاح ساتان أحمر بتطريز ذهبي", offer3_alt: "عباية دانتيل أسود وذهبي",
      coll_eyebrow: "المجموعة", coll_h2: "اختاري قطعك.",
      coll_lede: "الأسعار بالريال العماني. أضيفي ما تريدين، واكتبي اسمك ورقمك إن شئتِ، ثم يُفتح الطلب في واتساب لنؤكد المقاس والتوصيل.",
      all: "الكل", add: "أضيفي إلى الطلب", sold: "نفدت الكمية", soldTag: "نفدت", remove: "إزالة",
      order_t: "طلبك", order_empty: "لم تضيفي شيئاً بعد.", total: "المجموع",
      f_name: "الاسم (اختياري)", f_phone: "الهاتف (اختياري)", f_note: "ملاحظات: المقاس، اللون، موعد الحاجة",
      send: "أرسلي عبر واتساب", order_note: "لا يتم أي خصم هنا. نردّ عليك في واتساب لتأكيد التوفر والدفع.",
      bar_items: "قطعة", bar_view: "عرض الطلب",
      gal_eyebrow: "المعرض", gal_h2: "من البوتيك.",
      visit_eyebrow: "الدوام", visit_h2: "ساعات العمل", closed: "مغلق",
      loc_eyebrow: "الموقع والتواصل", loc_h2: "تجديننا في مسقط",
      loc_addr: "هلا باجنيد بوتيك، مسقط، سلطنة عمان. رابط الخريطة يحدد الموقع بدقة.", map: "افتحي خرائط جوجل",
      foot_staff: "الموظفون", opening: "جارٍ فتح طلبك في واتساب...", logfail: "", empty_cat: "لا توجد قطع في هذا القسم بعد.",
      rated: "التقييم", reviews: "تقييم",
      days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      msg_hello: "مرحباً هلا باجنيد بوتيك، أرغب بطلب:", msg_total: "المجموع", msg_name: "الاسم", msg_phone: "الهاتف", msg_note: "ملاحظات", msg_ref: "المرجع"
    }
  };
  var lang = "en";
  try { lang = new URLSearchParams(location.search).get("lang") || localStorage.getItem("hb_lang") || "en"; } catch (e) {}
  if (lang !== "ar") lang = "en";
  function t(k) { return (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.en[k] != null ? T.en[k] : k); }

  /* ---------- data ---------- */
  var data = { settings: DEF.settings, categories: DEF.categories, items: DEF.items, photos: DEF.photos, live: false };
  var cart = {}; // id -> qty
  var activeCat = "all";

  function money(n) { return Number(n || 0).toFixed(3); }
  function nm(o, f) { return o[f + "_" + lang] || o[f + "_en"] || ""; }
  function imgFor(it, small) {
    if (it.photo_url) return it.photo_url;
    if (it.img) return "assets/img/" + (small ? "sm/" : "") + it.img + "?v=1";
    return "";
  }

  function sb(path, opts) {
    opts = opts || {};
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, opts.timeout || 4500);
    return fetch(CFG.SUPABASE_URL + "/rest/v1/" + path, {
      method: opts.method || "GET",
      headers: Object.assign({ apikey: CFG.SUPABASE_KEY, Authorization: "Bearer " + CFG.SUPABASE_KEY, "Content-Type": "application/json" }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctl.signal,
      keepalive: !!opts.keepalive
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return opts.method === "POST" ? null : r.json();
    });
  }

  function loadLive() {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_KEY) return Promise.resolve();
    return Promise.all([
      sb("categories?select=*&order=sort"),
      sb("menu_items?select=*&order=sort"),
      sb("photos?select=*&order=sort"),
      sb("settings?select=*")
    ]).then(function (r) {
      var cats = r[0], items = r[1], photos = r[2], sets = r[3];
      if (cats.length && items.length) { data.categories = cats; data.items = items; }
      if (photos.length) {
        data.photos = photos.map(function (p) { return { id: p.id, section: p.section, url: p.url, thumb: p.thumb_url || p.url, caption_en: p.caption_en, caption_ar: p.caption_ar, sort: p.sort }; });
      }
      var s = Object.assign({}, DEF.settings);
      sets.forEach(function (row) { s[row.key] = row.value; });
      data.settings = s;
      data.live = true;
    }).catch(function () { /* keep bundled defaults */ });
  }

  /* ---------- render ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-alt]").forEach(function (el) { el.alt = t(el.getAttribute("data-i18n-alt")); });
    $("#lang").textContent = lang === "ar" ? "English" : "العربية";
    $("#lang").setAttribute("lang", lang === "ar" ? "en" : "ar");
    document.title = lang === "ar" ? "هلا باجنيد بوتيك | عبايات وأزياء مناسبات في مسقط" : "Hala Bajunaid Boutique | Abayas and occasion wear in Muscat";
  }

  function renderBanner() {
    var b = data.settings.banner, el = $("#banner");
    var txt = b && b.enabled ? (lang === "ar" ? (b.text_ar || b.text_en) : (b.text_en || b.text_ar)) : "";
    el.hidden = !txt; el.textContent = txt || "";
  }

  function renderHero() {
    var h = data.photos.filter(function (p) { return p.section === "hero"; })[0];
    if (!h || !data.live) { $("#heroCap").textContent = t("hero_cap"); return; }
    var img = $("#heroImg"); img.removeAttribute("srcset"); img.src = h.url;
    $("#heroCap").textContent = nm(h, "caption") || t("hero_cap");
  }

  function visibleCats() {
    return data.categories.filter(function (c) { return !c.hidden; }).sort(function (a, b) { return a.sort - b.sort; });
  }

  function renderCatalogue() {
    var cats = visibleCats();
    if (activeCat !== "all" && !cats.some(function (c) { return c.id === activeCat; })) activeCat = "all";
    var chips = $("#chips");
    chips.innerHTML = "";
    [{ id: "all", label: t("all") }].concat(cats.map(function (c) { return { id: c.id, label: nm(c, "name") }; })).forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c.label;
      b.setAttribute("aria-pressed", String(c.id === activeCat));
      b.onclick = function () { activeCat = c.id; renderCatalogue(); };
      chips.appendChild(b);
    });
    var host = $("#catalogue"); host.innerHTML = "";
    var any = false;
    cats.forEach(function (c) {
      if (activeCat !== "all" && activeCat !== c.id) return;
      var items = data.items.filter(function (i) { return i.category_id === c.id && !i.hidden; }).sort(function (a, b) { return a.sort - b.sort; });
      if (!items.length) return;
      any = true;
      var h = document.createElement("h3"); h.className = "cat-title"; h.textContent = nm(c, "name"); host.appendChild(h);
      var grid = document.createElement("div"); grid.className = "items";
      items.forEach(function (it) { grid.appendChild(itemCard(it)); });
      host.appendChild(grid);
    });
    if (!any) host.innerHTML = '<p class="empty-note">' + t("empty_cat") + "</p>";
  }

  function itemCard(it) {
    var el = document.createElement("article");
    el.className = "item" + (it.sold_out ? " sold" : "");
    var src = imgFor(it, true);
    var ph = src ? '<div class="ph"><img loading="lazy" width="320" height="427" alt="" src="' + src + '">' + (it.sold_out ? '<span class="tag">' + t("soldTag") + "</span>" : "") + "</div>"
                 : '<div class="ph empty">' + (nm(it, "name").charAt(0) || "") + "</div>";
    el.innerHTML = ph + "<h3></h3><p class='d'></p><p class='price'></p><div class='ctl'></div>";
    el.querySelector("h3").textContent = nm(it, "name");
    el.querySelector(".d").textContent = nm(it, "desc");
    el.querySelector(".price").textContent = money(it.price) + " " + (CFG.CURRENCY || "OMR");
    var ctl = el.querySelector(".ctl");
    var q = cart[it.id] || 0;
    if (it.sold_out) {
      ctl.innerHTML = '<button class="add" disabled>' + t("sold") + "</button>";
    } else if (!q) {
      var a = document.createElement("button"); a.type = "button"; a.className = "add"; a.textContent = t("add");
      a.onclick = function () { setQty(it.id, 1); }; ctl.appendChild(a);
    } else {
      ctl.innerHTML = '<div class="stepper"><button type="button" aria-label="-">&minus;</button><output>' + q + '</output><button type="button" aria-label="+">+</button></div>';
      var bs = ctl.querySelectorAll("button");
      bs[0].onclick = function () { setQty(it.id, q - 1); };
      bs[1].onclick = function () { setQty(it.id, q + 1); };
    }
    return el;
  }

  function setQty(id, q) {
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 20);
    try { sessionStorage.setItem("hb_cart", JSON.stringify(cart)); } catch (e) {}
    renderCatalogue(); renderOrder();
  }

  function lines() {
    return Object.keys(cart).map(function (id) {
      var it = data.items.filter(function (i) { return i.id === id; })[0];
      return it ? { it: it, q: cart[id] } : null;
    }).filter(Boolean);
  }

  function renderOrder() {
    var ls = lines(), ul = $("#lines"); ul.innerHTML = "";
    var total = 0, count = 0;
    ls.forEach(function (l) {
      total += l.it.price * l.q; count += l.q;
      var li = document.createElement("li");
      li.innerHTML = '<span class="n"></span><span class="p"></span><span class="q"></span>';
      li.querySelector(".n").textContent = nm(l.it, "name");
      li.querySelector(".q").textContent = l.q + " x " + money(l.it.price);
      li.querySelector(".p").textContent = money(l.it.price * l.q);
      var rm = document.createElement("button"); rm.type = "button"; rm.className = "rm"; rm.textContent = t("remove");
      rm.onclick = function () { setQty(l.it.id, 0); }; li.appendChild(rm);
      ul.appendChild(li);
    });
    $("#emptyNote").hidden = ls.length > 0;
    $("#totalRow").hidden = !ls.length;
    $("#total").textContent = money(total) + " " + (CFG.CURRENCY || "OMR");
    $("#send").disabled = !ls.length;
    $("#bar").classList.toggle("show", ls.length > 0);
    $("#barCount").textContent = count;
    $("#barTotal").textContent = money(total) + " " + (CFG.CURRENCY || "OMR");
  }

  function renderGallery() {
    var g = data.photos.filter(function (p) { return p.section === "gallery"; }).sort(function (a, b) { return a.sort - b.sort; });
    var host = $("#gGrid"); host.innerHTML = "";
    g.slice(0, 6).forEach(function (p) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", nm(p, "caption"));
      b.innerHTML = '<img loading="lazy" width="320" height="427" alt="">';
      b.firstChild.src = p.thumb || p.url; b.firstChild.alt = nm(p, "caption");
      b.onclick = function () { $("#lbImg").src = p.url; $("#lbImg").alt = nm(p, "caption"); $("#lbCap").textContent = nm(p, "caption"); $("#lb").showModal(); };
      host.appendChild(b);
    });
  }

  function renderHours() {
    var rows = {}; (data.settings.hours || []).forEach(function (h) { rows[h.day] = h; });
    var today = new Date().getDay(), html = "";
    [6, 0, 1, 2, 3, 4, 5].forEach(function (d) {
      var h = rows[d] || { closed: true };
      html += "<tr" + (d === today ? ' class="today"' : "") + "><th scope='row'>" + T[lang].days[d] + "</th><td>" +
        (h.closed ? '<span class="closed">' + t("closed") + "</span>" : '<span dir="ltr">' + h.open + " - " + h.close + "</span>") + "</td></tr>";
    });
    $("#hours").innerHTML = html;
    var r = data.settings.rating, el = $("#rating");
    if (r && r.show && r.value) { el.hidden = false; el.textContent = t("rated") + " " + Number(r.value).toFixed(1) + " / 5" + (r.count ? " (" + r.count + " " + t("reviews") + ")" : ""); } else el.hidden = true;
  }

  function renderAll() { applyLang(); renderBanner(); renderHero(); renderCatalogue(); renderOrder(); renderGallery(); renderHours(); }

  /* ---------- order ---------- */
  function ref() { var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "HB-"; for (var i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  function send() {
    var ls = lines(); if (!ls.length) return;
    var btn = $("#send"), st = $("#status"); btn.disabled = true; st.className = "status"; st.textContent = t("opening");
    var total = ls.reduce(function (a, l) { return a + l.it.price * l.q; }, 0);
    var name = $("#cName").value.trim(), phone = $("#cPhone").value.trim(), note = $("#cNote").value.trim();
    var r = ref(), cur = CFG.CURRENCY || "OMR";
    var msg = [t("msg_hello")].concat(ls.map(function (l) { return l.q + " x " + nm(l.it, "name") + " - " + money(l.it.price * l.q) + " " + cur; }));
    msg.push("", t("msg_total") + ": " + money(total) + " " + cur);
    if (name) msg.push(t("msg_name") + ": " + name);
    if (phone) msg.push(t("msg_phone") + ": " + phone);
    if (note) msg.push(t("msg_note") + ": " + note);
    msg.push(t("msg_ref") + ": " + r);
    var url = "https://wa.me/" + (CFG.WHATSAPP || "96879970220") + "?text=" + encodeURIComponent(msg.join("\n"));
    var log = Promise.resolve();
    if (CFG.SUPABASE_URL && CFG.SUPABASE_KEY) {
      log = sb("orders", {
        method: "POST", keepalive: true, timeout: 2500, headers: { Prefer: "return=minimal" },
        body: { ref: r, customer_name: name || null, customer_phone: phone || null, notes: note || null, total: total, lang: lang,
                items: ls.map(function (l) { return { id: l.it.id, name_en: l.it.name_en, name_ar: l.it.name_ar, qty: l.q, price: l.it.price }; }) }
      }).catch(function () { /* logging must never block the order */ });
    }
    // WhatsApp always opens, whether or not logging worked.
    Promise.race([log, new Promise(function (res) { setTimeout(res, 1800); })]).then(function () {
      window.location.href = url;
      setTimeout(function () { btn.disabled = false; st.textContent = ""; }, 2500);
    });
  }

  /* ---------- wire ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    try { var c = JSON.parse(sessionStorage.getItem("hb_cart") || "{}"); if (c && typeof c === "object") cart = c; } catch (e) {}
    renderAll();
    $("#send").onclick = send;
    $("#lang").onclick = function () { lang = lang === "ar" ? "en" : "ar"; try { localStorage.setItem("hb_lang", lang); } catch (e) {} renderAll(); };
    var mb = $("#menuBtn"), sh = $("#sheet");
    mb.onclick = function () { var o = sh.classList.toggle("open"); mb.setAttribute("aria-expanded", String(o)); };
    $$("#sheet a").forEach(function (a) { a.onclick = function () { sh.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }; });
    $("#lbClose").onclick = function () { $("#lb").close(); };
    $("#lb").addEventListener("click", function (e) { if (e.target === this) this.close(); });
    loadLive().then(function () { if (data.live) { renderBanner(); renderHero(); renderCatalogue(); renderOrder(); renderGallery(); renderHours(); } });
  });
})();
