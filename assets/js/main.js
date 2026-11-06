/* 모서리 공작소 — main.js (vanilla, 의존성 없음) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("ko-KR");

  /* ---------- 1. 목재 슬랫 셔터 전환 ---------- */
  const shutter = $(".shutter");
  if (shutter) {
    const slats = $$("i", shutter);
    const n = slats.length;
    const stagger = (dir) => slats.forEach((s, i) => {
      const k = dir === "in" ? i : n - 1 - i;
      s.style.transitionDelay = `${k * 0.045}s`;
    });
    const open = () => {
      stagger("in");
      void shutter.offsetWidth; // rAF가 멈춘 백그라운드 탭에서도 열리도록 reflow 후 바로 전환
      shutter.classList.remove("closing");
      shutter.classList.add("open");
      clearTimeout(shutter._t);
      shutter._t = setTimeout(() => (shutter.style.visibility = "hidden"), 800 + n * 45);
    };
    if (reduce) { shutter.classList.add("open"); shutter.style.visibility = "hidden"; } else setTimeout(open, 120);
    window.addEventListener("pageshow", (e) => { if (e.persisted) open(); });

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a || reduce) return;
      const href = a.getAttribute("href") || "";
      if (a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (!/\.html(\?.*)?$/.test(href) || href.startsWith("http")) return;
      e.preventDefault();
      const label = $(".sh-label", shutter);
      if (label) label.textContent = a.dataset.label || a.textContent.trim().replace(/\s+/g, " ");
      stagger("out");
      clearTimeout(shutter._t);
      shutter.style.visibility = "visible";
      shutter.classList.remove("open");
      shutter.classList.add("closing");
      setTimeout(() => (location.href = href), 750 + n * 45);
    });
  }

  /* ---------- 헤더 / 메뉴 ---------- */
  const hd = $(".hd");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (hd) {
      hd.classList.toggle("solid", y > 40);
      hd.classList.toggle("hide", y > 300 && y > lastY && !document.body.classList.contains("menu-open"));
    }
    lastY = y;
  }, { passive: true });
  $(".menu-btn")?.addEventListener("click", () => {
    const on = document.body.classList.toggle("menu-open");
    $(".menu-btn").setAttribute("aria-expanded", on);
  });

  /* ---------- 2. 줄자 커서 ---------- */
  if (fine && $(".ruler-x")) {
    document.body.classList.add("has-cursor");
    const mx = $(".ruler-x .mark"), my = $(".ruler-y .mark");
    const tx = $(".ruler-x .tag"), ty = $(".ruler-y .tag");
    const dot = $(".cursor-dot");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      dot.classList.toggle("hot", !!e.target.closest("a, button, [data-hot], input, select, textarea, label"));
    });
    // 1px ≈ 0.2646mm, 1:50 축척 도면이라고 가정해 실제 치수로 환산
    const toMM = (px) => fmt(px * 0.2646 * 50);
    const tick = () => {
      cx = lerp(cx, x, 0.35); cy = lerp(cy, y, 0.35);
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      mx.style.transform = `translateX(${x}px)`;
      my.style.transform = `translateY(${y}px)`;
      tx.style.left = `${x}px`; ty.style.top = `${y}px`;
      tx.textContent = `${toMM(x)}`;
      ty.textContent = `${toMM(y + scrollY)}`;
      requestAnimationFrame(tick);
    };
    dot.style.left = dot.style.top = "0px";
    tick();
  }

  /* ---------- 등장 옵저버 ---------- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".rise, .split, .ph.reveal, .pencil, .sign, .corner-card, [data-count]").forEach((el) => io.observe(el));

  /* 숫자 카운트 */
  const countIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
        el.firstChild.nodeValue = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- 치수선 주입 ---------- */
  $$(".dim").forEach((el) => {
    const w = el.dataset.w, h = el.dataset.h;
    if (w) el.insertAdjacentHTML("beforeend", `<span class="dx"><b>${w}</b></span>`);
    if (h) el.insertAdjacentHTML("beforeend", `<span class="dy"><b>${h}</b></span>`);
  });

  /* ---------- 3. 블라인드 히어로 ---------- */
  const blinds = $(".blinds");
  if (blinds) {
    const src = blinds.dataset.img;
    const img = new Image();
    let slats = [], intro = true, mouseT = 0, mouse = 0;
    const cord = $(".cord", blinds);
    const build = () => {
      $$(".slat", blinds).forEach((s) => s.remove());
      const W = blinds.clientWidth, H = blinds.clientHeight;
      const N = W < 700 ? 9 : 14;
      const h = H / N;
      const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const bw = img.naturalWidth * sc, bh = img.naturalHeight * sc;
      const ox = (W - bw) / 2, oy = (H - bh) / 2;
      slats = [];
      for (let i = 0; i < N; i++) {
        const s = document.createElement("div");
        s.className = "slat";
        s.style.top = `${i * h}px`;
        s.style.height = `${h + 1}px`;
        s.style.backgroundImage = `url(${src})`;
        s.style.backgroundSize = `${bw}px ${bh}px`;
        s.style.backgroundPosition = `${ox}px ${oy - i * h}px`;
        if (!intro) s.style.transition = "transform .35s cubic-bezier(.16,1,.3,1)";
        blinds.insertBefore(s, cord);
        slats.push(s);
      }
    };
    const apply = () => {
      const r = blinds.getBoundingClientRect();
      const sp = clamp(-r.top / (r.height * 0.9), 0, 1); // 스크롤로 아래로 지나가면 블라인드가 닫힌다
      mouse = lerp(mouse, mouseT, 0.12);
      const ang = clamp(mouse * 16 + sp * 80, -30, 86);
      slats.forEach((s, i) => {
        s.style.transform = `rotateX(${-(ang + (sp ? i * sp * 0.6 : 0))}deg)`;
        s.style.setProperty("--sh", (Math.abs(ang) / 90 * 0.55).toFixed(3));
      });
      if (cord) cord.style.setProperty("--cord", `${20 + sp * 60}%`);
    };
    img.onload = () => {
      build();
      if (reduce) { slats.forEach((s) => (s.style.transform = "none")); return; }
      requestAnimationFrame(() => {
        slats.forEach((s, i) => {
          s.style.transitionDelay = `${0.2 + i * 0.06}s`;
          s.style.transform = "rotateX(0deg)";
        });
      });
      setTimeout(() => {
        intro = false;
        slats.forEach((s) => { s.style.transitionDelay = "0s"; s.style.transition = "transform .35s cubic-bezier(.16,1,.3,1)"; });
        const loop = () => { apply(); requestAnimationFrame(loop); };
        loop();
      }, 200 + slats.length * 60 + 1200);
    };
    img.src = src;
    addEventListener("pointermove", (e) => {
      const r = blinds.getBoundingClientRect();
      mouseT = clamp((e.clientY - (r.top + r.height / 2)) / r.height, -0.6, 0.6);
    }, { passive: true });
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 150); });
  }

  /* ---------- 4. 평면도 드로잉 ---------- */
  const plan = $(".plan");
  if (plan) {
    const paths = $$(".plan-draw path, .plan-draw line, .plan-draw rect.w", plan);
    paths.forEach((p) => {
      const L = p.getTotalLength ? p.getTotalLength() : 1000;
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
      p.dataset.len = L;
    });
    const marks = $$("[data-at]", plan);
    const upd = () => {
      const r = plan.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.75), 0, 1);
      paths.forEach((el, i) => {
        const s = (i / paths.length) * 0.6, e = s + 0.4;
        const t = clamp((p - s) / (e - s), 0, 1);
        el.style.strokeDashoffset = el.dataset.len * (1 - t);
      });
      marks.forEach((m) => m.classList.toggle("on", p >= parseFloat(m.dataset.at)));
    };
    addEventListener("scroll", upd, { passive: true }); upd();
  }

  /* 대표 사례 패럴랙스 */
  const feats = $$("[data-speed]");
  if (feats.length && !reduce) {
    const par = () => {
      feats.forEach((f) => {
        const r = f.getBoundingClientRect();
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        f.style.transform = `translateY(${c * parseFloat(f.dataset.speed) * -100}px)`;
      });
    };
    addEventListener("scroll", par, { passive: true }); par();
  }

  /* ---------- 5. 페인트 롤러 비포·애프터 ---------- */
  const ba = $(".ba-stage");
  if (ba) {
    const after = new Image(); after.src = ba.dataset.after;
    const cv = $("canvas", ba), ctx = cv.getContext("2d");
    const mask = document.createElement("canvas"), mctx = mask.getContext("2d");
    const roller = $(".roller", ba);
    let W, H, dpr, noise = [], rx = 0, drum = 32;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = ba.clientWidth; H = ba.clientHeight;
      const old = mask.width ? mctx.getImageData(0, 0, mask.width, mask.height) : null;
      const ow = mask.width;
      cv.width = mask.width = W * dpr; cv.height = mask.height = H * dpr;
      if (old && ow) { const t = document.createElement("canvas"); t.width = ow; t.height = old.height; t.getContext("2d").putImageData(old, 0, 0); mctx.drawImage(t, 0, 0, mask.width, mask.height); }
      noise = Array.from({ length: Math.ceil(H / 3) + 1 }, (_, i) => Math.sin(i * 0.9) * 3 + Math.sin(i * 0.23) * 4 + Math.random() * 5);
      draw();
    };
    const paint = (x0, x1) => {
      const a = Math.min(x0, x1) - drum / 2, b = Math.max(x0, x1) + drum / 2;
      mctx.fillStyle = "#000";
      const top = H * 0.08, bot = H * 0.92;
      // 롤러 폭만큼 칠하고, 양끝은 붓자국처럼 들쭉날쭉하게
      for (let i = 0; i < noise.length; i++) {
        const y = i * 3;
        const fade = y < top ? (y / top) : y > bot ? (H - y) / (H - bot) : 1;
        const ext = noise[i] * fade - (1 - fade) * 18;
        mctx.fillRect((a - ext) * dpr, y * dpr, (b - a + ext * 2) * dpr, 3.2 * dpr);
      }
      draw();
    };
    const cover = (im) => {
      const sc = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
      const w = im.naturalWidth * sc, h = im.naturalHeight * sc;
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
    };
    const draw = () => {
      if (!after.complete || !W) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, cv.width, cv.height);
      cover(after);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
    };
    const moveTo = (x, doPaint = true) => {
      x = clamp(x, 0, W);
      if (doPaint) paint(rx, x);
      rx = x;
      roller.style.transform = `translateX(${x - 60}px)`;
      roller.setAttribute("aria-valuenow", Math.round((x / W) * 100));
    };
    after.onload = () => { size(); moveTo(W * 0.04, false); };
    addEventListener("resize", () => { const p = rx / (W || 1); size(); moveTo(p * W, false); });

    let drag = false;
    const start = (e) => { drag = true; roller.classList.add("used"); roller.setPointerCapture?.(e.pointerId); };
    roller.addEventListener("pointerdown", start);
    ba.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".roller") || e.target.closest("button")) return;
      const r = ba.getBoundingClientRect(); moveTo(e.clientX - r.left, false); start(e);
    });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      const r = ba.getBoundingClientRect(); moveTo(e.clientX - r.left);
    });
    addEventListener("pointerup", () => (drag = false));
    roller.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { moveTo(rx + 30); e.preventDefault(); }
      if (e.key === "ArrowLeft") { moveTo(rx - 30); e.preventDefault(); }
    });
    $(".ba-reset")?.addEventListener("click", () => { mctx.clearRect(0, 0, mask.width, mask.height); moveTo(W * 0.04, false); draw(); });

    // 처음 보이면 롤러가 스스로 한 번 칠해서 사용법을 보여준다
    const demo = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || !W) return;
      demo.disconnect();
      if (reduce) { paint(0, W * 0.45); moveTo(W * 0.45, false); return; }
      const t0 = performance.now(), from = rx, to = W * 0.42;
      const go = (t) => {
        if (drag) return;
        const p = clamp((t - t0) / 1600, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        moveTo(lerp(from, to, e));
        if (p < 1) requestAnimationFrame(go);
      };
      setTimeout(() => requestAnimationFrame(go), 400);
    }, { threshold: 0.6 });
    demo.observe(ba);
  }

  /* ---------- 6. 조명 스위치 ---------- */
  const lights = $(".lights");
  if (lights) {
    const room = $(".room", lights);
    room.addEventListener("pointermove", (e) => {
      const r = room.getBoundingClientRect();
      room.style.setProperty("--mx", `${e.clientX - r.left}px`);
      room.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
    if (!fine) room.style.setProperty("--r", "40vw");
    const btn = $(".switch-plate button", lights);
    btn.addEventListener("click", () => {
      const on = lights.classList.toggle("on");
      btn.setAttribute("aria-pressed", on);
      $(".lights .state").textContent = on ? "켜짐 — 2700K 간접조명 4회로" : "꺼짐 — 커서로 비춰보세요";
    });
  }

  /* ---------- 7. 시공사례: 서랍 + FLIP 필터 + 벽지 상세 ---------- */
  const grid = $(".works-grid");
  if (grid && window.WORKS) {
    grid.innerHTML = WORKS.map((w, i) => `
      <button class="drawer rise" data-type="${w.type}" data-i="${i}" aria-label="${w.title} 상세 보기">
        <div class="front"><img src="${w.img}" alt="${w.alt}" loading="lazy"></div>
        <div class="meta"><b>${w.title}</b><span class="num">${String(i + 1).padStart(2, "0")}</span>
        <span>${w.place} · ${w.size}</span><span>${w.year}</span></div>
      </button>`).join("");
    $$(".drawer", grid).forEach((el) => io.observe(el));

    // 서랍이 마우스 쪽으로 살짝 기울어진다
    if (fine) $$(".drawer", grid).forEach((d) => {
      const f = $(".front", d);
      d.addEventListener("pointermove", (e) => {
        const r = d.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6, ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        f.style.transform = `translateZ(60px) translateY(-14px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      d.addEventListener("pointerleave", () => (f.style.transform = ""));
    });

    const count = $(".filter .count");
    const setCount = () => (count.textContent = `${$$(".drawer:not(.hidden)", grid).length}개의 집`);
    setCount();
    $$(".filter button").forEach((b) => b.addEventListener("click", () => {
      $$(".filter button").forEach((x) => x.classList.toggle("on", x === b));
      const t = b.dataset.f, items = $$(".drawer", grid);
      const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
      items.forEach((el) => { el.classList.toggle("hidden", t !== "all" && el.dataset.type !== t); el.classList.add("in"); });
      items.forEach((el) => {
        if (el.classList.contains("hidden")) return;
        const a = first.get(el), z = el.getBoundingClientRect();
        const wasHidden = a.width === 0;
        const dx = a.left - z.left, dy = a.top - z.top;
        el.animate(wasHidden
          ? [{ opacity: 0, transform: "translateY(40px) rotateX(-20deg)" }, { opacity: 1, transform: "none" }]
          : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: reduce ? 1 : 750, easing: "cubic-bezier(.77,0,.18,1)" });
      });
      setCount();
    }));

    const sheet = $(".sheet");
    const openSheet = (w) => {
      $(".sheet .ph img").src = w.img; $(".sheet .ph img").alt = w.alt;
      $(".sheet .s-title").textContent = w.title;
      $(".sheet .s-place").textContent = `${w.place} · ${w.year}`;
      $(".sheet .s-desc").textContent = w.desc;
      $(".sheet .spec").innerHTML = [["면적", w.size], ["공사 기간", w.weeks], ["범위", w.scope], ["공사비", w.cost]]
        .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
      $(".sheet .swatches").innerHTML = w.mat.map((m) => `<i title="${m[0]}" style="background:${m[1]}"></i>`).join("");
      $(".sheet .s-mat").textContent = w.mat.map((m) => m[0]).join(" / ");
      $(".sheet .s-cta").href = `contact.html?ref=${encodeURIComponent(w.title)}`;
      sheet.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("open")));
      document.documentElement.style.overflow = "hidden";
      $(".sheet .close").focus({ preventScroll: true });
    };
    const closeSheet = () => {
      sheet.classList.remove("open");
      document.documentElement.style.overflow = "";
      setTimeout(() => (sheet.hidden = true), 700);
    };
    grid.addEventListener("click", (e) => { const d = e.target.closest(".drawer"); if (d) openSheet(WORKS[d.dataset.i]); });
    $(".sheet .scrim").addEventListener("click", closeSheet);
    $(".sheet .close").addEventListener("click", closeSheet);
    addEventListener("keydown", (e) => { if (e.key === "Escape" && sheet.classList.contains("open")) closeSheet(); });
  }

  /* ---------- 8. 수평계 ---------- */
  const level = $(".level");
  if (level) {
    const bub = $(".bubble", level), deg = $(".level-deg");
    let v = 0, pos = 0, vel = 0, prevY = scrollY, tilt = 0;
    addEventListener("pointermove", (e) => { tilt = (e.clientX / innerWidth - 0.5) * 2; }, { passive: true });
    const loop = () => {
      const dy = scrollY - prevY; prevY = scrollY;
      v = lerp(v, clamp(dy, -60, 60), 0.15);
      const range = level.clientWidth / 2 - 50;
      const target = clamp(v * 2.2 + tilt * range * 0.5, -range, range);
      // 스프링: 액체 속 기포처럼 약간 늦게 따라오고 출렁인다
      vel = vel * 0.86 + (target - pos) * 0.045;
      pos += vel;
      bub.style.transform = `translateX(${pos}px) scaleX(${1 + Math.min(Math.abs(vel) / 30, 0.25)})`;
      if (deg) deg.textContent = `${(pos / range * 1.5).toFixed(2)}°`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- 9. 평수 견적 ---------- */
  const est = $(".estimator");
  if (est) {
    const range = $("#py", est), out = $(".pyeong .v", est);
    const rect = $(".room", est), dW = $("#dimW", est), dH = $("#dimH", est), tW = $("#txtW", est), tH = $("#txtH", est);
    const ZONES = {
      거실: [0.38, 0.0, 0.62, 0.55], 주방: [0.0, 0.0, 0.38, 0.4], 욕실: [0.0, 0.4, 0.22, 0.28],
      침실: [0.55, 0.55, 0.45, 0.45], 현관: [0.0, 0.82, 0.22, 0.18], 발코니: [0.38, 0.0, 0.62, 0.1], 붙박이장: [0.22, 0.55, 0.33, 0.45],
    };
    const COST = { 거실: [500, 800], 주방: [900, 1500], 욕실: [650, 950], 침실: [350, 600], 현관: [180, 320], 발코니: [400, 700], 붙박이장: [300, 650] };
    const S = 26; // px per m
    const won = (man) => {
      const eok = Math.floor(man / 10000), rest = Math.round((man % 10000) / 10) * 10;
      return eok ? `${eok}억${rest ? " " + fmt(rest) : ""}` : fmt(rest);
    };
    const upd = () => {
      const py = +range.value;
      out.textContent = py;
      const area = py * 3.3058, w = Math.sqrt(area * 1.35), h = area / w;
      const pw = w * S, ph = h * S, x = 250 - pw / 2, y = 260 - ph / 2;
      rect.setAttribute("x", x); rect.setAttribute("y", y); rect.setAttribute("width", pw); rect.setAttribute("height", ph);
      dW.setAttribute("x1", x); dW.setAttribute("x2", x + pw); dW.setAttribute("y1", y - 22); dW.setAttribute("y2", y - 22);
      dH.setAttribute("y1", y); dH.setAttribute("y2", y + ph); dH.setAttribute("x1", x - 22); dH.setAttribute("x2", x - 22);
      tW.setAttribute("x", x + pw / 2); tW.setAttribute("y", y - 30); tW.textContent = `${fmt(w * 1000)}`;
      tH.style.transform = `translate(${x - 30}px, ${y + ph / 2}px) rotate(-90deg)`; tH.textContent = `${fmt(h * 1000)}`;
      const scope = $("input[name=scope]:checked", est).value;
      const rooms = $$("input[name=room]:checked", est).map((c) => c.value);
      $$(".zone", est).forEach((z) => {
        const k = z.dataset.z, f = ZONES[k], on = scope === "full" || rooms.includes(k);
        z.setAttribute("x", x + f[0] * pw); z.setAttribute("y", y + f[1] * ph); z.setAttribute("width", f[2] * pw); z.setAttribute("height", f[3] * ph);
        z.classList.toggle("on", on);
        const t = $(`.zt[data-z="${k}"]`, est);
        if (t) { t.setAttribute("x", x + (f[0] + f[2] / 2) * pw); t.setAttribute("y", y + (f[1] + f[3] / 2) * ph + 4); t.classList.toggle("on", on); }
      });
      $$("input[name=room]", est).forEach((c) => (c.disabled = scope === "full"));
      let lo, hi, wk;
      if (scope === "full") { lo = py * 210; hi = py * 270; wk = [Math.round(4 + py / 9), Math.round(6 + py / 8)]; }
      else {
        const k = 0.75 + (py / 60) * 0.5;
        lo = rooms.reduce((s, r) => s + COST[r][0], 0) * k; hi = rooms.reduce((s, r) => s + COST[r][1], 0) * k;
        wk = [Math.max(1, Math.round(rooms.length * 0.7)), Math.max(2, Math.round(1 + rooms.length * 1.1))];
      }
      $(".cost", est).textContent = lo ? `${won(lo)} ~ ${won(hi)}만원` : "공간을 골라주세요";
      $(".weeks", est).textContent = lo ? `${wk[0]} ~ ${wk[1]}주` : "—";
      const summary = `${py}평 · ${scope === "full" ? "전체 리모델링" : "부분: " + (rooms.join(", ") || "미선택")} · 예상 ${$(".cost", est).textContent}`;
      const f = $("#f-summary"); if (f) f.value = summary;
    };
    est.addEventListener("input", upd);
    upd();
  }

  /* 사례에서 넘어온 경우 문의 내용 채우기 */
  const ref = new URLSearchParams(location.search).get("ref");
  if (ref && $("#f-msg")) $("#f-msg").value = `'${ref}' 사례처럼 고치고 싶어요.\n`;

  /* ---------- 10. 도장 확인 ---------- */
  const form = $("form.consult");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const st = $(".stamp", form);
    st.classList.remove("hit"); void st.offsetWidth; st.classList.add("hit");
    $(".form-done", form).textContent = "접수되었습니다. 하루 안에 대표 목수가 직접 전화드릴게요. (포트폴리오 데모 — 실제로 전송되지 않습니다)";
    $("button[type=submit]", form).disabled = true;
  });

  const yr = $(".yr"); if (yr) yr.textContent = new Date().getFullYear();
})();
