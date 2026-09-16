/*
 * Cầu nối 3 phần trải nghiệm:
 *   1) Phần sinh nhật (chính là trang này) - dừng lại trước 2 cảnh cuối "keepsake" và "share"
 *   2) Phần "Giữ để bắt đầu" (thư mục intro/)
 *   3) Phần trái tim 3D (thư mục heart/)
 * Cách hoạt động: theo dõi thuộc tính data-sp-stage của phần sinh nhật.
 * Khi sắp vào cảnh keepsake/share thì phủ ngay iframe intro lên trên, rồi tới heart.
 */
(function () {
  "use strict";

  var STOP_STAGES = { keepsake: 1, share: 1 };
  var layer = null;
  var current = null; // "intro" | "heart"
  var busy = false;

  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "merge-layer";
    layer.setAttribute("aria-live", "polite");
    layer.style.cssText =
      "position:fixed;inset:0;z-index:2147483000;background:#050107;display:none;";
    document.body.appendChild(layer);
    return layer;
  }

  function stopPageMedia(root) {
    try {
      var list = root.querySelectorAll("audio, video");
      for (var i = 0; i < list.length; i++) {
        try {
          list[i].pause();
          list[i].muted = true;
        } catch (_) {}
      }
    } catch (_) {}
  }

  function makeFrame(src, title) {
    var f = document.createElement("iframe");
    f.title = title;
    f.setAttribute("allow", "autoplay; fullscreen");
    f.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity 500ms ease;background:#050107;";
    f.src = src;
    return f;
  }

  function fadeInFrame(f) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        f.style.opacity = "1";
      });
    });
  }

  function goIntro() {
    if (busy || current) return;
    busy = true;
    current = "intro";

    // Tắt nhạc và ẩn hẳn phần sinh nhật để không còn tiếng hay hiệu ứng chạy ngầm
    stopPageMedia(document);
    try {
      if (window.__hbStopMusic) window.__hbStopMusic();
    } catch (_) {}

    // Bật ngay nhạc trái tim từ màn "giữ để bắt đầu", giữ liền mạch sang heart
    try {
      if (!window.__hbHeartAudio) {
        var ha = new Audio("heart/music.mp3");
        ha.loop = true;
        ha.volume = 0.6;
        window.__hbHeartAudio = ha;
      }
      window.__hbHeartAudio.play().catch(function () {});
    } catch (_) {}

    var host = ensureLayer();
    host.style.display = "block";
    var f = makeFrame("intro/index.html", "Giữ để bắt đầu");
    host.appendChild(f);
    f.addEventListener("load", function () {
      fadeInFrame(f);
      window.setTimeout(function () {
        try {
          document.documentElement.style.overflow = "hidden";
          var root = document.querySelector("[data-sp-stage]");
          if (root) root.style.display = "none";
          stopPageMedia(document);
        } catch (_) {}
        busy = false;
      }, 600);
    });
    // Phòng trường hợp iframe báo load chậm
    window.setTimeout(function () {
      if (f.style.opacity !== "1") fadeInFrame(f);
      busy = false;
    }, 2500);
  }

  function goHeart() {
    if (current === "heart") return;
    current = "heart";
    var host = ensureLayer();
    var old = host.firstChild;
    try {
      if (old && old.contentDocument) stopPageMedia(old.contentDocument);
    } catch (_) {}
    var f = makeFrame("heart/index.html?music=parent", "Trái tim yêu thương");
    f.style.zIndex = "2";
    host.appendChild(f);
    f.addEventListener("load", function () {
      fadeInFrame(f);
      window.setTimeout(function () {
        try {
          if (old && old.parentNode) old.parentNode.removeChild(old);
        } catch (_) {}
      }, 600);
    });
  }

  // Nhận tín hiệu "giữ để bắt đầu" xong từ phần intro
  window.addEventListener("message", function (e) {
    if (!e.data || e.data.type !== "lovegift:textStart") return;
    goHeart();
  });

  // Theo dõi cảnh của phần sinh nhật
  function currentStage() {
    var node = document.querySelector("[data-sp-stage]");
    return node ? node.getAttribute("data-sp-stage") : "";
  }
  function check() {
    if (STOP_STAGES[currentStage()]) goIntro();
  }
  var obs = new MutationObserver(check);
  obs.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-sp-stage"]
  });
  check();
  window.setInterval(check, 300);
})();
