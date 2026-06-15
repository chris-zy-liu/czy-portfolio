/* =========================================================
   Hero figure — the live desmos.py Mandelbrot compiler.
   Mounts the user's actual compiled graph (from mandelbrot.html),
   strips all Desmos chrome, recolors to the blueprint palette,
   and drives it with click-to-recenter + zoom via the Desmos API.
   Exposes window.MandelbrotGraph.mount(...).
   ========================================================= */
(function () {
  "use strict";

  // heatmap recolored for readability: the true set (G_val >= N) is solid ink;
  // the exterior fades from light paper to a readable medium-blue near the
  // boundary, so it never washes out to black when you zoom in.
  const COLOR =
    "\\operatorname{rgb}\\left(" +
      "\\left\\{G_{val}\\geq N:22,235-165\\frac{G_{val}}{N}\\right\\}," +
      "\\left\\{G_{val}\\geq N:36,235-135\\frac{G_{val}}{N}\\right\\}," +
      "\\left\\{G_{val}\\geq N:58,225-50\\frac{G_{val}}{N}\\right\\}" +
    "\\right)";

  // state from the compiled mandelbrot.html, buttons removed, heatmap recolored
  function buildState() {
    return { version: 11,
      graph: { viewport: { xmin: -2, xmax: 1, ymin: -1.5, ymax: 1.5 } },
      expressions: { list: [
        { type:"expression", id:"1", latex:"N=40", slider:{hardMin:true,hardMax:true,min:"10",max:"100",step:"1"} },
        { type:"expression", id:"2", latex:"c_{x}=-0.5", hidden:true },
        { type:"expression", id:"3", latex:"c_{y}=0", hidden:true },
        { type:"expression", id:"4", latex:"z_{m}=1.5", hidden:true },
        { type:"expression", id:"5", latex:"\\operatorname{step}\\left(z,c\\right)=\\left(\\left(\\left(\\left(z.x\\right)^{2}\\right)-\\left(\\left(z.y\\right)^{2}\\right)\\right)+\\left(c.x\\right),\\left(\\left(\\left(2\\right)\\cdot \\left(z.x\\right)\\right)\\cdot \\left(z.y\\right)\\right)+\\left(c.y\\right)\\right)" },
        { type:"expression", id:"6", latex:"\\operatorname{magsq}\\left(z\\right)=\\left(\\left(z.x\\right)^{2}\\right)+\\left(\\left(z.y\\right)^{2}\\right)" },
        { type:"expression", id:"7", latex:"\\operatorname{orbit}\\left(k,c\\right)=\\left\\{k=0:\\left(0,0\\right),\\operatorname{step}\\left(\\operatorname{orbit}\\left(k-1,c\\right),c\\right)\\right\\}" },
        { type:"expression", id:"8", latex:"\\operatorname{inside}\\left(k,c\\right)=\\left\\{\\operatorname{magsq}\\left(\\operatorname{orbit}\\left(k,c\\right)\\right)<4:1,0\\right\\}" },
        { type:"expression", id:"9", latex:"\\operatorname{escape}\\left(c\\right)=\\operatorname{total}\\left(\\left[\\operatorname{inside}\\left(k,c\\right)\\operatorname{for}k=\\left[1...N\\right]\\right]\\right)" },
        { type:"expression", id:"10", latex:"G_{disp}=\\left[\\left(-2+i\\cdot 0.061224489795918366,-1.5+j\\cdot 0.061224489795918366\\right)\\operatorname{for}i=\\left[0...49\\right],j=\\left[0...49\\right]\\right]", hidden:true },
        { type:"expression", id:"11", latex:"G_{grid}=\\left[\\left(\\left(c_{x}\\right)-\\left(z_{m}\\right)+i\\cdot \\left(\\frac{\\left(\\left(c_{x}\\right)+\\left(z_{m}\\right)\\right)-\\left(\\left(c_{x}\\right)-\\left(z_{m}\\right)\\right)}{49}\\right),\\left(c_{y}\\right)-\\left(z_{m}\\right)+j\\cdot \\left(\\frac{\\left(\\left(c_{y}\\right)+\\left(z_{m}\\right)\\right)-\\left(\\left(c_{y}\\right)-\\left(z_{m}\\right)\\right)}{49}\\right)\\right)\\operatorname{for}i=\\left[0...49\\right],j=\\left[0...49\\right]\\right]", hidden:true },
        { type:"expression", id:"12", latex:"G_{val}=\\left[\\operatorname{escape}\\left(p\\right)\\operatorname{for}p=G_{grid}\\right]", hidden:true },
        { type:"expression", id:"13", latex:"G_{disp}", colorLatex:COLOR, points:true, lines:false, pointSize:"16" }
      ] }
    };
  }

  // fixed display region of the heatmap (G_disp spans these math bounds)
  const DISP = { xmin: -2, xmax: 1, ymin: -1.5, ymax: 1.5 };
  const HOME = { cx: -0.5, cy: 0.0, zm: 1.5 };

  function mount(opts) {
    if (typeof Desmos === "undefined") return null;

    const calc = Desmos.GraphingCalculator(opts.el, {
      keypad: false, expressions: false, settingsMenu: false, zoomButtons: false,
      lockViewport: true, border: false, actions: true,
      showGrid: false, showXAxis: false, showYAxis: false,
      xAxisNumbers: false, yAxisNumbers: false, trace: false, pointsOfInterest: false,
    });
    calc.setState(buildState());

    const view = { cx: HOME.cx, cy: HOME.cy, zm: HOME.zm };

    function push() {
      calc.setExpression({ id: "2", latex: "c_{x}=" + view.cx });
      calc.setExpression({ id: "3", latex: "c_{y}=" + view.cy });
      calc.setExpression({ id: "4", latex: "z_{m}=" + view.zm });
      if (opts.onView) opts.onView(view.cx, view.cy, HOME.zm / view.zm);
    }

    // convert a client point over the figure -> complex (sample-space) coordinate
    function toComplex(clientX, clientY) {
      const r = opts.el.getBoundingClientRect();
      const fracX = clamp((clientX - r.left) / r.width, 0, 1);
      const fracY = clamp((clientY - r.top) / r.height, 0, 1);
      // map display fraction -> displayed math point -> sample point
      const dispX = DISP.xmin + fracX * (DISP.xmax - DISP.xmin);
      const dispY = DISP.ymax - fracY * (DISP.ymax - DISP.ymin);
      const fx = (dispX - DISP.xmin) / (DISP.xmax - DISP.xmin);
      const fy = (dispY - DISP.ymin) / (DISP.ymax - DISP.ymin);
      return {
        re: (view.cx - view.zm) + fx * 2 * view.zm,
        im: (view.cy - view.zm) + fy * 2 * view.zm,
      };
    }

    // hover -> live readout
    opts.el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const c = toComplex(e.clientX, e.clientY);
      if (opts.onHover) opts.onHover(c.re, c.im);
    });
    opts.el.addEventListener("pointerleave", () => {
      if (opts.onHover) opts.onHover(view.cx, view.cy);
    });

    // click -> recenter on that point
    opts.el.addEventListener("click", (e) => {
      const c = toComplex(e.clientX, e.clientY);
      view.cx = c.re; view.cy = c.im;
      push();
    });

    const api = {
      zoomIn() { view.zm = Math.max(view.zm * 0.5, 1.5e-4); push(); },
      zoomOut() { view.zm = Math.min(view.zm * 2, 1.5); push(); },
      reset() { view.cx = HOME.cx; view.cy = HOME.cy; view.zm = HOME.zm; push(); },
      view,
    };
    push();
    return api;
  }

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  window.MandelbrotGraph = { mount };
})();
