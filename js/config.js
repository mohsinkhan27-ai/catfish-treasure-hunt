window.CF = window.CF || {};

CF.CONFIG = {
  VIEW_W: 900,
  VIEW_H: 600,
  // Doubled Oceanic Expanse (6000m x 6000m, deep ocean)
  WORLD_SIZE: 6000,
  WORLD_HALF: 3000,
  WORLD_SURFACE: 80,
  WORLD_FLOOR: -550,
  SECTOR_COLS: 3,
  SECTOR_ROWS: 2,
  TREASURE_COUNT: 6,

  // Player physics & swimming (fast, responsive, open-ocean swimming)
  PLAYER_ACCEL: 0.65,
  PLAYER_MAX_SPEED: 9.5,
  PLAYER_SWIM_UP: 5.8,
  PLAYER_SWIM_DOWN: 5.8,
  PLAYER_DRAG: 0.95,
  PLAYER_TURN_SPEED: 0.052,

  // Radar & Treasures
  REVEAL_RADIUS: 180,
  COLLECT_RADIUS: 65,
  HOTCOLD_MAX: 1600,

  // Balanced Shark (Escapable in open ocean)
  SHARK_COUNT: 1,
  SHARK_DETECT: 320,
  SHARK_LOSE_DETECT: 500,
  SHARK_CHASE_SPEED: 6.8, // Slower than player's 9.5
  SHARK_CRUISE_SPEED: 3.2,
  SHARK_DANGER: 260,
  SHARK_DRAIN_RADIUS: 46,
  SHARK_DRAIN_MAX: 18,
  HEALTH_MAX: 100,
  HEALTH_REGEN: 0, // No auto-regen! Player must preserve lifeline across entire game

  // Decoy traps
  DECOY_MAX: 2,
  DECOY_INTERVAL_MIN: 14,
  DECOY_INTERVAL_MAX: 24,
  DECOY_LIFE: 35,
  DECOY_DAMAGE: 0.4,

  // Rich ocean ecosystem counts (high performance 60 FPS)
  SEAWEED_COUNT: 40,
  ROCK_COUNT: 30,
  CORAL_COUNT: 35,
  BRAIN_CORAL_COUNT: 22,
  MUSHROOM_CORAL_COUNT: 28,
  HAMMER_CORAL_COUNT: 24,
  TORCH_CORAL_COUNT: 26,
  FISH_SCHOOLS: 12,
  FISH_PER_SCHOOL: 5,
  JELLY_COUNT: 12,
  MANTA_COUNT: 5,
  DOLPHIN_COUNT: 6
};

CF.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

CF.lerp = function (a, b, t) { return a + (b - a) * t; };

CF.lerpAngle = function (a, b, t) {
  var d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

CF.dist = function (x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); };

CF.dist3D = function (x1, y1, z1, x2, y2, z2) { return Math.hypot(x2 - x1, y2 - y1, z2 - z1); };

CF.rand = function (a, b) { return a + Math.random() * (b - a); };

CF.randInt = function (a, b) { return Math.floor(CF.rand(a, b + 1)); };

CF.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

CF.darken = function (hex, f) {
  var c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  var r = Math.round(parseInt(c.substr(0, 2), 16) * f);
  var g = Math.round(parseInt(c.substr(2, 2), 16) * f);
  var b = Math.round(parseInt(c.substr(4, 2), 16) * f);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
};

CF.FISH_COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#c77dff', '#ff9e00', '#00f5d4', '#ff758f', '#fee440', '#70e000'];

CF.CORAL_COLORS = ['#ff5c8a', '#ff924c', '#b5179e', '#00b4d8', '#ffd166', '#ff0054', '#7209b7', '#48cae4'];

function roundRect(ctx, x, y, w, h, r) {
  if (r > w / 2) r = w / 2;
  if (r > h / 2) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
