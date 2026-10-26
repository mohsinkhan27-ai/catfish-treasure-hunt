CF.Render = {
  bubbles: [],
  particles: [],

  init: function () {
    var C = CF.CONFIG;
    this.bubbles = [];
    this.particles = [];
    for (var i = 0; i < 48; i++) {
      this.bubbles.push({
        x: CF.rand(0, C.VIEW_W),
        y: CF.rand(0, C.VIEW_H),
        r: CF.rand(1.5, 5),
        vy: CF.rand(0.25, 1.1),
        phase: CF.rand(0, 6.28)
      });
    }
  },

  update: function (t) {
    var C = CF.CONFIG;
    for (var i = 0; i < this.bubbles.length; i++) {
      var b = this.bubbles[i];
      b.y -= b.vy;
      if (b.y < -8) {
        b.y = C.VIEW_H + 8;
        b.x = CF.rand(0, C.VIEW_W);
      }
    }
  },

  burst: function (x, y, isExplosion) {
    var count = isExplosion ? 38 : 26;
    for (var i = 0; i < count; i++) {
      var a = CF.rand(0, Math.PI * 2);
      var sp = isExplosion ? CF.rand(2.5, 7.5) : CF.rand(1.2, 5.0);
      var color;
      if (isExplosion) {
        color = Math.random() < 0.4 ? '#ff3e24' : (Math.random() < 0.7 ? '#ff922b' : '#ffd43b');
      } else {
        color = Math.random() < 0.45 ? '#ffe066' : (Math.random() < 0.8 ? '#fff3bf' : '#38d9a9');
      }
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: isExplosion ? 0.022 : 0.018,
        r: isExplosion ? CF.rand(2.5, 6) : CF.rand(2, 4.5),
        color: color,
        spark: !isExplosion && Math.random() < 0.5
      });
    }

    // Add rising bubble burst
    for (var b = 0; b < 10; b++) {
      this.bubbles.push({
        x: x + CF.rand(-16, 16),
        y: y + CF.rand(-16, 16),
        r: CF.rand(2, 4.5),
        vy: CF.rand(1.2, 2.5),
        phase: CF.rand(0, 6.28)
      });
    }
  },

  updateParticles: function () {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= (p.decay || 0.02);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  drawParticles: function (ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * p.life), 0, Math.PI * 2);
      ctx.fill();

      // Sparkle glow for treasure particles
      if (p.spark && p.life > 0.4) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        var sz = p.r * 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - sz, p.y); ctx.lineTo(p.x + sz, p.y);
        ctx.moveTo(p.x, p.y - sz); ctx.lineTo(p.x, p.y + sz);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  },

  drawOcean: function (ctx, t) {
    var C = CF.CONFIG;
    var cam = CF.World.camera;
    var depth = CF.clamp(cam.y / Math.max(1, C.WORLD_H - C.VIEW_H), 0, 1);

    // Dynamic depth gradient from sunlit turquoise to deep abyss
    var topR = Math.round(CF.lerp(32, 8, depth));
    var topG = Math.round(CF.lerp(128, 38, depth));
    var topB = Math.round(CF.lerp(170, 68, depth));

    var midR = Math.round(CF.lerp(18, 5, depth));
    var midG = Math.round(CF.lerp(82, 24, depth));
    var midB = Math.round(CF.lerp(120, 42, depth));

    var botR = Math.round(CF.lerp(7, 2, depth));
    var botG = Math.round(CF.lerp(34, 12, depth));
    var botB = Math.round(CF.lerp(56, 24, depth));

    var g = ctx.createLinearGradient(0, 0, 0, C.VIEW_H);
    g.addColorStop(0, 'rgb(' + topR + ',' + topG + ',' + topB + ')');
    g.addColorStop(0.45, 'rgb(' + midR + ',' + midG + ',' + midB + ')');
    g.addColorStop(1, 'rgb(' + botR + ',' + botG + ',' + botB + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.VIEW_W, C.VIEW_H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Volumetric sunbeams / god rays
    var rayOpacity = (1 - depth * 0.75) * 0.06;
    if (rayOpacity > 0.005) {
      for (var i = 0; i < 7; i++) {
        var base = i * 170 - (cam.x * 0.22) % 1190;
        var x = ((base % 1190) + 1190) % 1190 - 130;
        var sway = Math.sin(t * 0.0007 + i * 1.3) * 45;
        var width = 60 + Math.sin(t * 0.001 + i) * 18;

        var rayGrad = ctx.createLinearGradient(x, 0, x + sway, C.VIEW_H);
        rayGrad.addColorStop(0, 'rgba(160, 235, 255, ' + (rayOpacity * 1.5) + ')');
        rayGrad.addColorStop(0.5, 'rgba(120, 210, 250, ' + rayOpacity + ')');
        rayGrad.addColorStop(1, 'rgba(70, 160, 220, 0)');

        ctx.beginPath();
        ctx.moveTo(x, -20);
        ctx.lineTo(x + width, -20);
        ctx.lineTo(x + width + sway * 1.6, C.VIEW_H + 20);
        ctx.lineTo(x + sway * 1.6, C.VIEW_H + 20);
        ctx.closePath();
        ctx.fillStyle = rayGrad;
        ctx.fill();
      }
    }

    // Dynamic water caustics (dancing sun ripples across top half)
    if (depth < 0.65) {
      var causticAlpha = (1 - depth / 0.65) * 0.038;
      ctx.strokeStyle = 'rgba(180, 245, 255, ' + causticAlpha + ')';
      ctx.lineWidth = 1.6;
      for (var c = 0; c < 4; c++) {
        ctx.beginPath();
        var cy = 40 + c * 55 + Math.sin(t * 0.001 + c) * 15;
        for (var cx = -50; cx < C.VIEW_W + 50; cx += 45) {
          var offY = Math.sin((cx + cam.x * 0.3) * 0.02 + t * 0.002 + c) * 10;
          if (cx === -50) ctx.moveTo(cx, cy + offY);
          else ctx.lineTo(cx, cy + offY);
        }
        ctx.stroke();
      }
    }

    ctx.restore();

    // Floating ambient bubbles
    for (var k = 0; k < this.bubbles.length; k++) {
      var b = this.bubbles[k];
      var bx = b.x + Math.sin((t + b.phase * 400) * 0.0012) * 3.5;
      ctx.beginPath();
      ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(210, 245, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bubble highlight shine
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.5, b.r * 0.28), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fill();
    }
  },

  drawTerrain: function (ctx, t) {
    var C = CF.CONFIG;
    var floorY = C.WORLD_H - 170;

    // Layer 1: Distant sand dunes
    ctx.fillStyle = '#223d45';
    ctx.beginPath();
    ctx.moveTo(0, C.WORLD_H);
    for (var dx = 0; dx <= C.WORLD_W; dx += 120) {
      var dy = floorY - 35 + Math.sin(dx * 0.003) * 25 + Math.cos(dx * 0.007) * 15;
      ctx.lineTo(dx, dy);
    }
    ctx.lineTo(C.WORLD_W, C.WORLD_H);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Foreground undulating seabed with rich oceanic sand gradient
    var g = ctx.createLinearGradient(0, floorY, 0, C.WORLD_H);
    g.addColorStop(0, '#2d4d52');
    g.addColorStop(0.25, '#355355');
    g.addColorStop(0.65, '#2e4344');
    g.addColorStop(1, '#1e2d2f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, C.WORLD_H);
    for (var fx = 0; fx <= C.WORLD_W; fx += 80) {
      var fdy = floorY + Math.sin(fx * 0.004) * 20 + Math.cos(fx * 0.009) * 12;
      ctx.lineTo(fx, fdy);
    }
    ctx.lineTo(C.WORLD_W, C.WORLD_H);
    ctx.closePath();
    ctx.fill();

    // Fine seabed sand ripple highlights
    ctx.strokeStyle = 'rgba(120, 190, 195, 0.12)';
    ctx.lineWidth = 1.8;
    for (var rx = 40; rx < C.WORLD_W; rx += 140) {
      var ry = floorY + 25 + Math.sin(rx * 0.005) * 15;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 30, ry - 6, rx + 65, ry);
      ctx.stroke();
    }

    var c;
    for (c = 0; c < CF.World.coral.length; c++) {
      this.drawCoral(ctx, CF.World.coral[c], t);
    }

    var r;
    for (r = 0; r < CF.World.rocks.length; r++) {
      var rk = CF.World.rocks[r];
      // Rock drop shadow
      ctx.beginPath();
      ctx.ellipse(rk.x, rk.y + rk.r * 0.45, rk.r * 1.05, rk.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5, 15, 20, 0.4)';
      ctx.fill();

      // Rock body with 3D gradient
      var rg = ctx.createRadialGradient(rk.x - rk.r * 0.25, rk.y - rk.r * 0.3, 2, rk.x, rk.y, rk.r);
      rg.addColorStop(0, rk.shade > 0.5 ? '#607280' : '#4d5d6b');
      rg.addColorStop(0.7, rk.shade > 0.5 ? '#3a4650' : '#2d3740');
      rg.addColorStop(1, '#1e252b');

      ctx.beginPath();
      ctx.ellipse(rk.x, rk.y, rk.r, rk.r * 0.72, 0, 0, Math.PI * 2);
      ctx.fillStyle = rg;
      ctx.fill();

      // Top specular highlight
      ctx.beginPath();
      ctx.ellipse(rk.x - rk.r * 0.25, rk.y - rk.r * 0.32, rk.r * 0.45, rk.r * 0.24, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    }

    var s;
    for (s = 0; s < CF.World.seaweed.length; s++) {
      var sw = CF.World.seaweed[s];
      var b;
      for (b = 0; b < sw.blades; b++) {
        var off = (b - (sw.blades - 1) / 2) * 12;
        var h = sw.h * (0.7 + 0.3 * Math.cos(b));
        var segs = 6;
        ctx.beginPath();
        ctx.moveTo(sw.x + off, sw.y);
        for (var i2 = 1; i2 <= segs; i2++) {
          var fy = sw.y - (h * i2 / segs);
          var fx = sw.x + off + Math.sin(t * 0.0012 + sw.phase + i2 * 0.55 + b) * (i2 * 2.8);
          ctx.lineTo(fx, fy);
        }
        ctx.lineWidth = 4.2;
        ctx.strokeStyle = (b % 2 === 0) ? 'rgba(52, 168, 105, 0.88)' : 'rgba(40, 140, 85, 0.85)';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
  },

  drawCoral: function (ctx, c, t) {
    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.beginPath();
    ctx.ellipse(0, 6, c.size * 0.55, c.size * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 50, 60, 0.85)';
    ctx.fill();

    ctx.strokeStyle = c.color;
    ctx.lineWidth = Math.max(3, c.size * 0.15);
    ctx.lineCap = 'round';

    for (var b = 0; b < c.branches; b++) {
      var ang = -Math.PI / 2 + (b - (c.branches - 1) / 2) * 0.5 + Math.sin(t * 0.001 + c.phase + b) * 0.06;
      var len = c.size * (0.7 + 0.3 * Math.cos(b));
      var ex = Math.cos(ang) * len;
      var ey = Math.sin(ang) * len;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ex * 0.5 + 3, ey * 0.6, ex, ey);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(2.5, c.size * 0.13), 0, Math.PI * 2);
      ctx.fillStyle = c.color;
      ctx.fill();
    }

    ctx.restore();
  }
};
