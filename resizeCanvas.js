// resizeCanvas.js
(function () {
  const BASE_W = 1200;
  const BASE_H = 800;

  // State we expose so game code can read scale and convert inputs
  const CanvasScaler = {
    BASE_W,
    BASE_H,
    cssW: BASE_W,
    cssH: BASE_H,
    pixelW: BASE_W,
    pixelH: BASE_H,
    scale: 1,                 // CSS scale factor (<= 1)
    dpr: 1,                   // device pixel ratio
    toLogicalX(px) { return px * (BASE_W / this.cssW); },
    toLogicalY(py) { return py * (BASE_H / this.cssH); },
  };

  function fitCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    // Available viewport (you can swap to container size if you prefer)
    const availW = window.innerWidth;
    const availH = window.innerHeight;

    // Never upscale beyond base; scale down if needed
    const scale = Math.min(1, availW / BASE_W, availH / BASE_H);

    const cssW = Math.round(BASE_W * scale);
    const cssH = Math.round(BASE_H * scale);

    // Apply CSS size (visual size)
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const pixelW = Math.round(cssW * dpr);
    const pixelH = Math.round(cssH * dpr);

    // Only reallocate the buffer if size changed
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width  = pixelW;
      canvas.height = pixelH;

      const ctx = canvas.getContext('2d');
      // reset any prior transform, then map logical coords to pixels
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelW / BASE_W, pixelH / BASE_H);
    }

    // publish state
    CanvasScaler.cssW = cssW;
    CanvasScaler.cssH = cssH;
    CanvasScaler.pixelW = pixelW;
    CanvasScaler.pixelH = pixelH;
    CanvasScaler.scale = scale;
    CanvasScaler.dpr = dpr;

    // Let your game know it should re-layout HUD, etc., if needed
    window.dispatchEvent(new CustomEvent('canvas:resized', { detail: { ...CanvasScaler } }));
  }

  // Run on load + resize
  window.addEventListener('load', fitCanvas);
  window.addEventListener('resize', fitCanvas);

  // Expose helpers globally
  window.CanvasScaler = CanvasScaler;
  window.fitCanvas = fitCanvas;
})();