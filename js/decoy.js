window.CF = window.CF || {};

CF.Decoy = {
  list: [],
  cooldown: 0,
  flash: 0,

  reset: function () {
    this.init();
  },

  init: function () {
    if (this.list && CF.Render3D.scene) {
      for (var i = 0; i < this.list.length; i++) {
        if (this.list[i].mesh) {
          CF.Render3D.scene.remove(this.list[i].mesh);
        }
      }
    }
    this.list = [];
    this.flash = 0;
    this.cooldown = CF.rand(CF.CONFIG.DECOY_INTERVAL_MIN, CF.CONFIG.DECOY_INTERVAL_MAX) * 0.5;
  },

  update: function (t, dt) {
    var C = CF.CONFIG;
    var p = CF.Player;

    this.flash = Math.max(0, this.flash - dt * 1.6);

    for (var i = this.list.length - 1; i >= 0; i--) {
      this.list[i].age += dt;
      if (this.list[i].age > C.DECOY_LIFE) {
        if (this.list[i].mesh && CF.Render3D.scene) {
          CF.Render3D.scene.remove(this.list[i].mesh);
        }
        this.list.splice(i, 1);
      }
    }

    this.cooldown -= dt;
    if (this.cooldown <= 0 && this.list.length < C.DECOY_MAX) {
      this.spawn();
      this.cooldown = CF.rand(C.DECOY_INTERVAL_MIN, C.DECOY_INTERVAL_MAX);
    }

    for (var j = this.list.length - 1; j >= 0; j--) {
      var dc = this.list[j];
      var dist = CF.dist3D(p.x, p.y, p.z, dc.x, dc.y, dc.z);

      if (dist < C.REVEAL_RADIUS) {
        dc.reveal = Math.min(1, dc.reveal + 0.05);
      } else {
        dc.reveal = Math.max(0, dc.reveal - 0.015);
      }

      // Dangerous pulsing red light
      if (dc.light) {
        var pulse = 0.6 + 0.4 * Math.sin(t * 0.01 + dc.glow);
        dc.light.intensity = dc.reveal * 1.8 * pulse;
      }

      if (dist < C.COLLECT_RADIUS) {
        this.explode(dc);
        if (dc.mesh && CF.Render3D.scene) {
          CF.Render3D.scene.remove(dc.mesh);
        }
        this.list.splice(j, 1);
        if (CF.Main.state !== 'play') return;
      }
    }
  },

  spawn: function () {
    var C = CF.CONFIG;
    var p = CF.Player;
    var ang = CF.rand(0, Math.PI * 2);
    var dist = CF.rand(120, 220);

    var x = CF.clamp(p.x + Math.cos(ang) * dist, -C.WORLD_HALF + 100, C.WORLD_HALF - 100);
    var z = CF.clamp(p.z + Math.sin(ang) * dist, -C.WORLD_HALF + 100, C.WORLD_HALF - 100);
    var y = CF.Render3D.getTerrainHeight(x, z) + 7;

    var mesh = this.createDecoyMesh();
    mesh.position.set(x, y, z);
    mesh.rotation.y = CF.rand(0, Math.PI * 2);
    CF.Render3D.scene.add(mesh);

    var warningLight = new THREE.PointLight(0xff3311, 0, 70);
    warningLight.position.set(0, 8, 0);
    mesh.add(warningLight);

    this.list.push({
      x: x,
      y: y,
      z: z,
      mesh: mesh,
      light: warningLight,
      reveal: 0,
      age: 0,
      glow: CF.rand(0, Math.PI * 2)
    });
  },

  createDecoyMesh: function () {
    var group = new THREE.Group();

    // Dark charred chest body
    var bodyGeom = new THREE.BoxGeometry(16, 9, 11);
    var charredMat = new THREE.MeshLambertMaterial({
      color: 0x42261d,
      emissive: 0x240e08
    });
    var body = new THREE.Mesh(bodyGeom, charredMat);
    group.add(body);

    // Rusty iron bands
    var rustMat = new THREE.MeshLambertMaterial({ color: 0x6e3828 });
    var bandGeom = new THREE.BoxGeometry(2.5, 9.2, 11.2);
    var b1 = new THREE.Mesh(bandGeom, rustMat);
    b1.position.set(-5, 0, 0);
    group.add(b1);
    var b2 = new THREE.Mesh(bandGeom, rustMat);
    b2.position.set(5, 0, 0);
    group.add(b2);

    // Lid
    var lidGeom = new THREE.CylinderGeometry(5.8, 5.8, 16.2, 10, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    var lid = new THREE.Mesh(lidGeom, charredMat);
    lid.position.set(0, 4.5, 0);
    group.add(lid);

    // Ticking bomb fuse cylinder on top
    var fuseGeom = new THREE.CylinderGeometry(0.8, 0.8, 8, 5);
    var fuseMat = new THREE.MeshBasicMaterial({ color: 0x221105 });
    var fuse = new THREE.Mesh(fuseGeom, fuseMat);
    fuse.position.set(2, 9, 0);
    fuse.rotation.set(0.3, 0, 0.4);
    group.add(fuse);

    // Spark tip
    var sparkGeom = new THREE.SphereGeometry(1.5, 6, 6);
    var sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    var spark = new THREE.Mesh(sparkGeom, sparkMat);
    spark.position.set(4, 13, 1);
    group.add(spark);

    return group;
  },

  explode: function (dc) {
    var C = CF.CONFIG;
    CF.Player.health = Math.max(0, CF.Player.health - C.HEALTH_MAX * C.DECOY_DAMAGE);
    this.flash = 1;
    CF.Audio.explode();
    CF.Render3D.burst(dc.x, dc.y + 8, dc.z, true);

    if (CF.Player.health <= 0) {
      CF.Main.lose();
    }
  }
};
