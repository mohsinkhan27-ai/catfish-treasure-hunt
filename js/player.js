window.CF = window.CF || {};

CF.Player = {
  x: 0,
  y: -100,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: 0,
  roll: 0,
  speed: 0,
  health: 100,
  mesh: null,
  tailMesh: null,
  leftFin: null,
  rightFin: null,
  headlight: null,

  reset: function () {
    var C = CF.CONFIG;
    this.x = 0;
    this.y = -100;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.speed = 0;
    this.health = C.HEALTH_MAX;
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(0, 0, 0);
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
    var visualGroup = new THREE.Group();
    group.add(visualGroup);
    this.visualMesh = visualGroup;

    var orangeMat = new THREE.MeshLambertMaterial({ color: 0xf58a27 });
    var darkOrangeMat = new THREE.MeshLambertMaterial({ color: 0xc86014 });
    var creamMat = new THREE.MeshLambertMaterial({ color: 0xffe8c9 });
    var pinkMat = new THREE.MeshLambertMaterial({ color: 0xff99aa });
    var whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var darkMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 1. Head (Sculpted Cat Head)
    var headGeom = new THREE.SphereGeometry(12, 20, 16);
    headGeom.scale(1.15, 1.05, 1.15);
    var head = new THREE.Mesh(headGeom, orangeMat);
    head.position.set(0, 0, 8);
    visualGroup.add(head);

    // Muzzle / Snout
    var muzzleGeom = new THREE.SphereGeometry(5.5, 14, 12);
    muzzleGeom.scale(1.2, 0.75, 0.9);
    var muzzle = new THREE.Mesh(muzzleGeom, creamMat);
    muzzle.position.set(0, -3.2, 17.5);
    visualGroup.add(muzzle);

    // Cute pink nose
    var noseGeom = new THREE.ConeGeometry(1.6, 2.2, 3);
    var nose = new THREE.Mesh(noseGeom, pinkMat);
    nose.position.set(0, -1.8, 22.8);
    nose.rotation.set(Math.PI / 2, 0, Math.PI);
    visualGroup.add(nose);

    // 2. 3D Cat Ears
    var earGeom = new THREE.ConeGeometry(4.5, 9, 5);
    earGeom.scale(0.85, 1, 0.55);

    var leftEar = new THREE.Mesh(earGeom, orangeMat);
    leftEar.position.set(6.8, 9.8, 8);
    leftEar.rotation.set(-0.25, 0, -0.32);
    visualGroup.add(leftEar);

    var leftEarInner = new THREE.Mesh(earGeom, pinkMat);
    leftEarInner.position.set(6.6, 9.5, 8.8);
    leftEarInner.rotation.set(-0.25, 0, -0.32);
    leftEarInner.scale.set(0.65, 0.75, 0.4);
    visualGroup.add(leftEarInner);

    var rightEar = new THREE.Mesh(earGeom, orangeMat);
    rightEar.position.set(-6.8, 9.8, 8);
    rightEar.rotation.set(-0.25, 0, 0.32);
    visualGroup.add(rightEar);

    var rightEarInner = new THREE.Mesh(earGeom, pinkMat);
    rightEarInner.position.set(-6.6, 9.5, 8.8);
    rightEarInner.rotation.set(-0.25, 0, 0.32);
    rightEarInner.scale.set(0.65, 0.75, 0.4);
    visualGroup.add(rightEarInner);

    // 3. 3D Expressive Cat Eyes
    var eyeWhiteGeom = new THREE.SphereGeometry(3.2, 12, 10);
    var pupilGeom = new THREE.SphereGeometry(1.6, 8, 8);
    var shineGeom = new THREE.SphereGeometry(0.7, 6, 6);

    // Left eye
    var leftEye = new THREE.Mesh(eyeWhiteGeom, whiteMat);
    leftEye.position.set(7.5, 3.2, 15.5);
    var leftPupil = new THREE.Mesh(pupilGeom, darkMat);
    leftPupil.position.set(1.1, 0, 2.0);
    var leftShine = new THREE.Mesh(shineGeom, whiteMat);
    leftShine.position.set(1.4, 0.8, 2.4);
    leftEye.add(leftPupil);
    leftEye.add(leftShine);
    visualGroup.add(leftEye);

    // Right eye
    var rightEye = new THREE.Mesh(eyeWhiteGeom, whiteMat);
    rightEye.position.set(-7.5, 3.2, 15.5);
    var rightPupil = new THREE.Mesh(pupilGeom, darkMat);
    rightPupil.position.set(-1.1, 0, 2.0);
    var rightShine = new THREE.Mesh(shineGeom, whiteMat);
    rightShine.position.set(-1.4, 0.8, 2.4);
    rightEye.add(rightPupil);
    rightEye.add(rightShine);
    visualGroup.add(rightEye);

    // 4. 3D Long Whiskers
    var whiskerMat = new THREE.LineBasicMaterial({ color: 0x3d1f08, linewidth: 2 });
    for (var w = 0; w < 3; w++) {
      var yOff = (w - 1) * 2.8;
      var wLineL = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(15, yOff, -6)
        ]),
        whiskerMat
      );
      wLineL.position.set(7.5, -2.5, 17);
      visualGroup.add(wLineL);

      var wLineR = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-15, yOff, -6)
        ]),
        whiskerMat
      );
      wLineR.position.set(-7.5, -2.5, 17);
      visualGroup.add(wLineR);
    }

    // 5. Volumetric 3D Fish Body Fuselage (Lofted Torso)
    var bodyGeom = new THREE.CylinderGeometry(5.5, 12.5, 26, 16);
    bodyGeom.rotateX(Math.PI / 2);
    bodyGeom.scale(1.0, 1.1, 1.0);
    var body = new THREE.Mesh(bodyGeom, orangeMat);
    body.position.set(0, 0, -5);
    visualGroup.add(body);

    // Cream belly contour
    var bellyGeom = new THREE.CylinderGeometry(4.2, 10, 24, 12);
    bellyGeom.rotateX(Math.PI / 2);
    bellyGeom.scale(0.85, 0.5, 1.0);
    var belly = new THREE.Mesh(bellyGeom, creamMat);
    belly.position.set(0, -6.0, -4);
    visualGroup.add(belly);

    // Tabby Stripes along spine
    for (var s = 0; s < 3; s++) {
      var stripeGeom = new THREE.TorusGeometry(10 - s * 1.5, 1.2, 6, 16, Math.PI);
      var stripe = new THREE.Mesh(stripeGeom, darkOrangeMat);
      stripe.position.set(0, 0, 2 - s * 7);
      stripe.rotation.set(0, 0, Math.PI / 2);
      visualGroup.add(stripe);
    }

    // 6. Volumetric Dorsal Fin on Back
    var dorsalGeom = new THREE.ConeGeometry(5.5, 18, 4);
    dorsalGeom.scale(0.2, 1, 1.4);
    var dorsal = new THREE.Mesh(dorsalGeom, darkOrangeMat);
    dorsal.position.set(0, 12, -7);
    dorsal.rotation.set(-0.7, 0, 0);
    visualGroup.add(dorsal);

    // 7. Volumetric Pectoral Hydrofoil Fins
    var finGeom = new THREE.ConeGeometry(7, 18, 4);
    finGeom.scale(0.18, 1, 1.2);

    this.leftFin = new THREE.Mesh(finGeom, orangeMat);
    this.leftFin.position.set(11, -3, 3);
    this.leftFin.rotation.set(0.5, 0, -1.1);
    visualGroup.add(this.leftFin);

    this.rightFin = new THREE.Mesh(finGeom, orangeMat);
    this.rightFin.position.set(-11, -3, 3);
    this.rightFin.rotation.set(0.5, 0, 1.1);
    visualGroup.add(this.rightFin);

    // 8. Articulated Tail Peduncle & Caudal Tail Fin
    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -18);

    // Tail stem
    var stemGeom = new THREE.CylinderGeometry(2.5, 5.0, 14, 10);
    stemGeom.rotateX(Math.PI / 2);
    var stem = new THREE.Mesh(stemGeom, orangeMat);
    stem.position.set(0, 0, -7);
    tailGroup.add(stem);

    // Flared double-lobed tail fin
    var tailFinGeom = new THREE.ConeGeometry(10, 22, 4);
    tailFinGeom.scale(0.18, 1, 1.4);
    var tailFin = new THREE.Mesh(tailFinGeom, darkOrangeMat);
    tailFin.rotation.set(Math.PI / 2, 0, 0);
    tailFin.position.set(0, 0, -16);
    tailGroup.add(tailFin);

    visualGroup.add(tailGroup);
    this.tailMesh = tailGroup;

    // 9. Powerful Underwater Exploration Headlight
    var spot = new THREE.SpotLight(0xaef6ff, 3.5, 420, Math.PI / 3.5, 0.4, 1);
    spot.position.set(0, 2, 22);
    var targetObj = new THREE.Object3D();
    targetObj.position.set(0, 2, 200);
    group.add(spot);
    group.add(targetObj);
    spot.target = targetObj;
    this.headlight = spot;

    // Ambient glow around player
    var playerGlow = new THREE.PointLight(0xffe6a3, 1.5, 60);
    playerGlow.position.set(0, 5, 4);
    group.add(playerGlow);

    group.position.set(this.x, this.y, this.z);
    CF.Render3D.scene.add(group);
    this.mesh = group;
  },

  setFirstPerson: function (isFirst) {
    if (this.visualMesh) {
      this.visualMesh.visible = !isFirst;
    }
  },

  update: function () {
    var C = CF.CONFIG;
    var a = CF.Input.axis();

    // 1. Yaw Steering (A / D or Left / Right Arrows)
    this.yaw -= a.x * C.PLAYER_TURN_SPEED;

    // 2. Direct Vertical 3D Swimming (Space = UP toward sun, Shift/C/Q = DOWN toward reef)
    if (a.z > 0) {
      // Ascending
      this.vy = CF.lerp(this.vy, C.PLAYER_SWIM_UP, 0.18);
      this.pitch = CF.lerp(this.pitch, 0.42, 0.12);
    } else if (a.z < 0) {
      // Diving
      this.vy = CF.lerp(this.vy, -C.PLAYER_SWIM_DOWN, 0.18);
      this.pitch = CF.lerp(this.pitch, -0.42, 0.12);
    } else {
      // Natural buoyancy damping
      this.vy *= 0.91;
      this.pitch = CF.lerp(this.pitch, 0, 0.08);
    }

    // 3. Roll Banking into Turns
    this.roll = CF.lerp(this.roll, -a.x * 0.38, 0.1);

    // 4. Forward / Backward Propulsion (W / S or Up / Down Arrows)
    if (a.y !== 0) {
      this.speed = Math.min(C.PLAYER_MAX_SPEED, this.speed + a.y * C.PLAYER_ACCEL);
    }
    this.speed *= C.PLAYER_DRAG;

    // 5. Compute 3D Velocity & Movement
    var fwdX = Math.sin(this.yaw) * Math.cos(this.pitch);
    var fwdY = Math.sin(this.pitch);
    var fwdZ = Math.cos(this.yaw) * Math.cos(this.pitch);

    this.vx = fwdX * this.speed;
    this.vz = fwdZ * this.speed;

    this.x += this.vx;
    this.y += this.vy + (fwdY * this.speed * 0.5);
    this.z += this.vz;

    // 6. World Bounds Check
    this.x = CF.clamp(this.x, -C.WORLD_HALF + 40, C.WORLD_HALF - 40);
    this.z = CF.clamp(this.z, -C.WORLD_HALF + 40, C.WORLD_HALF - 40);

    var floorY = CF.Render3D.getTerrainHeight(this.x, this.z) + 16;
    this.y = CF.clamp(this.y, floorY, C.WORLD_SURFACE - 10);

    // 7. Update Mesh Transform & Smooth Swimming Wag
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(-this.pitch, this.yaw, this.roll, 'YXZ');

      var t = CF.Render3D.clock || performance.now();
      var isMoving = Math.abs(this.speed) > 0.2 || Math.abs(this.vy) > 0.2;
      var wagFreq = isMoving ? 0.018 : 0.008;
      var wagAmp = isMoving ? 0.22 : 0.08;

      if (this.tailMesh) {
        this.tailMesh.rotation.y = Math.sin(t * wagFreq) * wagAmp;
      }

      if (this.leftFin && this.rightFin) {
        this.leftFin.rotation.z = -1.1 + Math.sin(t * wagFreq * 0.8) * 0.22;
        this.rightFin.rotation.z = 1.1 - Math.sin(t * wagFreq * 0.8) * 0.22;
      }
    }
  }
};
