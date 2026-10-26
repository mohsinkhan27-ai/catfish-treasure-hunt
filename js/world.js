CF.World = {
  camera: { x: 0, y: 0 },
  seaweed: [],
  rocks: [],
  coral: [],

  init: function () {
    var C = CF.CONFIG;
    this.seaweed = [];
    this.rocks = [];
    this.coral = [];
    var i;

    for (i = 0; i < C.SEAWEED_COUNT; i++) {
      this.seaweed.push({
        x: CF.rand(80, C.WORLD_W - 80),
        y: CF.rand(C.WORLD_H - 250, C.WORLD_H - 30),
        blades: CF.randInt(3, 5),
        h: CF.rand(60, 150),
        phase: CF.rand(0, 6.28)
      });
    }

    for (i = 0; i < C.ROCK_COUNT; i++) {
      this.rocks.push({
        x: CF.rand(60, C.WORLD_W - 60),
        y: CF.rand(80, C.WORLD_H - 40),
        r: CF.rand(14, 38),
        shade: CF.rand(0, 1)
      });
    }

    for (i = 0; i < C.CORAL_COUNT; i++) {
      this.coral.push({
        x: CF.rand(80, C.WORLD_W - 80),
        y: CF.rand(C.WORLD_H - 240, C.WORLD_H - 40),
        size: CF.rand(24, 54),
        color: CF.pick(CF.CORAL_COLORS),
        branches: CF.randInt(3, 6),
        phase: CF.rand(0, 6.28)
      });
    }

    this.camera.x = 0;
    this.camera.y = 0;
  },

  snapCamera: function () {
    var C = CF.CONFIG;
    this.camera.x = CF.clamp(CF.Player.x - C.VIEW_W / 2, 0, Math.max(0, C.WORLD_W - C.VIEW_W));
    this.camera.y = CF.clamp(CF.Player.y - C.VIEW_H / 2, 0, Math.max(0, C.WORLD_H - C.VIEW_H));
  },

  updateCamera: function () {
    var C = CF.CONFIG;
    var tx = CF.Player.x - C.VIEW_W / 2;
    var ty = CF.Player.y - C.VIEW_H / 2;
    tx = CF.clamp(tx, 0, Math.max(0, C.WORLD_W - C.VIEW_W));
    ty = CF.clamp(ty, 0, Math.max(0, C.WORLD_H - C.VIEW_H));
    this.camera.x = CF.lerp(this.camera.x, tx, 0.14);
    this.camera.y = CF.lerp(this.camera.y, ty, 0.14);
  }
};
