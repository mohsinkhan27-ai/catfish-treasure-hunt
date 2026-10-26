window.CF = window.CF || {};

CF.Map = {
  open: false,

  toggle: function () { this.open = !this.open; },

  draw: function (ctx, t) {
    if (!this.open) return;
    var C = CF.CONFIG;
    var m = ctx;

    m.fillStyle = 'rgba(4, 12, 22, 0.82)';
    m.fillRect(0, 0, C.VIEW_W, C.VIEW_H);

    var px = 110;
    var py = 45;
    var pw = 680;
    var ph = 510;

    m.fillStyle = 'rgba(12, 28, 44, 0.98)';
    roundRect(m, px, py, pw, ph, 16);
    m.fill();
    m.strokeStyle = 'rgba(120, 210, 240, 0.38)';
    m.lineWidth = 2;
    roundRect(m, px, py, pw, ph, 16);
    m.stroke();

    m.fillStyle = '#eef1f8';
    m.font = '700 22px system-ui, sans-serif';
    m.textAlign = 'left';
    m.fillText('3D Sonar Navigation Chart', px + 24, py + 36);

    m.font = '13px system-ui, sans-serif';
    m.fillStyle = '#8fb6c9';
    m.fillText('Top-down sonar scan - Search the glowing yellow beacons on the seabed', px + 24, py + 58);

    var mx = px + 24;
    var my = py + 72;
    var mw = pw - 48;
    var mh = ph - 72 - 46;

    m.fillStyle = '#071826';
    roundRect(m, mx, my, mw, mh, 10);
    m.fill();
    m.strokeStyle = 'rgba(120, 200, 230, 0.25)';
    m.lineWidth = 1;
    roundRect(m, mx, my, mw, mh, 10);
    m.stroke();

    var toMX = function (wx) { return mx + ((wx + C.WORLD_HALF) / C.WORLD_SIZE) * mw; };
    var toMZ = function (wz) { return my + ((wz + C.WORLD_HALF) / C.WORLD_SIZE) * mh; };

    // Sonar concentric rings
    m.strokeStyle = 'rgba(100, 200, 240, 0.08)';
    m.lineWidth = 1;
    for (var ring = 1; ring <= 4; ring++) {
      m.beginPath();
      m.arc(mx + mw / 2, my + mh / 2, (ring / 4) * (mh / 2), 0, Math.PI * 2);
      m.stroke();
    }

    // Grid lines
    for (var i = 1; i < 6; i++) {
      var gx = mx + (i / 6) * mw;
      m.beginPath(); m.moveTo(gx, my); m.lineTo(gx, my + mh); m.stroke();
      var gy = my + (i / 6) * mh;
      m.beginPath(); m.moveTo(mx, gy); m.lineTo(mx + mw, gy); m.stroke();
    }

    var items = CF.Treasure.items;
    var n = CF.Treasure.nearest();

    // Found treasures
    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var tx = toMX(it.x);
      var tz = toMZ(it.z);

      if (it.found) {
        m.strokeStyle = '#51cf66';
        m.lineWidth = 2.5;
        m.beginPath(); m.moveTo(tx - 6, tz - 6); m.lineTo(tx + 6, tz + 6); m.stroke();
        m.beginPath(); m.moveTo(tx + 6, tz - 6); m.lineTo(tx - 6, tz + 6); m.stroke();
      } else {
        var pulse = 0.4 + 0.3 * Math.sin(t * 0.005 + k);
        var r = 16 + pulse * 6;

        m.beginPath();
        m.arc(tx, tz, r, 0, Math.PI * 2);
        m.fillStyle = 'rgba(255, 220, 90, ' + (0.12 * pulse + 0.08) + ')';
        m.fill();
        m.strokeStyle = 'rgba(255, 220, 90, 0.65)';
        m.lineWidth = 1.5;
        m.stroke();

        m.fillStyle = '#ffe066';
        m.font = '700 13px system-ui, sans-serif';
        m.textAlign = 'center';
        m.fillText('?', tx, tz + 4);
      }
    }

    // Player position
    var ppx = toMX(CF.Player.x);
    var ppz = toMZ(CF.Player.z);

    // Guide dashed line to nearest
    if (n && n.item && !n.item.found) {
      m.strokeStyle = 'rgba(255, 225, 120, 0.55)';
      m.lineWidth = 1.5;
      m.setLineDash([4, 4]);
      m.beginPath();
      m.moveTo(ppx, ppz);
      m.lineTo(toMX(n.item.x), toMZ(n.item.z));
      m.stroke();
      m.setLineDash([]);
    }

    // Player arrow
    m.save();
    m.translate(ppx, ppz);
    m.rotate(CF.Player.yaw);
    m.fillStyle = '#38d9a9';
    m.beginPath();
    m.moveTo(0, 11);
    m.lineTo(-7, -8);
    m.lineTo(0, -4);
    m.lineTo(7, -8);
    m.closePath();
    m.fill();
    m.restore();

    // Predator blips on Sonar Map when hunting
    if (CF.Shark.list && CF.Shark.list.length > 0) {
      for (var pi = 0; pi < CF.Shark.list.length; pi++) {
        var pred = CF.Shark.list[pi];
        if (pred.state === 'chase') {
          var pxBlip = toMX(pred.x);
          var pzBlip = toMZ(pred.z);
          // Color code predator types: Great White = Red, Hammerhead = Magenta, Barracuda = Amber
          m.fillStyle = pred.type === 'barracuda' ? '#ffa200' : (pred.type === 'hammerhead' ? '#ff3366' : '#ff2222');
          m.beginPath();
          m.arc(pxBlip, pzBlip, 7, 0, Math.PI * 2);
          m.fill();
        }
      }
    } else if (CF.Shark.state === 'chase') {
      var spx = toMX(CF.Shark.x);
      var spz = toMZ(CF.Shark.z);
      m.fillStyle = '#ff4444';
      m.beginPath();
      m.arc(spx, spz, 6, 0, Math.PI * 2);
      m.fill();
    }

    // Depth and status info
    var depthM = Math.round(Math.abs(CF.Player.y));
    m.textAlign = 'left';
    m.fillStyle = '#8fb6c9';
    m.font = '13px system-ui, sans-serif';
    m.fillText('Depth: -' + depthM + 'm  |  Treasures: ' + CF.Treasure.foundCount + ' / ' + C.TREASURE_COUNT, px + 24, py + ph - 16);

    m.textAlign = 'right';
    m.fillText('Press M to resume dive', px + pw - 24, py + ph - 16);
  }
};
