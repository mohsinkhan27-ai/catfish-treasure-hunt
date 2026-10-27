window.CF = window.CF || {};

CF.Shark = {
  // Primary backward-compatible state (tracks closest predator)
  x: 650,
  y: -190,
  z: 650,
  yaw: Math.PI,
  pitch: 0,
  speed: 0,
  state: 'patrol',
  threat: 0,
  draining: false,
  mesh: null,
  list: [],

  init: function () {
    if (!CF.Render3D.scene) return;
    this.list = [];

    // 1. Apex Great White Shark
    var white = this.createPredatorDef({
      name: 'Great White Shark',
      type: 'white',
      x: 650, y: -190, z: 650,
      detectRadius: 320, loseRadius: 500,
      cruiseSpeed: 3.2, chaseSpeed: 6.8,
      minY: -530, maxY: -40,
      turnSpeed: 0.035,
      meshBuilder: this.buildWhiteSharkMesh.bind(this)
    });
    this.list.push(white);

    // 2. Great Hammerhead Shark (Reef & Seafloor Hunter)
    var hammerhead = this.createPredatorDef({
      name: 'Great Hammerhead',
      type: 'hammerhead',
      x: -580, y: -210, z: 450,
      detectRadius: 300, loseRadius: 460,
      cruiseSpeed: 3.0, chaseSpeed: 6.5,
      minY: -530, maxY: -110,
      turnSpeed: 0.038,
      meshBuilder: this.buildHammerheadMesh.bind(this)
    });
    this.list.push(hammerhead);

    // 3. Giant Tiger Barracuda (Upper Waters Ambush Hunter)
    var barracuda = this.createPredatorDef({
      name: 'Giant Barracuda',
      type: 'barracuda',
      x: 400, y: -65, z: -450,
      detectRadius: 280, loseRadius: 440,
      cruiseSpeed: 3.5, chaseSpeed: 7.4,
      minY: -160, maxY: 65,
      turnSpeed: 0.045,
      meshBuilder: this.buildBarracudaMesh.bind(this)
    });
    this.list.push(barracuda);

    this.mesh = white.mesh;
    this.reset();
  },

  createPredatorDef: function (cfg) {
    var meshData = cfg.meshBuilder();
    meshData.group.position.set(cfg.x, cfg.y, cfg.z);
    CF.Render3D.scene.add(meshData.group);

    return {
      name: cfg.name,
      type: cfg.type,
      x: cfg.x,
      y: cfg.y,
      z: cfg.z,
      startX: cfg.x,
      startY: cfg.y,
      startZ: cfg.z,
      yaw: Math.PI,
      pitch: 0,
      speed: cfg.cruiseSpeed,
      state: 'patrol',
      threat: 0,
      draining: false,
      wander: { x: cfg.x - 100, y: cfg.y, z: cfg.z - 100 },
      detectRadius: cfg.detectRadius,
      loseRadius: cfg.loseRadius,
      cruiseSpeed: cfg.cruiseSpeed,
      chaseSpeed: cfg.chaseSpeed,
      minY: cfg.minY,
      maxY: cfg.maxY,
      turnSpeed: cfg.turnSpeed,
      mesh: meshData.group,
      tailMesh: meshData.tail,
      eyeLight: meshData.eyeLight
    };
  },

  reset: function () {
    var C = CF.CONFIG;
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      p.x = p.startX;
      p.y = p.startY;
      p.z = p.startZ;
      p.yaw = Math.PI;
      p.pitch = 0;
      p.speed = p.cruiseSpeed;
      p.state = 'patrol';
      p.threat = 0;
      p.draining = false;
      p.wander = { x: p.startX - 80, y: p.startY, z: p.startZ - 80 };
      if (p.mesh) {
        p.mesh.position.set(p.x, p.y, p.z);
        p.mesh.rotation.set(0, p.yaw, 0);
      }
    }

    this.state = 'patrol';
    this.threat = 0;
    this.draining = false;
    if (this.list[0]) {
      this.x = this.list[0].x;
      this.y = this.list[0].y;
      this.z = this.list[0].z;
    }
  },

  // 1. Apex Great White Shark Mesh
  buildWhiteSharkMesh: function () {
    var group = new THREE.Group();

    var sharkGreyMat = new THREE.MeshLambertMaterial({ color: 0x33414a });
    var darkFinMat = new THREE.MeshLambertMaterial({ color: 0x242e35 });
    var whiteBellyMat = new THREE.MeshLambertMaterial({ color: 0xc9d8e2 });
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x080808 });
    var toothMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    var snoutGeom = new THREE.ConeGeometry(13.5, 26, 14);
    snoutGeom.rotateX(Math.PI / 2);
    snoutGeom.scale(0.85, 0.95, 1.0);
    var snout = new THREE.Mesh(snoutGeom, sharkGreyMat);
    snout.position.set(0, 0, 15);
    group.add(snout);

    var snoutBellyGeom = new THREE.ConeGeometry(11, 24, 10);
    snoutBellyGeom.rotateX(Math.PI / 2);
    snoutBellyGeom.scale(0.8, 0.45, 1.0);
    var snoutBelly = new THREE.Mesh(snoutBellyGeom, whiteBellyMat);
    snoutBelly.position.set(0, -4.5, 14);
    group.add(snoutBelly);

    var mouthGeom = new THREE.BoxGeometry(11, 4.5, 12);
    var mouthMat = new THREE.MeshBasicMaterial({ color: 0x1f0606 });
    var mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, -5.2, 11);
    group.add(mouth);

    for (var t = 0; t < 5; t++) {
      var toothGeom = new THREE.ConeGeometry(0.9, 2.4, 3);
      var toothL = new THREE.Mesh(toothGeom, toothMat);
      toothL.position.set(4.2 - t * 2.1, -4.8, 16.5);
      toothL.rotation.set(Math.PI, 0, 0);
      group.add(toothL);
    }

    var eyeGeom = new THREE.SphereGeometry(2.0, 8, 8);
    var leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(8.2, 3.2, 14);
    group.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(-8.2, 3.2, 14);
    group.add(rightEye);

    var torsoGeom = new THREE.CylinderGeometry(7, 14, 40, 16);
    torsoGeom.rotateX(Math.PI / 2);
    torsoGeom.scale(0.9, 1.2, 1.0);
    var torso = new THREE.Mesh(torsoGeom, sharkGreyMat);
    torso.position.set(0, 0, -8);
    group.add(torso);

    var torsoBellyGeom = new THREE.CylinderGeometry(5.5, 12, 38, 12);
    torsoBellyGeom.rotateX(Math.PI / 2);
    torsoBellyGeom.scale(0.8, 0.48, 1.0);
    var torsoBelly = new THREE.Mesh(torsoBellyGeom, whiteBellyMat);
    torsoBelly.position.set(0, -6.8, -7);
    group.add(torsoBelly);

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

    var dorsalGeom = new THREE.ConeGeometry(9.5, 32, 4);
    dorsalGeom.scale(0.18, 1, 1.5);
    var dorsal = new THREE.Mesh(dorsalGeom, darkFinMat);
    dorsal.position.set(0, 21, -6);
    dorsal.rotation.set(-0.75, 0, 0);
    group.add(dorsal);

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

    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -28);

    var stemGeom = new THREE.CylinderGeometry(3.2, 6.8, 22, 10);
    stemGeom.rotateX(Math.PI / 2);
    var stem = new THREE.Mesh(stemGeom, sharkGreyMat);
    stem.position.set(0, 0, -11);
    tailGroup.add(stem);

    var upperLobeGeom = new THREE.ConeGeometry(8, 28, 4);
    upperLobeGeom.scale(0.16, 1, 1.3);
    var upperLobe = new THREE.Mesh(upperLobeGeom, darkFinMat);
    upperLobe.position.set(0, 12, -26);
    upperLobe.rotation.set(-0.85, 0, 0);
    tailGroup.add(upperLobe);

    var lowerLobeGeom = new THREE.ConeGeometry(6, 18, 4);
    lowerLobeGeom.scale(0.16, 1, 1.3);
    var lowerLobe = new THREE.Mesh(lowerLobeGeom, darkFinMat);
    lowerLobe.position.set(0, -8, -24);
    lowerLobe.rotation.set(0.75, 0, 0);
    tailGroup.add(lowerLobe);

    group.add(tailGroup);

    var eyeLight = new THREE.PointLight(0xff3322, 0.9, 65);
    eyeLight.position.set(0, 5, 20);
    group.add(eyeLight);

    return { group: group, tail: tailGroup, eyeLight: eyeLight };
  },

  // 2. Great Hammerhead Shark Mesh
  buildHammerheadMesh: function () {
    var group = new THREE.Group();

    var bronzeGreyMat = new THREE.MeshLambertMaterial({ color: 0x3d4a45 });
    var darkBronzeMat = new THREE.MeshLambertMaterial({ color: 0x27332f });
    var creamBellyMat = new THREE.MeshLambertMaterial({ color: 0xedf2eb });
    var goldEyeMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    var darkPupilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

    // Wide T-Bar Hammer Head (Cephalofoil)
    var hammerBarGeom = new THREE.CylinderGeometry(4.2, 4.2, 38, 12);
    hammerBarGeom.rotateZ(Math.PI / 2);
    var hammerBar = new THREE.Mesh(hammerBarGeom, bronzeGreyMat);
    hammerBar.position.set(0, 0, 18);
    group.add(hammerBar);

    // Hammer underbelly
    var hammerBellyGeom = new THREE.CylinderGeometry(3.6, 3.6, 36, 10);
    hammerBellyGeom.rotateZ(Math.PI / 2);
    hammerBellyGeom.scale(1, 0.45, 1);
    var hammerBelly = new THREE.Mesh(hammerBellyGeom, creamBellyMat);
    hammerBelly.position.set(0, -2.2, 18);
    group.add(hammerBelly);

    // Lateral hammer rounded endcaps with sensory eyes
    for (var side = -1; side <= 1; side += 2) {
      var capGeom = new THREE.SphereGeometry(4.2, 10, 8);
      capGeom.scale(0.7, 1, 1.3);
      var cap = new THREE.Mesh(capGeom, bronzeGreyMat);
      cap.position.set(side * 19, 0, 18);
      group.add(cap);

      var eye = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), goldEyeMat);
      eye.position.set(side * 20.8, 0, 18);
      var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), darkPupilMat);
      pupil.position.set(side * 0.9, 0, 0.6);
      eye.add(pupil);
      group.add(eye);
    }

    // Torso (Lean muscular bronze-slate body)
    var torsoGeom = new THREE.CylinderGeometry(6.5, 13, 42, 14);
    torsoGeom.rotateX(Math.PI / 2);
    torsoGeom.scale(0.85, 1.15, 1.0);
    var torso = new THREE.Mesh(torsoGeom, bronzeGreyMat);
    torso.position.set(0, 0, -6);
    group.add(torso);

    // Tall Curved Sickle Dorsal Fin
    var sickleGeom = new THREE.ConeGeometry(9.0, 38, 4);
    sickleGeom.scale(0.16, 1, 1.4);
    var sickleDorsal = new THREE.Mesh(sickleGeom, darkBronzeMat);
    sickleDorsal.position.set(0, 24, -4);
    sickleDorsal.rotation.set(-0.82, 0, 0);
    group.add(sickleDorsal);

    // Pectorals
    var pecGeom = new THREE.ConeGeometry(9, 28, 4);
    pecGeom.scale(0.16, 1, 1.3);
    var leftPec = new THREE.Mesh(pecGeom, darkBronzeMat);
    leftPec.position.set(16, -3, 6);
    leftPec.rotation.set(0.4, 0, -1.1);
    group.add(leftPec);

    var rightPec = new THREE.Mesh(pecGeom, darkBronzeMat);
    rightPec.position.set(-16, -3, 6);
    rightPec.rotation.set(0.4, 0, 1.1);
    group.add(rightPec);

    // Articulated Hammerhead Tail
    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -27);

    var stemGeom = new THREE.CylinderGeometry(2.8, 6.5, 22, 10);
    stemGeom.rotateX(Math.PI / 2);
    var stem = new THREE.Mesh(stemGeom, bronzeGreyMat);
    stem.position.set(0, 0, -11);
    tailGroup.add(stem);

    var upperLobeGeom = new THREE.ConeGeometry(7.5, 30, 4);
    upperLobeGeom.scale(0.16, 1, 1.3);
    var upperLobe = new THREE.Mesh(upperLobeGeom, darkBronzeMat);
    upperLobe.position.set(0, 14, -26);
    upperLobe.rotation.set(-0.9, 0, 0);
    tailGroup.add(upperLobe);

    var lowerLobeGeom = new THREE.ConeGeometry(5.5, 16, 4);
    lowerLobeGeom.scale(0.16, 1, 1.3);
    var lowerLobe = new THREE.Mesh(lowerLobeGeom, darkBronzeMat);
    lowerLobe.position.set(0, -7, -24);
    lowerLobe.rotation.set(0.72, 0, 0);
    tailGroup.add(lowerLobe);

    group.add(tailGroup);

    var eyeLight = new THREE.PointLight(0xffcc00, 0.9, 70);
    eyeLight.position.set(0, 3, 22);
    group.add(eyeLight);

    return { group: group, tail: tailGroup, eyeLight: eyeLight };
  },

  // 3. Giant Tiger Barracuda Mesh
  buildBarracudaMesh: function () {
    var group = new THREE.Group();

    var silverMat = new THREE.MeshLambertMaterial({ color: 0x6e9cb5 });
    var darkStripeMat = new THREE.MeshBasicMaterial({ color: 0x182c38 });
    var paleBellyMat = new THREE.MeshLambertMaterial({ color: 0xf0f7fb });
    var fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var amberEyeMat = new THREE.MeshBasicMaterial({ color: 0xffa200 });

    // Sleek, arrow-like elongated fuselage
    var torsoGeom = new THREE.CylinderGeometry(4.0, 7.5, 52, 14);
    torsoGeom.rotateX(Math.PI / 2);
    torsoGeom.scale(0.68, 0.88, 1.0);
    var torso = new THREE.Mesh(torsoGeom, silverMat);
    torso.position.set(0, 0, -6);
    group.add(torso);

    var bellyGeom = new THREE.CylinderGeometry(3.2, 6.2, 50, 10);
    bellyGeom.rotateX(Math.PI / 2);
    bellyGeom.scale(0.55, 0.4, 1.0);
    var belly = new THREE.Mesh(bellyGeom, paleBellyMat);
    belly.position.set(0, -4.2, -6);
    group.add(belly);

    // 7 Tiger Stripes along silver flank
    for (var s = 0; s < 7; s++) {
      var stripeGeom = new THREE.TorusGeometry(6.2 - s * 0.3, 0.55, 4, 14, Math.PI);
      var stripe = new THREE.Mesh(stripeGeom, darkStripeMat);
      stripe.scale.set(0.65, 0.85, 1);
      stripe.position.set(0, 0, 10 - s * 5.5);
      stripe.rotation.set(0, 0, Math.PI / 2);
      group.add(stripe);
    }

    // Needle Pike Snout & Undershot Jaw
    var snoutGeom = new THREE.ConeGeometry(6.2, 30, 10);
    snoutGeom.rotateX(Math.PI / 2);
    snoutGeom.scale(0.65, 0.72, 1.0);
    var snout = new THREE.Mesh(snoutGeom, silverMat);
    snout.position.set(0, 0, 22);
    group.add(snout);

    // Protruding lower razor jaw
    var lowerJawGeom = new THREE.ConeGeometry(5.0, 32, 8);
    lowerJawGeom.rotateX(Math.PI / 2);
    lowerJawGeom.scale(0.58, 0.45, 1.0);
    var lowerJaw = new THREE.Mesh(lowerJawGeom, silverMat);
    lowerJaw.position.set(0, -2.4, 23);
    group.add(lowerJaw);

    // Glistening needle fangs
    for (var f = 0; f < 6; f++) {
      var fangGeom = new THREE.ConeGeometry(0.6, 2.2, 3);
      var fang = new THREE.Mesh(fangGeom, fangMat);
      fang.position.set(2.4 - f * 0.95, -1.2, 28 + (f % 2) * 2);
      fang.rotation.set(Math.PI, 0, 0);
      group.add(fang);
    }

    // Forward Amber Predator Eyes
    var leftEye = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), amberEyeMat);
    leftEye.position.set(4.2, 2.0, 18);
    group.add(leftEye);

    var rightEye = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), amberEyeMat);
    rightEye.position.set(-4.2, 2.0, 18);
    group.add(rightEye);

    // Rearward dorsal and anal fin
    var dorsalGeom = new THREE.ConeGeometry(4.5, 16, 4);
    dorsalGeom.scale(0.15, 1, 1.4);
    var dorsal = new THREE.Mesh(dorsalGeom, silverMat);
    dorsal.position.set(0, 9.5, -22);
    dorsal.rotation.set(-0.8, 0, 0);
    group.add(dorsal);

    // Articulated Barracuda Forked V-Tail
    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -32);

    var vTailGeom = new THREE.ConeGeometry(9.0, 22, 4);
    vTailGeom.scale(0.14, 1, 1.4);
    vTailGeom.rotateX(Math.PI / 2);
    var vTail = new THREE.Mesh(vTailGeom, darkStripeMat);
    vTail.position.set(0, 0, -12);
    tailGroup.add(vTail);

    group.add(tailGroup);

    var eyeLight = new THREE.PointLight(0x00f5d4, 0.85, 60);
    eyeLight.position.set(0, 2, 26);
    group.add(eyeLight);

    return { group: group, tail: tailGroup, eyeLight: eyeLight };
  },

  update: function (t, dt) {
    var C = CF.CONFIG;
    var p = CF.Player;

    var closestPred = null;
    var closestDist = 999999;
    var maxThreat = 0;
    var anyDraining = false;

    // Update each predator independently
    for (var i = 0; i < this.list.length; i++) {
      var pred = this.list[i];
      var distToPlayer = CF.dist3D(pred.x, pred.y, pred.z, p.x, p.y, p.z);

      if (distToPlayer < closestDist) {
        closestDist = distToPlayer;
        closestPred = pred;
      }

      // State transition
      if (distToPlayer < pred.detectRadius) {
        pred.state = 'chase';
      } else if (distToPlayer > pred.loseRadius) {
        pred.state = 'patrol';
      }

      var target = null;
      var targetSpeed = pred.cruiseSpeed;

      if (pred.state === 'chase') {
        targetSpeed = pred.chaseSpeed;
        target = { x: p.x, y: p.y, z: p.z };
      } else {
        targetSpeed = pred.cruiseSpeed;
        if (CF.dist3D(pred.x, pred.y, pred.z, pred.wander.x, pred.wander.y, pred.wander.z) < 90) {
          pred.wander = {
            x: CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200),
            y: CF.rand(pred.minY, pred.maxY),
            z: CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200)
          };
        }
        target = pred.wander;
      }

      // 3D Steering
      var dx = target.x - pred.x;
      var dy = target.y - pred.y;
      var dz = target.z - pred.z;
      var horiz = Math.hypot(dx, dz) || 1;

      var desiredYaw = Math.atan2(dx, dz);
      var desiredPitch = Math.atan2(dy, horiz);

      pred.yaw = CF.lerpAngle(pred.yaw, desiredYaw, pred.turnSpeed);
      pred.pitch = CF.lerp(pred.pitch, desiredPitch, pred.turnSpeed * 0.9);
      pred.speed = CF.lerp(pred.speed, targetSpeed, 0.045);

      var fwdX = Math.sin(pred.yaw) * Math.cos(pred.pitch);
      var fwdY = Math.sin(pred.pitch);
      var fwdZ = Math.cos(pred.yaw) * Math.cos(pred.pitch);

      pred.x += fwdX * pred.speed;
      pred.y += fwdY * pred.speed;
      pred.z += fwdZ * pred.speed;

      pred.x = CF.clamp(pred.x, -C.WORLD_HALF + 50, C.WORLD_HALF - 50);
      pred.z = CF.clamp(pred.z, -C.WORLD_HALF + 50, C.WORLD_HALF - 50);
      var floorY = CF.Render3D.getTerrainHeight(pred.x, pred.z) + 24;
      pred.y = CF.clamp(pred.y, Math.max(floorY, pred.minY), Math.min(C.WORLD_SURFACE - 12, pred.maxY));

      // Individual threat and life drain
      pred.threat = CF.clamp(1 - distToPlayer / C.SHARK_DANGER, 0, 1);
      if (pred.threat > maxThreat) maxThreat = pred.threat;

      pred.draining = distToPlayer < C.SHARK_DRAIN_RADIUS;
      if (pred.draining) anyDraining = true;

      // Mesh animation
      if (pred.mesh) {
        pred.mesh.position.set(pred.x, pred.y, pred.z);
        pred.mesh.rotation.set(-pred.pitch, pred.yaw, 0, 'YXZ');

        var isChasing = pred.state === 'chase';
        if (pred.eyeLight) {
          pred.eyeLight.intensity = isChasing ? 1.8 : 0.45;
        }

        if (pred.tailMesh) {
          var freq = isChasing ? 0.024 : 0.012;
          var amp = isChasing ? 0.28 : 0.14;
          pred.tailMesh.rotation.y = Math.sin(t * freq + i * 1.5) * amp;
        }
      }
    }

    // Predator attack: depletes lifeline by 10% max per bite with invulnerability buffer
    if (anyDraining) {
      if (p.takeDamage) {
        p.takeDamage(10);
      }
    }
    // Lifeline is NOT replenished automatically - user must complete game with remaining lifeline!

    // Update global state aliases for HUD & Audio
    this.threat = maxThreat;
    this.draining = anyDraining;
    if (closestPred) {
      this.x = closestPred.x;
      this.y = closestPred.y;
      this.z = closestPred.z;
      this.state = closestPred.state;
    }
  }
};
