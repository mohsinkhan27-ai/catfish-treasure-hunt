window.CF = window.CF || {};

CF.Treasure = {
  items: [],
  foundCount: 0,
  signal: 0,

  reset: function () {
    this.foundCount = 0;
    this.signal = 0;
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      it.found = false;
      it.reveal = 0;
      if (it.mesh) it.mesh.visible = true;
      if (it.light) it.light.intensity = 0;
    }
  },

  init: function () {
    var C = CF.CONFIG;
    if (this.items && this.items.length > 0) {
      this.reset();
      return;
    }

    var sectors = [];
    var cols = 3;
    var rows = 2;
    var secW = (C.WORLD_SIZE - 200) / cols;
    var secH = (C.WORLD_SIZE - 200) / rows;

    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) {
        sectors.push({
          minX: -C.WORLD_HALF + 100 + c * secW,
          maxX: -C.WORLD_HALF + 100 + (c + 1) * secW,
          minZ: -C.WORLD_HALF + 100 + r * secH,
          maxZ: -C.WORLD_HALF + 100 + (r + 1) * secH
        });
      }
    }

    for (var i = 0; i < C.TREASURE_COUNT; i++) {
      var sec = sectors[i % sectors.length];
      var tx = CF.rand(sec.minX + 30, sec.maxX - 30);
      var tz = CF.rand(sec.minZ + 30, sec.maxZ - 30);
      var ty = CF.Render3D.getTerrainHeight(tx, tz) + 7;

      var chestMesh = this.createChestMesh();
      chestMesh.position.set(tx, ty, tz);
      chestMesh.rotation.y = CF.rand(0, Math.PI * 2);
      CF.Render3D.scene.add(chestMesh);

      var pointLight = new THREE.PointLight(0xffdf66, 0, 85);
      pointLight.position.set(0, 10, 0);
      chestMesh.add(pointLight);

      this.items.push({
        x: tx,
        y: ty,
        z: tz,
        mesh: chestMesh,
        light: pointLight,
        found: false,
        reveal: 0,
        glowPhase: CF.rand(0, Math.PI * 2)
      });
    }
  },

  createChestMesh: function () {
    var group = new THREE.Group();

    // Wood chest body
    var bodyGeom = new THREE.BoxGeometry(16, 9, 11);
    var woodMat = new THREE.MeshLambertMaterial({
      color: 0x8b5a2b,
      emissive: 0x1f1408
    });
    var body = new THREE.Mesh(bodyGeom, woodMat);
    group.add(body);

    // Brass edge trim
    var brassMat = new THREE.MeshLambertMaterial({
      color: 0xe5ba45,
      emissive: 0x3d2f0a
    });

    var bandGeom1 = new THREE.BoxGeometry(2.5, 9.2, 11.2);
    var band1 = new THREE.Mesh(bandGeom1, brassMat);
    band1.position.set(-5, 0, 0);
    group.add(band1);

    var band2 = new THREE.Mesh(bandGeom1, brassMat);
    band2.position.set(5, 0, 0);
    group.add(band2);

    // Chest lid
    var lidGeom = new THREE.CylinderGeometry(5.8, 5.8, 16.2, 10, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    var lid = new THREE.Mesh(lidGeom, woodMat);
    lid.position.set(0, 4.5, 0);
    group.add(lid);

    // Gold lock latch
    var lockGeom = new THREE.BoxGeometry(3, 3, 1.2);
    var lock = new THREE.Mesh(lockGeom, brassMat);
    lock.position.set(0, 3, 5.8);
    group.add(lock);

    return group;
  },

  ACCESSORIES: [
    { id: 'bubblegun', name: '🫧 Dual Bubble Blaster Gun', icon: '🫧', desc: 'Twin bubble cannons! Blast bubble torpedoes with [F] or [FIRE] to destroy the Giant Octopus on the seafloor!' },
    { id: 'pirate', name: 'Pirate Hat & Eyepatch', icon: '🏴‍☠️', desc: 'Ahoy Captain! Stylish black bicorne with gold trim and authentic eyepatch.' },
    { id: 'scuba', name: 'Scuba Mask & Snorkel', icon: '🤿', desc: 'Deep-sea diver goggles with yellow breathing snorkel tube and bubble sounds!' },
    { id: 'crown', name: 'Golden Crown', icon: '👑', desc: 'A royal golden crown with ruby gems and shimmering light fit for ocean royalty.' },
    { id: 'starfish', name: 'Glowing Starfish Hat', icon: '⭐️', desc: 'A cute bioluminescent pink starfish clinging happily to your head!' },
    { id: 'rainbow', name: 'Rainbow Bubble Trail', icon: '🌈', desc: 'Emits a vibrant stream of rainbow bubbles from your tail!' },
    { id: 'sparkle', name: 'Sparkle Dust Comet', icon: '✨', desc: 'Glittering golden stars and cyan comet sparks drift behind your tail!' }
  ],

  nearest: function () {
    var best = null;
    var bd = Infinity;
    var p = CF.Player;
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.found) continue;
      var d = CF.dist3D(p.x, p.y, p.z, it.x, it.y, it.z);
      if (d < bd) { bd = d; best = it; }
    }
    return { item: best, dist: bd };
  },

  update: function () {
    var C = CF.CONFIG;
    var p = CF.Player;
    var n = this.nearest();
    this.signal = CF.clamp(1 - n.dist / C.HOTCOLD_MAX, 0, 1);

    var t = CF.Render3D.clock || performance.now();

    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      if (it.found) continue;

      var d = CF.dist3D(p.x, p.y, p.z, it.x, it.y, it.z);

      if (d < C.REVEAL_RADIUS) {
        it.reveal = Math.min(1, it.reveal + 0.05);
      } else {
        it.reveal = Math.max(0, it.reveal - 0.015);
      }

      // Dynamic golden light beacon
      if (it.light) {
        var pulse = 0.7 + 0.3 * Math.sin(t * 0.006 + it.glowPhase);
        it.light.intensity = it.reveal * 1.6 * pulse;
      }

      // Collect condition
      if (d < C.COLLECT_RADIUS) {
        it.found = true;
        this.foundCount++;
        CF.Audio.collect();
        CF.Render3D.burst(it.x, it.y + 8, it.z, false);

        if (it.mesh && CF.Render3D.scene) {
          CF.Render3D.scene.remove(it.mesh);
        }

        // Kid-Friendly Accessory Unlock!
        var reward = this.ACCESSORIES[(this.foundCount - 1) % this.ACCESSORIES.length];
        if (reward && CF.Player && CF.Player.unlock) {
          CF.Player.unlock(reward.id);
          CF.Audio.unlock();
          if (CF.HUD && CF.HUD.showUnlock) {
            CF.HUD.showUnlock(reward);
          }
        }

        // Objective check
        if (this.foundCount >= C.TREASURE_COUNT) {
          if (CF.Octopus && CF.Octopus.alive) {
            if (CF.HUD && CF.HUD.showObjectiveToast) {
              CF.HUD.showObjectiveToast('📦 All 6 treasures recovered! Now hunt down and destroy the Giant Octopus on the seafloor to win!');
            }
          }
        }
      }
    }
  }
};
