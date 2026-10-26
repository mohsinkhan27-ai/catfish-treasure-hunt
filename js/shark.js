window.CF = window.CF || {};

CF.Shark = {
  x: 580,
  y: -180,
  z: 620,
  yaw: Math.PI,
  pitch: 0,
  speed: 0,
  state: 'patrol',
  threat: 0,
  draining: false,
  mesh: null,
  tailMesh: null,
  eyeLight: null,
  wander: { x: 520, y: -180, z: 580 },

  reset: function () {
    var C = CF.CONFIG;
    this.x = 580;
    this.y = -180;
    this.z = 620;
    this.yaw = Math.PI;
    this.pitch = 0;
    this.speed = C.SHARK_CRUISE_SPEED;
    this.state = 'patrol';
    this.threat = 0;
    this.draining = false;
    this.wander = { x: 520, y: -180, z: 580 };
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(0, this.yaw, 0);
    }
  },

  init: function () {
    this.reset();
    if (!this.mesh) {
      this.buildMesh();
    }
  },

  buildMesh: function () {
    var group = new THREE.Group();

    var sharkGreyMat = new THREE.MeshLambertMaterial({ color: 0x33414a });
    var darkFinMat = new THREE.MeshLambertMaterial({ color: 0x242e35 });
    var whiteBellyMat = new THREE.MeshLambertMaterial({ color: 0xc9d8e2 });
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x080808 });
    var toothMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Hydrodynamic Apex Snout & Head
    var snoutGeom = new THREE.ConeGeometry(13.5, 26, 14);
    snoutGeom.rotateX(Math.PI / 2);
    snoutGeom.scale(0.85, 0.95, 1.0);
    var snout = new THREE.Mesh(snoutGeom, sharkGreyMat);
    snout.position.set(0, 0, 15);
    group.add(snout);

    // White belly on snout
    var snoutBellyGeom = new THREE.ConeGeometry(11, 24, 10);
    snoutBellyGeom.rotateX(Math.PI / 2);
    snoutBellyGeom.scale(0.8, 0.45, 1.0);
    var snoutBelly = new THREE.Mesh(snoutBellyGeom, whiteBellyMat);
    snoutBelly.position.set(0, -4.5, 14);
    group.add(snoutBelly);

    // Predatory Mouth & Teeth under snout
    var mouthGeom = new THREE.BoxGeometry(11, 4.5, 12);
    var mouthMat = new THREE.MeshBasicMaterial({ color: 0x1f0606 });
    var mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, -5.2, 11);
    group.add(mouth);

    // Jagged white teeth row
    for (var t = 0; t < 5; t++) {
      var toothGeom = new THREE.ConeGeometry(0.9, 2.4, 3);
      var toothL = new THREE.Mesh(toothGeom, toothMat);
      toothL.position.set(4.2 - t * 2.1, -4.8, 16.5);
      toothL.rotation.set(Math.PI, 0, 0);
      group.add(toothL);
    }

    // 2. Eyes
    var eyeGeom = new THREE.SphereGeometry(2.0, 8, 8);
    var leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(8.2, 3.2, 14);
    group.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-8.2, 3.2, 14);
    group.add(rightEye);

    // 3. Volumetric Muscular Torso (Barrel Chest)
    var torsoGeom = new THREE.CylinderGeometry(7, 14, 40, 16);
    torsoGeom.rotateX(Math.PI / 2);
    torsoGeom.scale(0.9, 1.2, 1.0);
    var torso = new THREE.Mesh(torsoGeom, sharkGreyMat);
    torso.position.set(0, 0, -8);
    group.add(torso);

    // White underbelly contour
    var torsoBellyGeom = new THREE.CylinderGeometry(5.5, 12, 38, 12);
    torsoBellyGeom.rotateX(Math.PI / 2);
    torsoBellyGeom.scale(0.8, 0.48, 1.0);
    var torsoBelly = new THREE.Mesh(torsoBellyGeom, whiteBellyMat);
    torsoBelly.position.set(0, -6.8, -7);
    group.add(torsoBelly);

    // Sculpted 3D Gill Slits (5 on each side)
    var gillMat = new THREE.MeshBasicMaterial({ color: 0x151c20 });
    for (var g = 0; g < 5; g++) {
      var gillGeom = new THREE.BoxGeometry(0.8, 7.5 - g * 0.5, 0.7);
      var gL = new THREE.Mesh(gillGeom, gillMat);
      gL.position.set(13.2 - g * 0.5, -1, 4 - g * 2.6);
      gL.rotation.set(0, 0.35, 0.15);
      group.add(gL);

      var gR = new THREE.Mesh(gillGeom, gillMat);
      gR.position.set(-13.2 + g * 0.5, -1, 4 - g * 2.6);
      gR.rotation.set(0, -0.35, -0.15);
      group.add(gR);
    }

    // 4. Iconic Huge 3D Dorsal Fin
    var dorsalGeom = new THREE.ConeGeometry(9.5, 32, 4);
    dorsalGeom.scale(0.18, 1, 1.5);
    var dorsal = new THREE.Mesh(dorsalGeom, darkFinMat);
    dorsal.position.set(0, 21, -6);
    dorsal.rotation.set(-0.75, 0, 0);
    group.add(dorsal);

    // 5. Swept 3D Pectoral Wings
    var pecGeom = new THREE.ConeGeometry(10, 30, 4);
    pecGeom.scale(0.16, 1, 1.4);

    var leftPec = new THREE.Mesh(pecGeom, darkFinMat);
    leftPec.position.set(18, -4, 4);
    leftPec.rotation.set(0.4, 0, -1.15);
    group.add(leftPec);

    var rightPec = new THREE.Mesh(pecGeom, darkFinMat);
    rightPec.position.set(-18, -4, 4);
    rightPec.rotation.set(0.4, 0, 1.15);
    group.add(rightPec);

    // 6. Articulated Tail Peduncle & Heterocercal Crescent Caudal Fin
    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -28);

    var stemGeom = new THREE.CylinderGeometry(3.2, 6.8, 22, 10);
    stemGeom.rotateX(Math.PI / 2);
    var stem = new THREE.Mesh(stemGeom, sharkGreyMat);
    stem.position.set(0, 0, -11);
    tailGroup.add(stem);

    // Tall upper lobe of crescent tail
    var upperLobeGeom = new THREE.ConeGeometry(8, 28, 4);
    upperLobeGeom.scale(0.16, 1, 1.3);
    var upperLobe = new THREE.Mesh(upperLobeGeom, darkFinMat);
    upperLobe.position.set(0, 12, -26);
    upperLobe.rotation.set(-0.85, 0, 0);
    tailGroup.add(upperLobe);

    // Lower lobe of crescent tail
    var lowerLobeGeom = new THREE.ConeGeometry(6, 18, 4);
    lowerLobeGeom.scale(0.16, 1, 1.3);
    var lowerLobe = new THREE.Mesh(lowerLobeGeom, darkFinMat);
    lowerLobe.position.set(0, -8, -24);
    lowerLobe.rotation.set(0.75, 0, 0);
    tailGroup.add(lowerLobe);

    group.add(tailGroup);
    this.tailMesh = tailGroup;

    // Red predatory eye light
    var eyeLight = new THREE.PointLight(0xff3322, 0.9, 65);
    eyeLight.position.set(0, 5, 20);
    group.add(eyeLight);
    this.eyeLight = eyeLight;

    group.position.set(this.x, this.y, this.z);
    CF.Render3D.scene.add(group);
    this.mesh = group;
  },

  update: function (t, dt) {
    var C = CF.CONFIG;
    var p = CF.Player;

    var distToPlayer = CF.dist3D(this.x, this.y, this.z, p.x, p.y, p.z);
    var target = null;
    var targetSpeed = C.SHARK_CRUISE_SPEED;

    // Balanced AI: Detects at 240, loses track if player escapes beyond 360
    if (distToPlayer < C.SHARK_DETECT) {
      this.state = 'chase';
    } else if (distToPlayer > (C.SHARK_LOSE_DETECT || 360)) {
      this.state = 'patrol';
    }

    if (this.state === 'chase') {
      targetSpeed = C.SHARK_CHASE_SPEED; // Slower than player, you CAN escape!
      target = { x: p.x, y: p.y, z: p.z };
    } else {
      targetSpeed = C.SHARK_CRUISE_SPEED;
      if (CF.dist3D(this.x, this.y, this.z, this.wander.x, this.wander.y, this.wander.z) < 80) {
        this.wander = {
          x: CF.rand(-C.WORLD_HALF + 150, C.WORLD_HALF - 150),
          y: CF.rand(C.WORLD_FLOOR + 40, C.WORLD_SURFACE - 30),
          z: CF.rand(-C.WORLD_HALF + 150, C.WORLD_HALF - 150)
        };
      }
      target = this.wander;
    }

    // 3D Steering
    var dx = target.x - this.x;
    var dy = target.y - this.y;
    var dz = target.z - this.z;
    var horiz = Math.hypot(dx, dz) || 1;

    var desiredYaw = Math.atan2(dx, dz);
    var desiredPitch = Math.atan2(dy, horiz);

    this.yaw = CF.lerpAngle(this.yaw, desiredYaw, 0.035);
    this.pitch = CF.lerp(this.pitch, desiredPitch, 0.03);
    this.speed = CF.lerp(this.speed, targetSpeed, 0.04);

    var fwdX = Math.sin(this.yaw) * Math.cos(this.pitch);
    var fwdY = Math.sin(this.pitch);
    var fwdZ = Math.cos(this.yaw) * Math.cos(this.pitch);

    this.x += fwdX * this.speed;
    this.y += fwdY * this.speed;
    this.z += fwdZ * this.speed;

    this.x = CF.clamp(this.x, -C.WORLD_HALF + 50, C.WORLD_HALF - 50);
    this.z = CF.clamp(this.z, -C.WORLD_HALF + 50, C.WORLD_HALF - 50);
    var floorY = CF.Render3D.getTerrainHeight(this.x, this.z) + 20;
    this.y = CF.clamp(this.y, floorY, C.WORLD_SURFACE - 15);

    // Threat and drain balance
    this.threat = CF.clamp(1 - distToPlayer / C.SHARK_DANGER, 0, 1);
    this.draining = distToPlayer < C.SHARK_DRAIN_RADIUS;

    if (this.draining) {
      var rate = C.SHARK_DRAIN_MAX * (1 - distToPlayer / C.SHARK_DRAIN_RADIUS);
      p.health = Math.max(0, p.health - rate * dt);

      if (Math.random() < 0.25) {
        CF.Render3D.burst(p.x, p.y, p.z, true);
      }

      if (p.health <= 0) {
        CF.Main.lose();
        return;
      }
    } else {
      p.health = Math.min(C.HEALTH_MAX, p.health + C.HEALTH_REGEN * dt);
    }

    // Mesh transform & predatory thrash
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(-this.pitch, this.yaw, 0, 'YXZ');

      var isChasing = this.state === 'chase';
      if (this.eyeLight) {
        this.eyeLight.intensity = isChasing ? 1.6 : 0.4;
      }

      if (this.tailMesh) {
        var freq = isChasing ? 0.022 : 0.012;
        var amp = isChasing ? 0.24 : 0.12;
        this.tailMesh.rotation.y = Math.sin(t * freq) * amp;
      }
    }
  }
};
