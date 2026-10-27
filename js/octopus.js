window.CF = window.CF || {};

CF.Octopus = {
  alive: true,
  hp: 280,
  maxHp: 280,
  x: 480,
  y: -520,
  z: -580,
  yaw: 0,
  pitch: 0,
  speed: 0,
  state: 'lurking', // 'lurking' | 'chase_floor' | 'attacking' | 'defeated'
  attackCooldown: 0,
  damageCooldown: 0,
  flinchTimer: 0,
  chargeTimer: 0, // Enraged Jump-Scare Charge timer when attacked with bubbles
  mesh: null,
  mantleMesh: null,
  eyeLights: [],
  tentacles: [],
  inkClouds: [],

  init: function () {
    if (!CF.Render3D.scene) return;
    this.reset();
    if (!this.mesh) {
      this.buildMesh();
    }
  },

  reset: function () {
    this.alive = true;
    this.maxHp = 280;
    this.hp = 280;
    this.x = 480;
    this.z = -580;
    this.y = CF.Render3D.getTerrainHeight(this.x, this.z) + 24;
    this.yaw = 0;
    this.speed = 0;
    this.state = 'lurking';
    this.attackCooldown = 0;
    this.damageCooldown = 0;
    this.flinchTimer = 0;
    this.chargeTimer = 0;
    this.clearInkClouds();

    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.scale.set(1, 1, 1);
    }

    var bossBar = document.getElementById('bossBarContainer');
    if (bossBar) {
      bossBar.classList.add('hidden');
      bossBar.style.display = 'none';
    }
  },

  buildMesh: function () {
    var group = new THREE.Group();
    var scene = CF.Render3D.scene;

    // Materials
    var mantleMat = new THREE.MeshLambertMaterial({
      color: 0x931b5c,
      emissive: 0x240618
    });
    this.mantleMat = mantleMat;

    var bellyMat = new THREE.MeshLambertMaterial({
      color: 0xde438d,
      emissive: 0x3d0d26
    });

    var suckerMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    var eyeWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xffea00
    });

    var pupilMat = new THREE.MeshBasicMaterial({
      color: 0x111111
    });

    // 1. Giant Bulbous Mantle (Octopus Head)
    var mantleGeom = new THREE.SphereGeometry(32, 20, 18);
    mantleGeom.scale(1.15, 1.45, 1.1);
    var mantle = new THREE.Mesh(mantleGeom, mantleMat);
    mantle.position.set(0, 18, -6);
    group.add(mantle);
    this.mantleMesh = mantle;

    // Head crest ridges
    var crestGeom = new THREE.ConeGeometry(5, 18, 5);
    crestGeom.rotateX(-0.4);
    var crestL = new THREE.Mesh(crestGeom, mantleMat);
    crestL.position.set(14, 46, -10);
    group.add(crestL);

    var crestR = new THREE.Mesh(crestGeom, mantleMat);
    crestR.position.set(-14, 46, -10);
    group.add(crestR);

    // 2. Cephalopod Eyes (Large, expressive, yellow with horizontal pupils)
    var eyeGeom = new THREE.SphereGeometry(7.5, 14, 12);
    eyeGeom.scale(1.0, 1.0, 0.7);

    var leftEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    leftEye.position.set(16, 12, 19);
    leftEye.rotation.y = 0.35;
    group.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    rightEye.position.set(-16, 12, 19);
    rightEye.rotation.y = -0.35;
    group.add(rightEye);

    // Horizontal slit pupils
    var pupilGeom = new THREE.BoxGeometry(9.5, 2.2, 1.2);
    var pupilL = new THREE.Mesh(pupilGeom, pupilMat);
    pupilL.position.set(17, 12, 23.5);
    pupilL.rotation.y = 0.35;
    group.add(pupilL);

    var pupilR = new THREE.Mesh(pupilGeom, pupilMat);
    pupilR.position.set(-17, 12, 23.5);
    pupilR.rotation.y = -0.35;
    group.add(pupilR);

    // Glowing Eye Lights in the abyss
    var eyeLight = new THREE.PointLight(0xffdd00, 2.4, 95);
    eyeLight.position.set(0, 14, 25);
    group.add(eyeLight);
    this.eyeLight = eyeLight;

    // 3. Siphon / Ink Nozzle (Points forward/down)
    var siphonGeom = new THREE.CylinderGeometry(4.2, 6.5, 16, 10);
    siphonGeom.rotateX(0.7);
    var siphon = new THREE.Mesh(siphonGeom, bellyMat);
    siphon.position.set(0, -4, 22);
    group.add(siphon);

    // 4. Eight Articulated Segmented Tentacles!
    this.tentacles = [];
    var suckerGeom = new THREE.TorusGeometry(1.6, 0.65, 6, 10);
    suckerGeom.rotateX(Math.PI / 2);

    for (var t = 0; t < 8; t++) {
      var angle = (t / 8) * Math.PI * 2;
      var root = new THREE.Group();
      root.position.set(Math.sin(angle) * 22, -2, Math.cos(angle) * 22);
      root.rotation.y = angle;
      group.add(root);

      var segments = [];
      var segLengths = [20, 18, 16, 14];
      var segRadii = [5.6, 4.5, 3.2, 1.8];

      var parent = root;
      for (var s = 0; s < 4; s++) {
        var segGroup = new THREE.Group();
        if (s > 0) {
          segGroup.position.set(0, 0, segLengths[s - 1]);
        }

        var segGeom = new THREE.CylinderGeometry(segRadii[s] * 0.8, segRadii[s], segLengths[s], 8);
        segGeom.rotateX(Math.PI / 2);
        segGeom.translate(0, 0, segLengths[s] / 2);

        var segMesh = new THREE.Mesh(segGeom, mantleMat);
        segGroup.add(segMesh);

        // Glowing suckers on the underside
        for (var sk = 0; sk < 3; sk++) {
          var sucker = new THREE.Mesh(suckerGeom, suckerMat);
          sucker.position.set(0, -segRadii[s] * 0.9, (sk + 0.5) * (segLengths[s] / 3));
          segGroup.add(sucker);
        }

        parent.add(segGroup);
        segments.push(segGroup);
        parent = segGroup;
      }

      this.tentacles.push({
        root: root,
        segments: segments,
        angle: angle,
        baseAngle: angle
      });
    }

    group.position.set(this.x, this.y, this.z);
    scene.add(group);
    this.mesh = group;
  },

  update: function (dt, t) {
    if (!this.alive) return;
    var C = CF.CONFIG;
    var p = CF.Player;
    if (!p) return;

    var floorY = CF.Render3D.getTerrainHeight(this.x, this.z) + 24;
    this.y = floorY; // Firmly anchored directly on the sea floor!

    var dx = p.x - this.x;
    var dz = p.z - this.z;
    var distH = Math.hypot(dx, dz);
    var playerFloorY = CF.Render3D.getTerrainHeight(p.x, p.z);
    var playerDistFromFloor = p.y - playerFloorY;

    // KEY REQUIREMENT: Giant Octopus ONLY attacks on the sea floor!
    // If the catfish is swimming up in the open water column (> 72m above seafloor),
    // the octopus cannot reach them and remains lurking safely below.
    var isPlayerOnSeaFloor = (playerDistFromFloor <= 72);

    // Boss HUD management
    var bossBar = document.getElementById('bossBarContainer');
    var bossHpFill = document.getElementById('bossHpFill');
    var bossBadge = document.getElementById('bossStateLabel');

    if (distH < 620) {
      if (bossBar) {
        bossBar.classList.remove('hidden');
        bossBar.style.display = 'block';
      }
      if (bossHpFill) {
        var pct = Math.max(0, (this.hp / this.maxHp) * 100);
        bossHpFill.style.width = pct + '%';
      }
    } else {
      if (bossBar) {
        bossBar.classList.add('hidden');
        bossBar.style.display = 'none';
      }
    }

    // Cooldown decays
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.damageCooldown > 0) this.damageCooldown -= dt;
    if (this.flinchTimer > 0) this.flinchTimer -= dt;
    if (this.chargeTimer > 0) this.chargeTimer -= dt;

    // Flinch Flash when damaged
    if (this.mantleMat) {
      if (this.flinchTimer > 0) {
        this.mantleMat.color.setHex(0xffffff);
        this.mantleMat.emissive.setHex(0xff2244);
      } else if (this.chargeTimer > 0) {
        this.mantleMat.color.setHex(0xd4113b);
        this.mantleMat.emissive.setHex(0x550a1a);
      } else {
        this.mantleMat.color.setHex(0x931b5c);
        this.mantleMat.emissive.setHex(0x240618);
      }
    }

    var targetYaw = Math.atan2(dx, dz);

    if (this.chargeTimer > 0) {
      // ============================================
      // 1. ENRAGED JUMP-SCARE CHARGE!
      // (Triggered ONLY when attacked with bubbles!)
      // ============================================
      this.state = 'charge_jump_scare';
      if (bossBadge) {
        bossBadge.textContent = '⚡ ENRAGED JUMP SCARE CHARGE!';
        bossBadge.className = 'boss-state-badge badge-danger';
      }

      if (this.eyeLight) {
        this.eyeLight.color.setHex(0xff0000);
        this.eyeLight.intensity = 4.2;
      }

      // Fast, aggressive snap turn directly toward catfish
      this.yaw = CF.lerpAngle(this.yaw, targetYaw, 0.085);

      // Sprints at terrifying speed (11.5, faster than catfish max speed!)
      this.speed = CF.lerp(this.speed, 11.5, 0.08);

      this.x += Math.sin(this.yaw) * this.speed;
      this.z += Math.cos(this.yaw) * this.speed;

      // Seafloor whip slam during charge
      if (distH < 85 && isPlayerOnSeaFloor && this.damageCooldown <= 0) {
        this.damageCooldown = 1.6;
        if (p.takeDamage) {
          p.takeDamage(10); // Depletes lifeline by 10% max!
        }
        if (CF.Audio && CF.Audio.bossRoar) CF.Audio.bossRoar();
        CF.Render3D.burst(this.x, this.y + 12, this.z, true);
      }

    } else if (isPlayerOnSeaFloor && distH < 320) {
      // ============================================
      // 2. NORMAL SEA FLOOR LURK / SLOW PATROL
      // (Slow movement, NO high speed charge!)
      // ============================================
      this.state = 'lurk_floor';
      if (bossBadge) {
        bossBadge.textContent = '🐙 LURKING ON SEA FLOOR';
        bossBadge.className = 'boss-state-badge';
      }

      if (this.eyeLight) {
        this.eyeLight.color.setHex(0xffaa00);
        this.eyeLight.intensity = 2.0;
      }

      this.yaw = CF.lerpAngle(this.yaw, targetYaw, 0.025);

      // Slow, lazy creeping (only 1.8 units/frame)
      this.speed = CF.lerp(this.speed, (distH > 100 ? 1.8 : 0.6), 0.04);
      this.x += Math.sin(this.yaw) * this.speed;
      this.z += Math.cos(this.yaw) * this.speed;

      // Swats with tentacle if player comes right into its mouth/tentacles
      if (distH < 75 && this.damageCooldown <= 0) {
        this.damageCooldown = 1.8;
        if (p.takeDamage) {
          p.takeDamage(10); // Depletes 10% max!
        }
      }

    } else {
      // ============================================
      // 3. IDLE / UPPER WATER SAFE
      // ============================================
      this.state = 'lurking';
      if (bossBadge) {
        if (!isPlayerOnSeaFloor && distH < 500) {
          bossBadge.textContent = '🌊 SAFE (IN UPPER WATER)';
          bossBadge.className = 'boss-state-badge badge-safe';
        } else {
          bossBadge.textContent = 'LURKING ON SEA FLOOR';
          bossBadge.className = 'boss-state-badge';
        }
      }

      if (this.eyeLight) {
        this.eyeLight.color.setHex(0xffdd00);
        this.eyeLight.intensity = 1.6;
      }

      this.speed = CF.lerp(this.speed, 0, 0.05);

      // Calmly watches player
      if (distH < 450) {
        this.yaw = CF.lerpAngle(this.yaw, targetYaw, 0.015);
      }
    }

    // 3. Animate 3D Mesh Transform & Tentacle Slithering
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.y = this.yaw;

      // Mantle breathing pulse
      if (this.mantleMesh) {
        var breath = Math.sin(t * 0.003) * 0.06;
        this.mantleMesh.scale.set(1.15 + breath, 1.45 - breath * 0.5, 1.1 + breath);
      }

      // Tentacle animation
      var isAttacking = (this.state === 'chase_floor');
      var waveSpeed = isAttacking ? 0.006 : 0.0028;
      var waveAmp = isAttacking ? 0.45 : 0.22;

      for (var ti = 0; ti < this.tentacles.length; ti++) {
        var tObj = this.tentacles[ti];
        var segs = tObj.segments;

        for (var si = 0; si < segs.length; si++) {
          var seg = segs[si];
          var phase = t * waveSpeed + ti * 0.78 + si * 0.65;
          seg.rotation.x = Math.sin(phase) * waveAmp;
          seg.rotation.z = Math.cos(phase * 0.8) * (waveAmp * 0.75);

          if (isAttacking && (ti === 0 || ti === 7)) {
            // Front attacking tentacles curl upward and slam downward!
            seg.rotation.x += Math.sin(t * 0.008) * 0.35 - 0.2;
          }
        }
      }
    }

    // 4. Update Ink Clouds
    this.updateInkClouds(dt);
  },

  spawnInkCloud: function (ix, iy, iz) {
    var scene = CF.Render3D.scene;
    if (!scene) return;

    var inkGeom = new THREE.SphereGeometry(CF.rand(18, 28), 10, 8);
    var inkMat = new THREE.MeshBasicMaterial({
      color: 0x180524,
      transparent: true,
      opacity: 0.68
    });
    var inkMesh = new THREE.Mesh(inkGeom, inkMat);
    inkMesh.position.set(ix, iy, iz);
    scene.add(inkMesh);

    this.inkClouds.push({
      mesh: inkMesh,
      x: ix,
      y: iy,
      z: iz,
      life: 4.0,
      maxLife: 4.0,
      scale: 1.0
    });
  },

  updateInkClouds: function (dt) {
    var scene = CF.Render3D.scene;
    var p = CF.Player;

    for (var i = this.inkClouds.length - 1; i >= 0; i--) {
      var ic = this.inkClouds[i];
      ic.life -= dt;
      ic.scale += dt * 0.35;

      if (ic.mesh) {
        ic.mesh.scale.set(ic.scale, ic.scale * 0.8, ic.scale);
        ic.mesh.material.opacity = Math.max(0, (ic.life / ic.maxLife) * 0.68);
      }

      // Check if catfish swims inside dark ink cloud
      if (p && ic.life > 0.5) {
        var dInk = CF.dist3D(p.x, p.y, p.z, ic.x, ic.y, ic.z);
        if (dInk < 35 * ic.scale) {
          p.speed *= 0.94; // Slows catfish in thick ink!
          p.health = Math.max(0, p.health - 4.0 * dt);
        }
      }

      if (ic.life <= 0) {
        if (ic.mesh && scene) {
          scene.remove(ic.mesh);
          if (ic.mesh.geometry) ic.mesh.geometry.dispose();
          if (ic.mesh.material) ic.mesh.material.dispose();
        }
        this.inkClouds.splice(i, 1);
      }
    }
  },

  clearInkClouds: function () {
    var scene = CF.Render3D.scene;
    if (!scene) return;
    for (var i = 0; i < this.inkClouds.length; i++) {
      var ic = this.inkClouds[i];
      if (ic.mesh) {
        scene.remove(ic.mesh);
        if (ic.mesh.geometry) ic.mesh.geometry.dispose();
        if (ic.mesh.material) ic.mesh.material.dispose();
      }
    }
    this.inkClouds = [];
  },

  takeDamage: function (amount, hitX, hitY, hitZ) {
    if (!this.alive) return;

    this.hp = Math.max(0, this.hp - amount);
    this.flinchTimer = 0.35;
    // TRIGGER ENRAGED JUMP-SCARE CHARGE (speed rush towards catfish!)
    this.chargeTimer = 3.2;

    // Ink puff on hit
    this.spawnInkCloud(hitX, hitY, hitZ);

    if (CF.Audio && CF.Audio.bossHit) CF.Audio.bossHit();
    if (CF.Audio && CF.Audio.bossRoar) CF.Audio.bossRoar();

    // Check Defeat!
    if (this.hp <= 0) {
      this.alive = false;
      this.state = 'defeated';
      this.onDefeat();
    }
  },

  onDefeat: function () {
    var self = this;
    var scene = CF.Render3D.scene;

    // Dramatic defeat effects: geyser of rainbow bubbles & star confetti!
    for (var b = 0; b < 24; b++) {
      setTimeout(function () {
        CF.Render3D.burst(
          self.x + CF.rand(-35, 35),
          self.y + CF.rand(0, 50),
          self.z + CF.rand(-35, 35),
          false
        );
      }, b * 80);
    }

    if (CF.Audio && CF.Audio.bossDefeat) {
      CF.Audio.bossDefeat();
    }

    // Shrink & spin defeat animation
    var shrinkInterval = setInterval(function () {
      if (self.mesh) {
        self.mesh.scale.multiplyScalar(0.92);
        self.mesh.rotation.y += 0.25;
        if (self.mesh.scale.x < 0.08) {
          clearInterval(shrinkInterval);
          if (scene) scene.remove(self.mesh);
        }
      }
    }, 40);

    // Hide boss bar
    var bossBar = document.getElementById('bossBarContainer');
    if (bossBar) {
      bossBar.classList.add('hidden');
      bossBar.style.display = 'none';
    }

    // Check if both tasks are complete or announce remaining chests needed!
    setTimeout(function () {
      if (CF.Main && CF.Main.checkGameWin) {
        CF.Main.checkGameWin();
      }
    }, 1800);
  }
};
