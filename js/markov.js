/* =========================================================
   Random walk — a Markov chain over the site's sections.
   - Full diagram (#markov): an agent random-walks per P; nodes
     sized by stationary distribution pi; active node's out-edges
     show probabilities. Clicking a node routes the agent there
     along real edges (BFS path), traced hop by hop, no scrolling.
   - Minimap (#minimap): docks bottom-right; its token traces a
     path along edges to your scroll position. Clicking scrolls.
   - Per-section state tags ([data-state]) filled from the same P.
   ========================================================= */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const NODES = [
    { label: "Home",         href: "#home",       desc: "The live desmos.py Mandelbrot at the top of the page." },
    { label: "Bus ETA",      href: "#p-bus",      desc: "An XGBoost model predicting next-stop arrival from 1M+ GPS pings." },
    { label: "Symbolic Reg.",href: "#p-symreg",   desc: "Genetic programming that evolves trading strategies on the GPU." },
    { label: "desmos.py",    href: "#p-desmos",   desc: "A compiler from Python into interactive Desmos graphs." },
    { label: "Classify",     href: "#p-classify", desc: "Step-by-step AI feedback on student work over an infinite canvas." },
    { label: "DecoAR",       href: "#p-decoar",   desc: "Generated 3D furniture placed into LiDAR-scanned rooms." },
    { label: "Research",     href: "#research",   desc: "Simulation software at CEE and an NLP/ETL pipeline at Scheller." },
    { label: "About",        href: "#about",      desc: "ISyE at Georgia Tech — operations research, statistics, the odd poem." },
  ];
  const P = [
    [0.00, 0.25, 0.00, 0.25, 0.00, 0.00, 0.25, 0.25],
    [0.25, 0.00, 0.40, 0.00, 0.00, 0.00, 0.35, 0.00],
    [0.30, 0.30, 0.00, 0.40, 0.00, 0.00, 0.00, 0.00],
    [0.35, 0.00, 0.30, 0.00, 0.35, 0.00, 0.00, 0.00],
    [0.30, 0.00, 0.00, 0.00, 0.00, 0.40, 0.00, 0.30],
    [0.30, 0.00, 0.00, 0.40, 0.00, 0.00, 0.00, 0.30],
    [0.00, 0.40, 0.00, 0.00, 0.35, 0.00, 0.00, 0.25],
    [0.50, 0.00, 0.00, 0.25, 0.00, 0.00, 0.25, 0.00],
  ];
  const N = NODES.length;

  const PI = (function () {
    let v = new Array(N).fill(1 / N);
    const acc = new Array(N).fill(0);
    for (let it = 0; it < 4000; it++) {
      const nv = new Array(N).fill(0);
      for (let i = 0; i < N; i++) { const vi = v[i]; if (!vi) continue; for (let j = 0; j < N; j++) nv[j] += vi * P[i][j]; }
      v = nv; for (let j = 0; j < N; j++) acc[j] += v[j];
    }
    const s = acc.reduce((a, b) => a + b, 0);
    return acc.map((x) => x / s);
  })();

  // shortest path s -> t over edges with P>0 (returns [n1..t], excludes s)
  function bfsPath(s, t) {
    if (s === t) return [];
    const prev = new Array(N).fill(-1), seen = new Array(N).fill(false), Q = [s];
    seen[s] = true;
    while (Q.length) {
      const u = Q.shift();
      for (let v = 0; v < N; v++) {
        if (P[u][v] > 0 && !seen[v]) {
          seen[v] = true; prev[v] = u;
          if (v === t) { const path = []; let x = t; while (x !== s) { path.unshift(x); x = prev[x]; } return path; }
          Q.push(v);
        }
      }
    }
    return [];
  }

  // ---- layout ----
  const VW = 920, VH = 520, CX = 455, CY = 250, RX = 360, RY = 186;
  const meanPi = 1 / N;
  const pos = [], rad = [];
  for (let i = 0; i < N; i++) {
    const a = -Math.PI / 2 + i * (2 * Math.PI / N);
    pos.push({ x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) });
    rad.push(Math.max(15, Math.min(40, 25 * Math.sqrt(PI[i] / meanPi))));
  }

  const el = (n, at) => { const e = document.createElementNS(SVGNS, n); for (const k in at) e.setAttribute(k, at[k]); return e; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const q = (a, c, b, t) => { const m = 1 - t; return m * m * a + 2 * m * t * c + t * t * b; };

  function arc(ax, ay, bx, by, trimA, trimB) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const sx = ax + ux * trimA, sy = ay + uy * trimA;
    const ex = bx - ux * trimB, ey = by - uy * trimB;
    const cx = (sx + ex) / 2 - uy * d * 0.16, cy = (sy + ey) / 2 + ux * d * 0.16;
    return { sx, sy, cx, cy, ex, ey };
  }

  const GEO = [];                       // {a,b,p,sx,sy,cx,cy,ex,ey,lx,ly}
  const OUT = Array.from({ length: N }, () => []);
  for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) {
    if (P[a][b] <= 0) continue;
    const g0 = arc(pos[a].x, pos[a].y, pos[b].x, pos[b].y, rad[a] + 3, rad[b] + 9);
    const lp = { x: q(g0.sx, g0.cx, g0.ex, 0.34), y: q(g0.sy, g0.cy, g0.ey, 0.34) };
    OUT[a].push(GEO.length);
    GEO.push(Object.assign(g0, { a, b, p: P[a][b], lx: lp.x, ly: lp.y }));
  }
  const edgeGeo = (u, v) => OUT[u].map((idx) => GEO[idx]).find((g) => g.b === v)
    || arc(pos[u].x, pos[u].y, pos[v].x, pos[v].y, rad[u] + 3, rad[v] + 9);

  // ---- build one diagram ----
  function build(host, mini, onClick) {
    const svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, class: "mk-svg" + (mini ? " mk--mini" : "") });
    const defs = el("defs", {});
    const mid = mini ? "mk-arrow-m" : "mk-arrow";
    const marker = el("marker", { id: mid, viewBox: "0 0 10 10", refX: "8", refY: "5",
      markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" });
    marker.appendChild(el("path", { d: "M0 0 L10 5 L0 10 z", class: "mk-arrowhead" }));
    defs.appendChild(marker); svg.appendChild(defs);

    const gE = el("g", {}), gN = el("g", {}), gA = el("g", {});
    const edgeEls = [], labelEls = [];
    GEO.forEach((g, idx) => {
      const path = el("path", { class: "mk-edge", "marker-end": `url(#${mid})`,
        d: `M${g.sx.toFixed(1)} ${g.sy.toFixed(1)} Q${g.cx.toFixed(1)} ${g.cy.toFixed(1)} ${g.ex.toFixed(1)} ${g.ey.toFixed(1)}` });
      gE.appendChild(path); edgeEls[idx] = path;
      if (!mini) {
        const label = el("text", { class: "mk-edgelabel", x: g.lx.toFixed(1), y: g.ly.toFixed(1) });
        label.textContent = g.p.toFixed(2).replace(/^0/, ".");
        gE.appendChild(label); labelEls[idx] = label;
      }
    });

    const nodeEls = [];
    for (let i = 0; i < N; i++) {
      const grp = el("g", { class: "mk-node", tabindex: "0", role: "link", "aria-label": NODES[i].label });
      grp.appendChild(el("circle", { cx: pos[i].x, cy: pos[i].y, r: rad[i], class: "mk-node-c" }));
      if (!mini) {
        const ox = pos[i].x - CX, oy = pos[i].y - CY, on = Math.hypot(ox, oy) || 1;
        const anchor = Math.abs(ox) > on * 0.45 ? (ox > 0 ? "start" : "end") : "middle";
        const name = el("text", { class: "mk-nodelabel",
          x: (pos[i].x + (ox / on) * (rad[i] + 13)).toFixed(1),
          y: (pos[i].y + (oy / on) * (rad[i] + 13)).toFixed(1),
          "text-anchor": anchor, "dominant-baseline": oy > 0 ? "hanging" : "auto" });
        name.textContent = NODES[i].label;
        const pit = el("text", { class: "mk-pilabel", x: pos[i].x, y: pos[i].y + 4, "text-anchor": "middle" });
        pit.textContent = "π " + Math.round(PI[i] * 100) + "%";
        grp.appendChild(name); grp.appendChild(pit);
      } else {
        const tt = el("title", {}); tt.textContent = `${NODES[i].label} — π ${Math.round(PI[i] * 100)}%`; grp.appendChild(tt);
      }
      const go = () => onClick(i);
      grp.addEventListener("click", go);
      grp.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      gN.appendChild(grp); nodeEls.push(grp);
    }

    const halo = el("circle", { r: mini ? 34 : 13, class: "mk-halo" });
    const agent = el("circle", { r: mini ? 22 : 6.5, class: "mk-agent" });
    gA.appendChild(halo); gA.appendChild(agent);
    svg.appendChild(gE); svg.appendChild(gN); svg.appendChild(gA);
    host.appendChild(svg);
    return { edgeEls, labelEls, nodeEls, agent, halo, lx: pos[0].x, ly: pos[0].y };
  }

  function place(m, x, y) {
    m.agent.setAttribute("cx", x); m.agent.setAttribute("cy", y);
    m.halo.setAttribute("cx", x);  m.halo.setAttribute("cy", y);
    m.lx = x; m.ly = y;
  }
  function highlight(m, i) {
    m.nodeEls.forEach((g, k) => g.classList.toggle("on", k === i));
    GEO.forEach((g, idx) => {
      m.edgeEls[idx].classList.toggle("on", g.a === i);
      if (m.labelEls[idx]) m.labelEls[idx].classList.toggle("on", g.a === i);
    });
  }
  function markHere(m, i) { m.nodeEls.forEach((g, k) => g.classList.toggle("here", k === i)); }

  // ---- panel ----
  const panel = {
    label: document.getElementById("mk-label"), pi: document.getElementById("mk-pi"),
    desc: document.getElementById("mk-desc"), next: document.getElementById("mk-next"),
    go: document.getElementById("mk-go"),
  };
  function setPanel(i) {
    if (!panel.label) return;
    panel.label.textContent = NODES[i].label;
    if (panel.pi) panel.pi.textContent = "stationary π = " + (PI[i] * 100).toFixed(1) + "%";
    if (panel.desc) panel.desc.textContent = NODES[i].desc;
    if (panel.next) {
      panel.next.innerHTML = "";
      P[i].map((p, j) => ({ p, j })).filter((o) => o.p > 0).sort((a, b) => b.p - a.p).forEach((o) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${NODES[o.j].label}</span><b>${o.p.toFixed(2).replace(/^0/, ".")}</b>`;
        panel.next.appendChild(li);
      });
    }
    if (panel.go) { panel.go.setAttribute("href", NODES[i].href); panel.go.firstChild.textContent = "Open " + NODES[i].label + " "; }
  }

  // ---- mounts ----
  const fullHost = document.getElementById("markov");
  const miniHost = document.getElementById("minimap");
  const full = fullHost ? build(fullHost, false, (i) => agentGoTo(i)) : null;
  const mini = miniHost ? build(miniHost, true, (i) => miniNavigate(i)) : null;

  const DWELL = 1400, MOVE = 1050, ROUTE_MOVE = 720, MINI_MOVE = 440;

  // ---- full agent (autonomous walk + click routing) ----
  let cur = 0, target = 0, moving = false, elapsed = 0, moveDur = MOVE, curGeo = null;
  let route = [], paused = false, visible = true, forceMove = false;

  function startEdge(u, v, dur) { target = v; elapsed = 0; moving = true; moveDur = dur; curGeo = edgeGeo(u, v); }
  function atNode(i, rest) {
    cur = i;
    if (full) { place(full, pos[i].x, pos[i].y); highlight(full, i); }
    setPanel(i);
    if (rest) { moving = false; curGeo = null; forceMove = false; elapsed = 0; }
  }
  function pickNext() {
    let r = Math.random(), b = 0;
    for (let j = 0; j < N; j++) { r -= P[cur][j]; if (r <= 0) { b = j; break; } }
    route = []; startEdge(cur, b, MOVE);
  }
  function agentGoTo(i) {                 // main-diagram click: route the agent, no scroll
    if (!full || reduce) { atNode(i, true); return; }
    if (moving) {                         // finish the current hop, then follow the new path
      route = i === target ? [] : bfsPath(target, i); forceMove = true;
    } else {
      if (i === cur) return;
      route = bfsPath(cur, i); if (!route.length) return;
      forceMove = true; startEdge(cur, route.shift(), ROUTE_MOVE);
    }
  }

  // ---- minimap token = your scroll position, traced along edges ----
  const targets = NODES.map((n) => document.querySelector(n.href));
  let here = 0, miniCur = 0, miniTarget = 0, miniMoving = false, miniElapsed = 0, miniGeo = null, miniRoute = [];
  let lockUntil = 0;
  function startMiniEdge(u, v) { miniTarget = v; miniElapsed = 0; miniMoving = true; miniGeo = edgeGeo(u, v); }
  function setHere(i) {
    here = i;
    if (!mini) return;
    markHere(mini, i);                    // ring marks your scroll section right away
    if (reduce) { place(mini, pos[i].x, pos[i].y); miniCur = i; miniMoving = false; miniRoute = []; return; }
    if (miniMoving) { miniRoute = i === miniTarget ? [] : bfsPath(miniTarget, i); }
    else { if (i === miniCur) return; miniRoute = bfsPath(miniCur, i); if (miniRoute.length) startMiniEdge(miniCur, miniRoute.shift()); }
  }
  function miniNavigate(i) {              // minimap click: scroll the page there
    lockUntil = performance.now() + 950;
    setHere(i);
    const sec = targets[i];
    if (sec) sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  // ---- scroll: top-aligned active section + dock the minimap ----
  const walk = document.getElementById("walk");
  let scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      if (miniHost) miniHost.classList.toggle("show", walk ? walk.getBoundingClientRect().bottom < 110 : false);
      if (performance.now() < lockUntil) return;
      const line = window.innerHeight * 0.35;
      let idx = 0;
      for (let k = 0; k < N; k++) { const t = targets[k]; if (t && t.getBoundingClientRect().top <= line) idx = k; }
      if (idx !== here) setHere(idx);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  // ---- pause the walk when off-screen / hovered / hidden ----
  if (full && fullHost) {
    fullHost.addEventListener("pointerenter", () => (paused = true));
    fullHost.addEventListener("pointerleave", () => (paused = false));
    document.addEventListener("visibilitychange", () => { if (document.hidden) paused = true; });
    if ("IntersectionObserver" in window)
      new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0.05 }).observe(fullHost);
  }

  // ---- init + loop ----
  atNode(0, true);
  if (mini) { miniCur = 0; place(mini, pos[0].x, pos[0].y); markHere(mini, 0); }
  onScroll();

  if (full && !reduce) {
    let last = performance.now();
    function loop(now) {
      const dt = now - last; last = now;

      if ((!paused || forceMove) && visible) {
        elapsed += dt;
        if (!moving) { if (elapsed >= DWELL) pickNext(); }
        else if (curGeo) {
          const t = Math.min(elapsed / moveDur, 1);
          place(full, q(curGeo.sx, curGeo.cx, curGeo.ex, ease(t)), q(curGeo.sy, curGeo.cy, curGeo.ey, ease(t)));
          if (t >= 1) {
            if (route.length) { atNode(target, false); startEdge(target, route.shift(), ROUTE_MOVE); }
            else atNode(target, true);
          }
        } else atNode(target, true);
      }

      if (mini && miniMoving && miniGeo) {     // trace the minimap token along its path
        miniElapsed += dt;
        const t = Math.min(miniElapsed / MINI_MOVE, 1);
        place(mini, q(miniGeo.sx, miniGeo.cx, miniGeo.ex, ease(t)), q(miniGeo.sy, miniGeo.cy, miniGeo.ey, ease(t)));
        if (t >= 1) { miniCur = miniTarget; if (miniRoute.length) startMiniEdge(miniCur, miniRoute.shift()); else miniMoving = false; }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ---- per-section state tags ----
  document.querySelectorAll("[data-state]").forEach((node) => {
    const k = +node.dataset.state;
    if (isNaN(k) || k < 0 || k >= N) return;
    const nexts = P[k].map((p, j) => ({ p, j })).filter((o) => o.p > 0).sort((a, b) => b.p - a.p)
      .map((o) => `<a href="${NODES[o.j].href}">${NODES[o.j].label} ${o.p.toFixed(2).replace(/^0/, ".")}</a>`).join(" · ");
    node.innerHTML = `<span class="statetag__k">state ${k + 1}/${N}</span> · π ${(PI[k] * 100).toFixed(1)}% · ` +
      `<span class="statetag__n">next →</span> ${nexts}`;
  });
})();
