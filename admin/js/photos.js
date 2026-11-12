/* Photos: grouped by section, viewer with replace / rotate / download / restore original, drag and drop. */
(function () {
  "use strict";
  var A = window.A;
  var SECTIONS = [["hero", "Hero", "The large photo at the top of the site. The first one is used."], ["gallery", "Gallery", "The six photos in the gallery section."], ["catalogue", "Catalogue", "Spare shots to reuse on menu items."]];
  var P = { photos: [], host: null, sec: "gallery" };

  /* ---- image helpers ---- */
  function loadImg(src, cors) { return new Promise(function (res, rej) { var i = new Image(); if (cors) i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = function () { rej(new Error("Could not read the image")); }; i.src = src; }); }
  function toBlob(canvas, q) { return new Promise(function (res) { canvas.toBlob(res, "image/jpeg", q || .86); }); }
  function scaled(img, max, rotate) {
    var w = img.naturalWidth, h = img.naturalHeight, r = Math.min(1, max / Math.max(w, h)), cw = Math.round(w * r), ch = Math.round(h * r);
    var c = document.createElement("canvas"), x;
    if (rotate) { c.width = ch; c.height = cw; x = c.getContext("2d"); x.translate(ch, 0); x.rotate(Math.PI / 2); x.drawImage(img, 0, 0, cw, ch); } else { c.width = cw; c.height = ch; x = c.getContext("2d"); x.drawImage(img, 0, 0, cw, ch); }
    return c;
  }
  function upload(path, blob) {
    return A.sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false }).then(function (r) {
      if (r.error) throw r.error; return A.sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    });
  }
  /* Upload a File or Blob: full size (max px) + 640px thumb. Returns { url, thumb, path } */
  A.uploadImage = function (file, folder, max, rotate) {
    var src = file instanceof Blob ? URL.createObjectURL(file) : file;
    return loadImg(src, !(file instanceof Blob)).then(function (img) {
      var id = A.uid(), p = folder + "/" + id + ".jpg", t = folder + "/" + id + "_sm.jpg";
      return Promise.all([toBlob(scaled(img, max || 1600, rotate), .88), toBlob(scaled(img, 640, rotate), .8)]).then(function (b) {
        return Promise.all([upload(p, b[0]), upload(t, b[1])]).then(function (u) { return { url: u[0], thumb: u[1], path: p }; });
      });
    });
  };

  function load() { return A.sb.from("photos").select("*").order("sort").then(function (r) { if (r.error) throw r.error; P.photos = r.data; }); }
  function inSec(s) { return P.photos.filter(function (p) { return p.section === s; }).sort(function (a, b) { return a.sort - b.sort; }); }

  function draw() {
    var h = P.host; if (!h) return;
    h.querySelector("#pchips").innerHTML = SECTIONS.map(function (s) { return '<button class="chip" type="button" data-s="' + s[0] + '" aria-pressed="' + (P.sec === s[0]) + '">' + s[1] + '<span class="n">' + inSec(s[0]).length + "</span></button>"; }).join("");
    var info = SECTIONS.filter(function (s) { return s[0] === P.sec; })[0], list = inSec(P.sec);
    h.querySelector("#pnote").textContent = info[2];
    h.querySelector("#pgrid").innerHTML = list.length ? list.map(function (p) { return '<button class="pt" type="button" data-p="' + p.id + '"><img loading="lazy" alt="' + A.esc(p.caption_en) + '" src="' + A.esc(p.thumb_url || p.url) + '"><span class="cap">' + A.esc(p.caption_en || "No caption") + "</span></button>"; }).join("") : '<div class="empty" style="grid-column:1/-1"><b>No photos in ' + info[1].toLowerCase() + "</b>Drop image files here or use Add photos.</div>";
    h.querySelectorAll("[data-s]").forEach(function (b) { b.onclick = function () { P.sec = b.getAttribute("data-s"); draw(); }; });
    h.querySelectorAll("[data-p]").forEach(function (b) { b.onclick = function () { viewer(P.photos.filter(function (p) { return p.id === b.getAttribute("data-p"); })[0]); }; });
  }

  function addFiles(files) {
    files = Array.prototype.slice.call(files).filter(function (f) { return /^image\//.test(f.type); });
    if (!files.length) return A.toast("Only image files can be added.", { err: true });
    A.toast("Uploading " + files.length + " photo" + (files.length > 1 ? "s" : "") + "...", { ms: 1800 });
    var sec = P.sec, base = inSec(sec).length;
    files.reduce(function (chain, f, idx) {
      return chain.then(function () {
        return A.uploadImage(f, sec, 1600).then(function (u) {
          var row = { id: A.uid(), section: sec, url: u.url, thumb_url: u.thumb, original_url: u.url, storage_path: u.path, caption_en: f.name.replace(/\.[^.]+$/, ""), caption_ar: "", sort: base + idx + 1 };
          return A.optimistic(function () { P.photos.push(row); draw(); }, function () { P.photos.splice(P.photos.indexOf(row), 1); draw(); }, function () { return A.sb.from("photos").insert(row); }, null);
        }).catch(function (e) { A.toast("Upload failed: " + (e.message || "error"), { err: true }); });
      });
    }, Promise.resolve()).then(function () { A.toast("Photos added."); });
  }

  function viewer(p) {
    var d = A.dialog("Photo", '<div class="viewer"><div><img id="vimg" alt="' + A.esc(p.caption_en) + '" src="' + A.esc(p.url) + '"></div><div class="field-row"><label class="f">Caption (English)<input id="vc1" value="' + A.esc(p.caption_en) + '"></label><label class="f">Caption (Arabic)<input id="vc2" dir="rtl" value="' + A.esc(p.caption_ar) + '"></label><label class="f">Section<select id="vs">' + SECTIONS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === p.section ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") + '</select></label>' +
      '<div class="row wrap-row"><label class="btn ghost sm" style="cursor:pointer">Replace<input id="vrep" type="file" accept="image/*" class="sr"></label><button class="btn ghost sm" id="vrot" type="button">' + A.ico("rotate") + 'Rotate</button><button class="btn ghost sm" id="vdl" type="button">' + A.ico("download") + 'Download</button><button class="btn ghost sm" id="vres" type="button"' + (p.original_url && p.original_url !== p.url ? "" : " disabled") + ">" + A.ico("undo") + 'Restore original</button></div></div></div>',
      '<button class="btn danger" id="vdel" type="button" style="margin-inline-end:auto">Delete</button><button class="btn ghost" type="button" data-x2>Close</button><button class="btn" id="vsave" type="button">Save details</button>', "wide");
    d.querySelector("[data-x2]").onclick = function () { d.close(); };
    function swapImage(promise, msg) {
      var snap = Object.assign({}, p); d.querySelector("#vimg").style.opacity = .4;
      promise.then(function (u) {
        var patch = { url: u.url, thumb_url: u.thumb, storage_path: u.path, original_url: p.original_url || p.url };
        return A.optimistic(function () { Object.assign(p, patch); d.querySelector("#vimg").src = p.url; d.querySelector("#vres").disabled = false; draw(); }, function () { Object.assign(p, snap); d.querySelector("#vimg").src = p.url; draw(); }, function () { return A.sb.from("photos").update(patch).eq("id", p.id); }, msg);
      }).catch(function (e) { A.toast("Failed: " + (e.message || "error") + ". Nothing changed.", { err: true }); }).then(function () { d.querySelector("#vimg").style.opacity = 1; });
    }
    d.querySelector("#vrep").onchange = function (e) { var f = e.target.files[0]; if (f) swapImage(A.uploadImage(f, p.section, 1600), "Photo replaced. The original is kept."); };
    d.querySelector("#vrot").onclick = function () { swapImage(A.uploadImage(p.url, p.section, 1600, true), "Rotated."); };
    d.querySelector("#vdl").onclick = function () {
      fetch(p.url).then(function (r) { return r.blob(); }).then(function (b) { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = (p.caption_en || "photo").replace(/[^\w-]+/g, "-") + ".jpg"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); A.toast("Download started."); })
        .catch(function () { window.open(p.url, "_blank"); });
    };
    d.querySelector("#vres").onclick = function () {
      var snap = Object.assign({}, p), patch = { url: p.original_url, thumb_url: p.thumb_url };
      A.optimistic(function () { Object.assign(p, patch); d.querySelector("#vimg").src = p.url; d.querySelector("#vres").disabled = true; draw(); }, function () { Object.assign(p, snap); d.querySelector("#vimg").src = p.url; draw(); }, function () { return A.sb.from("photos").update(patch).eq("id", p.id); }, "Original restored.");
    };
    d.querySelector("#vsave").onclick = function () {
      var patch = { caption_en: d.querySelector("#vc1").value.trim(), caption_ar: d.querySelector("#vc2").value.trim(), section: d.querySelector("#vs").value }, snap = Object.assign({}, p); d.close();
      A.optimistic(function () { Object.assign(p, patch); draw(); }, function () { Object.assign(p, snap); draw(); }, function () { return A.sb.from("photos").update(patch).eq("id", p.id); }, "Photo details saved.");
    };
    d.querySelector("#vdel").onclick = function () {
      d.close(); A.confirm("Delete this photo?", "It is removed from the site. You can undo right after.", "Delete").then(function (ok) {
        if (!ok) return; var idx = P.photos.indexOf(p);
        A.optimistic(function () { P.photos.splice(idx, 1); draw(); }, function () { P.photos.splice(idx, 0, p); draw(); }, function () { return A.sb.from("photos").delete().eq("id", p.id); }, "Photo deleted.",
          { action: { label: "Undo", fn: function () { A.optimistic(function () { P.photos.push(p); draw(); }, function () { P.photos.splice(P.photos.indexOf(p), 1); draw(); }, function () { return A.sb.from("photos").insert(p); }, "Photo restored."); } } });
      });
    };
  }

  A.views.photos = {
    render: function (host) {
      P.host = host;
      host.innerHTML = A.topbar("Photos", '<label class="btn sm" style="cursor:pointer">' + A.ico("plus") + 'Add photos<input id="pfile" type="file" accept="image/*" multiple class="sr"></label>') +
        '<div class="toolbar"><div class="chips" id="pchips"></div></div><p class="muted sm" id="pnote" style="margin:-4px 0 12px"></p><div class="drop" id="drop">Drop images here to add them to this section</div><div class="pgrid" id="pgrid"><div class="muted">Loading photos...</div></div>';
      var drop = host.querySelector("#drop");
      ["dragenter", "dragover"].forEach(function (ev) { document.body.addEventListener(ev, onOver); });
      function onOver(e) { if (A.state.tab !== "photos") return; e.preventDefault(); drop.classList.add("over"); }
      host.addEventListener("dragleave", function (e) { if (e.target === drop) drop.classList.remove("over"); });
      host.addEventListener("dragover", function (e) { e.preventDefault(); drop.classList.add("over"); });
      host.addEventListener("drop", function (e) { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
      host.querySelector("#pfile").onchange = function (e) { addFiles(e.target.files); e.target.value = ""; };
      load().then(draw).catch(function (e) { host.querySelector("#pgrid").innerHTML = '<div class="notice err" style="grid-column:1/-1">Could not load photos: ' + A.esc(e.message) + "</div>"; });
    }
  };
})();
