/* Màn "quay số" ngày sinh nhật 16/09 — hiện ngay sau khi gạt công tắc đèn. */
(function () {
  "use strict";

  var DIAL_DAY = 16;
  var DIAL_MONTH = 9;
  var MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var STARS = [
    { x: 16, y: 24, size: 15, d: 0 },
    { x: 80, y: 18, size: 10, d: 0.6 },
    { x: 64, y: 62, size: 13, d: 1.1 },
    { x: 28, y: 66, size: 9, d: 0.3 },
    { x: 86, y: 48, size: 12, d: 0.9 },
    { x: 44, y: 12, size: 11, d: 1.4 },
    { x: 10, y: 78, size: 12, d: 1.8 },
  ];
  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function balloon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "dial-balloon");
    svg.setAttribute("width", "52");
    svg.setAttribute("height", "72");
    svg.setAttribute("viewBox", "0 0 52 72");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "#e8cf94");
    svg.setAttribute("stroke-width", "1.4");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    [
      ["ellipse", { cx: 18, cy: 19, rx: 12, ry: 15 }],
      ["ellipse", { cx: 36, cy: 26, rx: 10, ry: 13 }],
      ["path", { d: "M18 34 C 18 43, 26 47, 25 58" }],
      ["path", { d: "M36 39 C 36 46, 30 50, 30 58" }],
      ["path", { d: "M21 58 q 4 5 8 0" }],
    ].forEach(function (n) {
      var e = document.createElementNS(ns, n[0]);
      for (var k in n[1]) e.setAttribute(k, n[1][k]);
      svg.appendChild(e);
    });
    return svg;
  }

  function build() {
    var s = el("div", "lg-dial");
    s.setAttribute("aria-hidden", "true");

    var stars = el("div", "dial-stars");
    STARS.forEach(function (st) {
      var sp = el("span", "dial-star", "\u2726");
      sp.style.left = st.x + "%";
      sp.style.top = st.y + "%";
      sp.style.fontSize = st.size + "px";
      sp.style.animationDelay = st.d + "s";
      stars.appendChild(sp);
    });
    s.appendChild(stars);

    [false, true].forEach(function (left) {
      var w = el("div", "dial-balloon-wrap" + (left ? " is-left" : ""));
      w.appendChild(balloon());
      s.appendChild(w);
    });

    var win = el("div", "dial-window");
    var reel = el("div", "dial-reel");
    var days = MONTH_DAYS[DIAL_MONTH - 1];
    for (var t = 0; t < 23; t++) {
      var n = ((((DIAL_DAY - 1 + (t - 18)) % days) + days) % days) + 1;
      var cell = el("div", "dial-cell", String(n));
      if (t === 18) cell.style.opacity = "0";
      reel.appendChild(cell);
    }
    win.appendChild(reel);

    var ov = el("div", "dial-overlay");
    ov.appendChild(el("span", "dial-glow"));
    ov.appendChild(el("span", "dial-arrow", "\u2192"));
    ov.appendChild(el("span", "dial-day", String(DIAL_DAY)));
    ov.appendChild(el("span", "dial-month", "Th\u00e1ng " + DIAL_MONTH));
    win.appendChild(ov);
    s.appendChild(win);
    return s;
  }

  var shown = false;
  function show() {
    if (shown) return;
    shown = true;
    var node = build();
    document.body.appendChild(node);
    window.setTimeout(function () {
      node.classList.add("is-out");
    }, reduced ? 2400 : 4800);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, reduced ? 3100 : 5600);
  }

  function stage() {
    var n = document.querySelector("[data-sp-stage]");
    return n ? n.getAttribute("data-sp-stage") : null;
  }

  var wasDark = false;
  var obs = new MutationObserver(function () {
    var st = stage();
    if (st === "dark") wasDark = true;
    else if (wasDark && st) show();
  });
  obs.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-sp-stage"],
  });

  if (stage() === "dark") wasDark = true;
})();
