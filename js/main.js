window.CF = window.CF || {};

CF.Main = {
  state: 'start',
  t: 0,
  last: 0,
  acc: 0,
  startTime: 0,
  STEP: 1000 / 60,
  overlayCanvas: null,
  overlayCtx: null,

  init: function () {
    var self = this;
    this.overlayCanvas = document.getElementById('overlay');
    this.overlayCtx = this.overlayCanvas.getContext('2d');

    CF.Assets.init();
    CF.Input.init();
    CF.HUD.init();
    CF.Render3D.init();
    CF.Player.init();
    CF.Treasure.init();
    CF.Critters.init();
    CF.Shark.init();
    CF.Decoy.init();
    CF.Render3D.resetCamera();

    if (CF.HUD.els.startBtn) CF.HUD.els.startBtn.addEventListener('click', function () { self.start(); });
    if (CF.HUD.els.againBtn) CF.HUD.els.againBtn.addEventListener('click', function () { self.start(); });
    if (CF.HUD.els.retryBtn) CF.HUD.els.retryBtn.addEventListener('click', function () { self.start(); });

    window.addEventListener('keydown', function (e) {
      if (self.state === 'start' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        self.start();
      }
    });

    this.last = performance.now();
    requestAnimationFrame(function (n) { self.loop(n); });
  },

  start: function () {
    CF.Audio.init();
    CF.HUD.hideScreens();
    CF.Player.reset();
    CF.Treasure.reset();
    CF.Critters.reset();
    CF.Shark.reset();
    CF.Decoy.reset();
    CF.Render3D.resetCamera();
    CF.Map.open = false;

    this.state = 'play';
    this.acc = 0;
    this.startTime = performance.now();
    CF.HUD.update();
  },

  loop: function (now) {
    var self = this;
    var dt = now - this.last;
    this.last = now;
    if (dt > 100) dt = 100;

    this.t += dt;

    if (this.state === 'play') {
      this.acc += dt;
      if (this.acc > 100) this.acc = 100;
      while (this.acc >= this.STEP) {
        this.update();
        this.acc -= this.STEP;
        if (this.state !== 'play') break;
      }
    }

    CF.Render3D.update(dt / 1000, this.t);
    this.render();

    requestAnimationFrame(function (n) { self.loop(n); });
  },

  update: function () {
    if (CF.Input.justPressed('view')) CF.Render3D.toggleCameraMode();
    if (CF.Input.justPressed('map')) CF.Map.toggle();
    if (CF.Input.justPressed('escape') && CF.Map.open) CF.Map.open = false;

    if (CF.Map.open) {
      CF.Input.clearFrame();
      return;
    }

    var dt = this.STEP / 1000;
    CF.Player.update();
    CF.Critters.update(this.t);
    CF.Shark.update(this.t, dt);

    if (this.state !== 'play') {
      CF.Input.clearFrame();
      return;
    }

    CF.Decoy.update(this.t, dt);

    if (this.state !== 'play') {
      CF.Input.clearFrame();
      return;
    }

    CF.Treasure.update();
    CF.HUD.update();

    if (CF.Treasure.foundCount >= CF.CONFIG.TREASURE_COUNT) {
      this.state = 'win';
      CF.Audio.win();
      CF.HUD.showWin((performance.now() - this.startTime) / 1000);
    }

    CF.Input.clearFrame();
  },

  lose: function () {
    if (this.state !== 'play') return;
    this.state = 'lose';
    CF.Audio.lose();
    CF.HUD.showLose(CF.Treasure.foundCount, CF.CONFIG.TREASURE_COUNT);
  },

  render: function () {
    var C = CF.CONFIG;
    var ctx = this.overlayCtx;
    var t = this.t;

    // 1. Render full 3D Three.js WebGL Scene
    CF.Render3D.render();

    // 2. Render 2D UI Overlay & Effects
    ctx.clearRect(0, 0, C.VIEW_W, C.VIEW_H);
    this.drawVignette(ctx);

    if (this.state === 'play') {
      this.drawDanger(ctx, t);
    }

    if (CF.Decoy.flash > 0) {
      ctx.fillStyle = 'rgba(255, 120, 40, ' + (CF.Decoy.flash * 0.55) + ')';
      ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
    }

    // 3D Directional Compass Arrow toward nearest treasure
    if (this.state === 'play') {
      this.drawCompass3D(ctx);
    }

    // Sonar Map Overlay
    CF.Map.draw(ctx, t);
  },

  drawDanger: function (ctx, t) {
    var th = CF.Shark.threat;
    if (th <= 0.001) return;
    var C = CF.CONFIG;
    var pulse = 0.7 + 0.3 * Math.sin(t * 0.012);
    var lowHp = 1 - CF.Player.health / C.HEALTH_MAX;
    var boost = (CF.Shark.draining ? 1.6 : 1) * (1 + lowHp * 0.7);
    var alpha = Math.min(0.85, 0.45 * th * pulse * boost);
    var g = ctx.createRadialGradient(C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_H * 0.28, C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_W * 0.72);
    g.addColorStop(0, 'rgba(190, 20, 20, 0)');
    g.addColorStop(1, 'rgba(215, 20, 20, ' + alpha + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  },

  drawCompass3D: function (ctx) {
    var n = CF.Treasure.nearest();
    if (!n || !n.item) return;

    var p = CF.Player;
    var dx = n.item.x - p.x;
    var dz = n.item.z - p.z;
    var angleToTarget = Math.atan2(dx, dz);
    var relAngle = angleToTarget - p.yaw;

    var cx = CF.CONFIG.VIEW_W / 2;
    var cy = 65;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(relAngle);

    ctx.fillStyle = 'rgba(255, 220, 90, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-8, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  drawVignette: function (ctx) {
    var C = CF.CONFIG;
    var g = ctx.createRadialGradient(C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_H * 0.52, C.VIEW_W / 2, C.VIEW_H / 2, C.VIEW_W * 0.78);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(4, 32, 52, 0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);
  }
};
