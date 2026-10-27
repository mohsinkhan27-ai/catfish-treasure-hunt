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
    if (CF.Thrills) CF.Thrills.init();
    if (CF.Octopus) CF.Octopus.init();
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
    if (CF.Thrills) CF.Thrills.reset();
    if (CF.Octopus) CF.Octopus.reset();
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

    // Cinematic Slow Motion during Surface Jump!
    var isBreaching = (CF.Player && CF.Player.isBreaching);
    var targetScale = isBreaching ? 0.38 : 1.0;
    this.timeScale = this.timeScale || 1.0;
    this.timeScale = CF.lerp(this.timeScale, targetScale, 0.12);

    var scaledDt = dt * this.timeScale;
    this.t += scaledDt;

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

    var ts = this.timeScale || 1.0;
    var dt = (this.STEP / 1000) * ts;

    // Firing Bubble Blaster Gun (F / B key, Mouse Click, or Touch Fire Button)
    if (CF.Input.justPressed('fire') || CF.Input.held['fire']) {
      if (CF.Player && CF.Player.fireBubbleGun) {
        CF.Player.fireBubbleGun();
      }
    }

    CF.Player.update(ts);
    if (CF.Player && CF.Player.updateBubbles) CF.Player.updateBubbles(dt);
    if (CF.Thrills) CF.Thrills.update(dt, this.t);
    CF.Critters.update(this.t);
    CF.Shark.update(this.t, dt);
    if (CF.Octopus) CF.Octopus.update(dt, this.t);

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

    // Game only ends when BOTH tasks are completed: killing the octopus AND finding all chests!
    this.checkGameWin();

    CF.Input.clearFrame();
  },

  checkGameWin: function () {
    if (this.state !== 'play') return;
    var allChests = (CF.Treasure && CF.Treasure.foundCount >= CF.CONFIG.TREASURE_COUNT);
    var octopusDead = (!CF.Octopus || !CF.Octopus.alive);

    if (allChests && octopusDead) {
      this.state = 'win';
      CF.Audio.win();
      var elapsed = (performance.now() - this.startTime) / 1000;
      if (CF.HUD && CF.HUD.showGrandWin) {
        CF.HUD.showGrandWin(elapsed);
      } else if (CF.HUD && CF.HUD.showWin) {
        CF.HUD.showWin(elapsed);
      }
    }
  },

  winBoss: function () {
    this.checkGameWin();
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
      if (CF.Thrills) CF.Thrills.drawSpeedLines(ctx);
      this.drawBreachBanner(ctx, t);
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
  },

  drawBreachBanner: function (ctx, t) {
    if (!CF.Player || !CF.Player.isBreaching) return;
    var C = CF.CONFIG;
    var cx = C.VIEW_W / 2;
    var cy = 118;

    ctx.save();
    var g = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
    g.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
    g.addColorStop(0.5, 'rgba(255, 245, 160, 0.98)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0.9)');

    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 18;
    roundRect(ctx, cx - 140, cy - 16, 280, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#0f2438';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText('☀️ SLOW-MO SKY BREACH! ⛵', cx, cy);

    ctx.restore();
  }
};
