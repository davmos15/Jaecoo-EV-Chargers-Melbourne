/* EV Charger Finder — app logic
   Dependencies (global): L (Leaflet), CHARGERS, CHARGER_DATA_VERIFIED */
(function () {
  "use strict";

  var ROADF = 1.35;                 // straight-line -> rough by-road factor (estimate only)
  var STORE_KEY = "evcf.settings.v1";
  var COL = { free: "#15a34a", partial: "#e08600", paid: "#2f5ad0" };

  var state = {
    home: null,                     // {label, lat, lng}
    work: null,
    filter: "all",
    speed: "all",
    sort: "home",
    query: "",
    selected: -1,
    drivingDone: false
  };

  /* ---------- storage (safe) ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        state.home = s.home || null;
        state.work = s.work || null;
      }
    } catch (e) { /* file:// or privacy mode — fall back to in-memory */ }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ home: state.home, work: state.work }));
    } catch (e) { /* ignore */ }
  }

  /* ---------- geometry ---------- */
  function haversineKm(a, b) {
    var R = 6371, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    var s = Math.sin(dLat / 2) ** 2 +
            Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  /* ---------- map ---------- */
  var tileLayers = {
    street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
    }),
    satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community"
    }),
    dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
    })
  };
  var activeBaseLayer = tileLayers.street;
  var map = L.map("map", { scrollWheelZoom: true })
             .setView([-37.92, 145.05], 12);
  activeBaseLayer.addTo(map);

  document.getElementById("layerBtns").addEventListener("click", function (e) {
    var btn = e.target.closest(".lbtn");
    if (!btn) return;
    var key = btn.getAttribute("data-layer");
    if (!tileLayers[key] || tileLayers[key] === activeBaseLayer) return;
    map.removeLayer(activeBaseLayer);
    activeBaseLayer = tileLayers[key];
    activeBaseLayer.addTo(map);
    Array.prototype.forEach.call(document.querySelectorAll(".lbtn"), function (b) {
      b.classList.toggle("on", b === btn);
    });
  });

  var markers = [];
  CHARGERS.forEach(function (c, i) {
    var m = L.circleMarker([c.lat, c.lng], {
      radius: 8, weight: 2.5, color: "#fff",
      fillColor: COL[c.t], fillOpacity: 1,
      dashArray: c.v ? "4 3" : null
    }).addTo(map);
    m.bindPopup(popupHtml(c), {
      closeButton: true,
      autoPan: true,
      autoPanPadding: [30, 90],
      maxWidth: 300
    });
    m.on("click", function () { selectCharger(i, false); });
    markers.push(m);
  });

  function anchorIcon(ring, letter) {
    return L.divIcon({
      className: "",
      iconSize: [26, 26], iconAnchor: [13, 13],
      html: '<div style="width:22px;height:22px;border-radius:50%;background:#16202e;' +
            'border:3px solid ' + ring + ';display:flex;align-items:center;justify-content:center;' +
            'color:#fff;font:700 12px sans-serif;box-shadow:0 1px 5px rgba(0,0,0,.5)">' + letter + '</div>'
    });
  }
  var homeMarker = null, workMarker = null;
  function placeAnchor(which) {
    var pt = state[which];
    if (which === "home" && homeMarker) { map.removeLayer(homeMarker); homeMarker = null; }
    if (which === "work" && workMarker) { map.removeLayer(workMarker); workMarker = null; }
    if (!pt) return;
    var mk = L.marker([pt.lat, pt.lng], {
      icon: anchorIcon(which === "home" ? "#ffd23f" : "#5ad0c4", which === "home" ? "H" : "W"),
      zIndexOffset: 1000
    }).addTo(map).bindPopup("<div class='pop'><h3>" + (which === "home" ? "Home" : "Work") +
      "</h3><div class='prow'>" + escapeHtml(pt.label) + "</div></div>");
    if (which === "home") homeMarker = mk; else workMarker = mk;
  }

  /* ---------- geocoding (Nominatim) ---------- */
  function geocode(q) {
    var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=" +
              encodeURIComponent(q);
    return fetch(url, { headers: { "Accept": "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("lookup failed"); return r.json(); })
      .then(function (d) {
        if (!d || !d.length) throw new Error("Address not found — try adding the suburb & state.");
        return { label: d[0].display_name, lat: +d[0].lat, lng: +d[0].lon };
      });
  }

  /* ---------- routing matrix (OSRM) ---------- */
  function calcDriving() {
    var refs = [];
    if (state.home) refs.push({ key: "home", pt: state.home });
    if (state.work) refs.push({ key: "work", pt: state.work });
    if (!refs.length) return;

    var pts = refs.map(function (r) { return r.pt; }).concat(CHARGERS);
    var coords = pts.map(function (p) { return p.lng + "," + p.lat; }).join(";");
    var srcIdx = refs.map(function (_, i) { return i; }).join(";");
    var dstIdx = CHARGERS.map(function (_, i) { return refs.length + i; }).join(";");
    var url = "https://router.project-osrm.org/table/v1/driving/" + coords +
              "?annotations=distance,duration&sources=" + srcIdx + "&destinations=" + dstIdx;

    setCalc("Calculating…", "");
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("routing failed"); return r.json(); })
      .then(function (data) {
        if (data.code !== "Ok") throw new Error(data.message || "routing error");
        refs.forEach(function (ref, row) {
          CHARGERS.forEach(function (c, j) {
            var dist = data.distances[row][j];
            var dur = data.durations[row][j];
            var km = dist == null ? null : dist / 1000;
            var min = dur == null ? null : dur / 60;
            if (ref.key === "home") { c.driveH_km = km; c.driveH_min = min; }
            else { c.driveW_km = km; c.driveW_min = min; }
          });
        });
        state.drivingDone = true;
        setCalc("Driving distances updated.", "ok");
        render();
      })
      .catch(function (err) {
        setCalc("Couldn't fetch driving distances (" + err.message + "). Showing estimates.", "err");
      });
  }
  function invalidateDriving() {
    state.drivingDone = false;
    CHARGERS.forEach(function (c) {
      c.driveH_km = c.driveH_min = c.driveW_km = c.driveW_min = undefined;
    });
  }

  /* ---------- distance helpers ---------- */
  function estKm(c, which) {
    var ref = state[which];
    if (!ref) return null;
    return haversineKm(ref, c) * ROADF;
  }
  function driveKm(c, which) { return which === "home" ? c.driveH_km : c.driveW_km; }
  function driveMin(c, which) { return which === "home" ? c.driveH_min : c.driveW_min; }
  function sortKmFor(c, which) {
    var d = driveKm(c, which);
    if (d != null) return d;
    var e = estKm(c, which);
    return e == null ? Infinity : e;
  }

  /* ---------- price sort helper ---------- */
  function costToNum(c) {
    var s = c.cost.toLowerCase();
    if (c.t === "free") return 0;
    if (s.indexOf("unverified") !== -1 || s.indexOf("varies") !== -1) return 999;
    if (s.indexOf("electricity free") !== -1) return 0.05;
    var m = c.cost.match(/\$(\d+\.?\d*)/);
    if (!m) return 999;
    var val = parseFloat(m[1]);
    return c.t === "partial" ? val * 0.75 : val;
  }

  /* ---------- rendering ---------- */
  function tagLabel(t) { return t === "free" ? "FREE" : t === "partial" ? "FREE ALLOWANCE" : "PAID"; }
  function isDC(c) { return /DC/.test(c.kw); }
  function gmapsDir(c) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + c.lat + "," + c.lng + "&travelmode=driving";
  }
  function gmapsDet(c) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.n + " " + c.a);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[m];
    });
  }
  function distPillHtml(c, which) {
    var label = which === "home" ? "Home" : "Work";
    if (!state[which]) return '<span class="pill none"><b>' + label + '</b>set address</span>';
    var dkm = driveKm(c, which), dmin = driveMin(c, which);
    if (dkm != null) {
      return '<span class="pill"><b>' + label + '</b>' + dkm.toFixed(1) + ' km · ' +
             Math.round(dmin) + ' min</span>';
    }
    var e = estKm(c, which);
    return '<span class="pill"><b>' + label + '</b>≈' + e.toFixed(1) + ' km</span>';
  }

  function popupHtml(c) {
    var soft = c.t === "free" ? "#e7f6ec" : c.t === "partial" ? "#fbf0dd" : "#e7edfb";
    return '<div class="pop">' +
      '<span class="ptag" style="background:' + soft + ';color:' + COL[c.t] + '">' + tagLabel(c.t) + '</span>' +
      '<h3>' + escapeHtml(c.n) + '</h3>' +
      '<div class="pn">' + escapeHtml(c.net) + '</div>' +
      '<div class="prow">' + escapeHtml(c.a) + '</div>' +
      '<div class="prow"><b>' + escapeHtml(c.kw) + '</b></div>' +
      '<div class="prow">Cost: <b>' + escapeHtml(c.cost) + '</b></div>' +
      '<div class="prow">Cable: <b>' + escapeHtml(c.cable) + '</b></div>' +
      '<div class="prow" id="popdist-' + cid(c) + '"></div>' +
      '<div class="pnote">' + escapeHtml(c.note) + '</div>' +
      '<div class="pacts">' +
        '<a class="dir" href="' + gmapsDir(c) + '" target="_blank" rel="noopener">Directions</a>' +
        '<a class="det" href="' + gmapsDet(c) + '" target="_blank" rel="noopener">Details</a>' +
      '</div></div>';
  }
  function cid(c) { return CHARGERS.indexOf(c); }
  function popupDistText(c) {
    function part(which, label) {
      if (!state[which]) return "";
      var dkm = driveKm(c, which), dmin = driveMin(c, which);
      if (dkm != null) return label + " " + dkm.toFixed(1) + " km · " + Math.round(dmin) + " min";
      var e = estKm(c, which);
      return label + " ≈" + e.toFixed(1) + " km";
    }
    var bits = [part("home", "Home"), part("work", "Work")].filter(Boolean);
    return bits.length ? bits.join("  ·  ") : "Set an address to see distance";
  }

  var listEl = document.getElementById("list");
  var countEl = document.getElementById("count");

  function visible() {
    var q = state.query.trim().toLowerCase();
    return CHARGERS.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) {
      var c = o.c;
      if (state.filter === "free" && !(c.t === "free" || c.t === "partial")) return false;
      if (state.filter === "paid" && c.t !== "paid") return false;
      if (state.speed === "dc" && !isDC(c)) return false;
      if (state.speed === "ac" && isDC(c)) return false;
      if (q && (c.n + " " + c.net + " " + c.a).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function render() {
    var rows = visible();
    var sk = state.sort;
    if (sk === "name") {
      rows.sort(function (a, b) { return a.c.n.localeCompare(b.c.n); });
    } else if (sk === "price") {
      rows.sort(function (a, b) { return costToNum(a.c) - costToNum(b.c); });
    } else {
      rows.sort(function (a, b) { return sortKmFor(a.c, sk) - sortKmFor(b.c, sk); });
    }

    var sortNote = "";
    if ((sk === "home" || sk === "work") && !state[sk]) sortNote = " · set your " + sk + " address to sort by distance";
    var sortLabel = sk === "name" ? "" : sk === "price" ? " · sorted by price" :
      " · sorted by " + (state.drivingDone ? "driving" : "estimated") + " distance from " + sk;
    countEl.textContent = rows.length + " charger" + (rows.length !== 1 ? "s" : "") + " shown" + sortLabel + sortNote;

    // dim filtered-out markers
    var shown = {};
    rows.forEach(function (o) { shown[o.i] = true; });
    markers.forEach(function (m, i) {
      var on = !!shown[i];
      m.setStyle({ fillOpacity: on ? 1 : 0.2, opacity: on ? 1 : 0.25 });
    });

    listEl.innerHTML = rows.map(function (o) {
      var c = o.c;
      return '<li class="card ' + c.t + (c.v ? " verify" : "") + (o.i === state.selected ? " sel" : "") +
        '" data-i="' + o.i + '" tabindex="0" role="button" aria-label="' + escapeHtml(c.n) + '">' +
        '<div class="ctop"><div><div class="cname">' + escapeHtml(c.n) + '</div>' +
        '<div class="net">' + escapeHtml(c.net) + '</div></div>' +
        '<span class="tag ' + c.t + '">' + tagLabel(c.t) + '</span></div>' +
        '<div class="addr">' + escapeHtml(c.a) + '</div>' +
        '<div class="specs">' +
          '<div class="spec"><span class="k">Speed</span><span class="v">' + escapeHtml(c.kw) + '</span></div>' +
          '<div class="spec"><span class="k">Cost</span><span class="v">' + escapeHtml(c.cost) + '</span></div>' +
          '<div class="spec"><span class="k">Cable</span><span class="v">' + escapeHtml(c.cable) + '</span></div>' +
          '<div class="spec"><span class="k">Compatible</span><span class="v">' +
            (c.net === "Tesla" && isDC(c) ? "Yes · via app" : "Yes") + '</span></div>' +
        '</div>' +
        '<div class="dist">' + distPillHtml(c, "home") + distPillHtml(c, "work") + '</div>' +
        '<div class="note">' + escapeHtml(c.note) + '</div>' +
        '<div class="acts">' +
          '<a class="dir" href="' + gmapsDir(c) + '" target="_blank" rel="noopener">Directions</a>' +
          '<a class="det" href="' + gmapsDet(c) + '" target="_blank" rel="noopener">Details / website</a>' +
        '</div></li>';
    }).join("");

    Array.prototype.forEach.call(listEl.querySelectorAll(".card"), function (el) {
      el.addEventListener("click", function (ev) {
        if (ev.target.tagName === "A") return;
        selectCharger(+el.dataset.i, true);
      });
      el.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectCharger(+el.dataset.i, true); }
      });
    });
  }

  // selecting from MAP (fromList=false): show popup on map only, highlight card without scrolling.
  // selecting from LIST (fromList=true): fly to it then open the popup once the pan finishes.
  function selectCharger(i, fromList) {
    state.selected = i;
    Array.prototype.forEach.call(listEl.querySelectorAll(".card"), function (el) {
      el.classList.toggle("sel", +el.dataset.i === i);
    });
    var c = CHARGERS[i];
    function openAndFillPopup() {
      markers[i].openPopup();
      setTimeout(function () {
        var slot = document.getElementById("popdist-" + i);
        if (slot) slot.textContent = popupDistText(c);
      }, 0);
    }
    if (fromList) {
      map.once("moveend", openAndFillPopup);
      map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    } else {
      openAndFillPopup();
    }
  }

  /* ---------- address setup ---------- */
  function setStatus(el, msg, cls) { el.textContent = msg; el.className = "status" + (cls ? " " + cls : ""); }
  function setCalc(msg, cls) {
    var el = document.getElementById("calcStatus");
    el.textContent = msg; el.className = "status inline" + (cls ? " " + cls : "");
  }
  function refreshCalcBtn() {
    document.getElementById("calcBtn").disabled = !(state.home || state.work);
  }

  function wireAddress(which) {
    var input  = document.getElementById(which + "Input");
    var status = document.getElementById(which + "Status");
    var acList = document.getElementById(which + "Ac");
    var acTimer = null;
    var acIndex = -1;
    var acItems = [];

    if (state[which]) { input.value = state[which].label; setStatus(status, "Saved.", "ok"); }

    function closeAc() {
      acList.hidden = true;
      acItems = [];
      acIndex = -1;
    }

    function highlightAc(idx) {
      acIndex = idx;
      Array.prototype.forEach.call(acList.children, function (li, i) {
        li.classList.toggle("ac-active", i === idx);
      });
    }

    function commit(q) {
      if (!q) { setStatus(status, "Type an address first.", "err"); return; }
      setStatus(status, "Locating…", "");
      closeAc();
      geocode(q).then(function (loc) {
        state[which] = loc;
        input.value = loc.label;
        save();
        placeAnchor(which);
        invalidateDriving();
        setCalc("", "");
        refreshCalcBtn();
        setStatus(status, "Saved ✓", "ok");
        render();
      }).catch(function (err) {
        setStatus(status, err.message, "err");
      });
    }

    function showAc(q) {
      if (q.length < 3) { closeAc(); return; }
      var url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=au&q=" +
                encodeURIComponent(q);
      fetch(url, { headers: { Accept: "application/json" } })
        .then(function (r) { return r.json(); })
        .then(function (results) {
          acList.innerHTML = "";
          acItems = results;
          acIndex = -1;
          if (!results.length) { closeAc(); return; }
          results.forEach(function (r) {
            var li = document.createElement("li");
            li.className = "ac-item";
            li.textContent = r.display_name;
            li.addEventListener("pointerdown", function (e) {
              e.preventDefault();
              input.value = r.display_name;
              closeAc();
              commit(r.display_name);
            });
            acList.appendChild(li);
          });
          acList.hidden = false;
        })
        .catch(function () { closeAc(); });
    }

    input.addEventListener("input", function () {
      clearTimeout(acTimer);
      acTimer = setTimeout(function () { showAc(input.value.trim()); }, 280);
    });

    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { closeAc(); return; }
      if (!acList.hidden && acItems.length) {
        if (ev.key === "ArrowDown") {
          ev.preventDefault(); highlightAc((acIndex + 1) % acItems.length); return;
        }
        if (ev.key === "ArrowUp") {
          ev.preventDefault(); highlightAc((acIndex - 1 + acItems.length) % acItems.length); return;
        }
        if (ev.key === "Enter") {
          ev.preventDefault();
          if (acIndex >= 0) { input.value = acItems[acIndex].display_name; closeAc(); commit(input.value); }
          else { closeAc(); commit(input.value.trim()); }
          return;
        }
      }
      if (ev.key === "Enter") { ev.preventDefault(); commit(input.value.trim()); }
    });

    input.addEventListener("blur", function () { setTimeout(closeAc, 150); });

    document.getElementById(which + "Set").addEventListener("click", function () {
      closeAc(); commit(input.value.trim());
    });

    document.getElementById(which + "Clear").addEventListener("click", function () {
      state[which] = null;
      input.value = "";
      closeAc();
      save();
      placeAnchor(which);
      invalidateDriving();
      refreshCalcBtn();
      setStatus(status, "Cleared.", "");
      render();
    });
  }

  /* ---------- controls ---------- */
  function wireSeg(id, key, attr) {
    document.getElementById(id).addEventListener("click", function (e) {
      var v = e.target.getAttribute(attr);
      if (!v) return;
      state[key] = v;
      Array.prototype.forEach.call(e.currentTarget.children, function (b) {
        b.classList.toggle("on", b === e.target);
      });
      render();
    });
  }

  /* ---------- init ---------- */
  load();
  document.getElementById("verified").textContent = (window.CHARGER_DATA_VERIFIED || "—");
  wireAddress("home");
  wireAddress("work");
  placeAnchor("home");
  placeAnchor("work");
  refreshCalcBtn();
  wireSeg("filter", "filter", "data-f");
  wireSeg("speed", "speed", "data-sp");
  document.getElementById("sortSel").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  document.getElementById("q").addEventListener("input", function (e) { state.query = e.target.value; render(); });
  document.getElementById("calcBtn").addEventListener("click", calcDriving);

  /* ---------- view toggle ---------- */
  var mapEl = document.getElementById("map");
  var listWrap = document.querySelector("main.wrap");

  function applyView(v) {
    mapEl.style.display    = (v === "list") ? "none" : "";
    listWrap.style.display = (v === "map")  ? "none" : "";
    if (v !== "list") { setTimeout(function () { map.invalidateSize(); }, 0); }
  }

  document.getElementById("viewToggle").addEventListener("click", function (e) {
    var v = e.target.getAttribute("data-v");
    if (!v) return;
    Array.prototype.forEach.call(e.currentTarget.children, function (b) {
      b.classList.toggle("on", b === e.target);
    });
    applyView(v);
  });

  /* ---------- fullscreen map ---------- */
  var fsBtn = document.getElementById("fsBtn");
  var isFull = false;
  fsBtn.addEventListener("click", function () {
    isFull = !isFull;
    document.body.classList.toggle("map-fs", isFull);
    fsBtn.textContent = isFull ? "✕" : "⛶";
    fsBtn.title = isFull ? "Exit fullscreen" : "Toggle fullscreen map";
    setTimeout(function () { map.invalidateSize(); }, 50);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isFull) { fsBtn.click(); }
  });

  // fit map to chargers initially
  try {
    var grp = L.featureGroup(markers);
    map.fitBounds(grp.getBounds().pad(0.15));
  } catch (e) { /* keep default view */ }

  render();
})();
