var CF = window.CF = window.CF || {};

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
  visualMesh: null,
  tailMesh: null,
  leftFin: null,
  rightFin: null,
  headlight: null,

  // Bubble Blaster Gun Weapon
  hasBubbleGun: false,
  shootCooldown: 0,
  bubbleProjectiles: [],
  bubbleGunMesh: null,
  lastCannonSide: false,

  // Kid-Friendly Dress-Up Customization
  unlocked: {
    bubblegun: false,
    pirate: false,
    scuba: false,
    crown: false,
    starfish: false,
    rainbow: false,
    sparkle: false
  },
  activeHat: null,    // 'pirate' | 'scuba' | 'crown' | 'starfish' | null
  activeTrail: null,  // 'rainbow' | 'sparkle' | null
  hatMeshes: {},
  trailParticles: [],
  snorkelTimer: 0,
  rainbowHueIndex: 0,

  // Arcade Thrills
  boostTimer: 0,
  breachState: 'underwater', // 'underwater' | 'airborne' | 'cooldown'
  breachCooldown: 0,
  isBreaching: false,
  breachFlip: 0,

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
    this.boostTimer = 0;
    this.breachState = 'underwater';
    this.breachCooldown = 0;
    this.isBreaching = false;
    this.breachFlip = 0;
    this.snorkelTimer = 0;
    this.hasBubbleGun = false;
    this.shootCooldown = 0;
    this.clearBubbles();

    if (this.bubbleGunMesh) {
      this.bubbleGunMesh.visible = false;
    }

    var fireBtn = document.getElementById('touchFireBtn');
    if (fireBtn) {
      fireBtn.classList.remove('unlocked-glow');
    }
    var weaponChip = document.getElementById('weaponChip');
    if (weaponChip) {
      weaponChip.style.display = 'none';
    }

    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(0, 0, 0);
    }
  },

  init: function () {
    this.reset();
    if (!this.mesh) {
      this.buildMesh();
      this.buildAccessories();
      this.buildBubbleGunMesh();
    }
  },

  equipWeapon: function (enable) {
    if (enable === undefined) {
      this.hasBubbleGun = !this.hasBubbleGun;
    } else {
      this.hasBubbleGun = !!enable;
    }
    if (this.bubbleGunMesh) {
      this.bubbleGunMesh.visible = this.hasBubbleGun;
    }
    var fireBtn = document.getElementById('touchFireBtn');
    if (fireBtn) {
      if (this.hasBubbleGun) fireBtn.classList.add('unlocked-glow');
      else fireBtn.classList.remove('unlocked-glow');
    }
    var weaponChip = document.getElementById('weaponChip');
    if (weaponChip) {
      weaponChip.style.display = this.hasBubbleGun ? 'flex' : 'none';
    }
    if (CF.Render3D && CF.Render3D.triggerHeroCam) {
      CF.Render3D.triggerHeroCam(3.0);
    }
    if (CF.HUD && CF.HUD.updateAvatar) {
      CF.HUD.updateAvatar();
    }
  },

  equipHat: function (id) {
    if (id === 'bubblegun') {
      this.equipWeapon();
      return;
    }
    if (this.activeHat === id) {
      this.activeHat = null;
    } else {
      this.activeHat = id;
    }
    for (var key in this.hatMeshes) {
      if (this.hatMeshes[key]) {
        this.hatMeshes[key].visible = (key === this.activeHat);
      }
    }
    if (CF.Render3D && CF.Render3D.triggerHeroCam) {
      CF.Render3D.triggerHeroCam(3.0);
    }
    if (CF.HUD && CF.HUD.updateAvatar) {
      CF.HUD.updateAvatar();
    }
  },

  equipTrail: function (id) {
    if (this.activeTrail === id) {
      this.activeTrail = null;
    } else {
      this.activeTrail = id;
    }
    if (CF.Render3D && CF.Render3D.triggerHeroCam) {
      CF.Render3D.triggerHeroCam(2.5);
    }
    if (CF.HUD && CF.HUD.updateAvatar) {
      CF.HUD.updateAvatar();
    }
  },

  unlock: function (id) {
    this.unlocked[id] = true;
    if (id === 'bubblegun') {
      this.equipWeapon(true);
    } else if (id === 'rainbow' || id === 'sparkle') {
      this.equipTrail(id);
    } else {
      this.equipHat(id);
    }
    if (CF.Render3D && CF.Render3D.triggerHeroCam) {
      CF.Render3D.triggerHeroCam(3.5);
    }
    if (CF.HUD && CF.HUD.updateAvatar) {
      CF.HUD.updateAvatar();
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

    // 5. Volumetric 3D Fish Body Fuselage
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

    var stemGeom = new THREE.CylinderGeometry(2.5, 5.0, 14, 10);
    stemGeom.rotateX(Math.PI / 2);
    var stem = new THREE.Mesh(stemGeom, orangeMat);
    stem.position.set(0, 0, -7);
    tailGroup.add(stem);

    var tailFinGeom = new THREE.ConeGeometry(10, 22, 4);
    tailFinGeom.scale(0.18, 1, 1.4);
    var tailFin = new THREE.Mesh(tailFinGeom, darkOrangeMat);
    tailFin.rotation.set(Math.PI / 2, 0, 0);
    tailFin.position.set(0, 0, -16);
    tailGroup.add(tailFin);

    visualGroup.add(tailGroup);
    this.tailMesh = tailGroup;

    // 9. Exploration Headlight
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

  buildAccessories: function () {
    var v = this.visualMesh;
    if (!v) return;

    var blackMat = new THREE.MeshLambertMaterial({ color: 0x181818 });
    var goldMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x443300 });
    var whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var darkMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // 1. Pirate Hat & Eyepatch (Enlarged and bold for high visibility!)
    var pirateGroup = new THREE.Group();
    // Eyepatch over right eye
    var patchGeom = new THREE.CylinderGeometry(3.2, 3.2, 0.7, 12);
    patchGeom.rotateX(Math.PI / 2);
    var patch = new THREE.Mesh(patchGeom, blackMat);
    patch.position.set(-7.7, 3.2, 16.8);
    patch.rotation.set(0.12, -0.3, 0);
    pirateGroup.add(patch);

    // Eyepatch strap
    var strapGeom = new THREE.TorusGeometry(12.5, 0.5, 4, 20);
    strapGeom.rotateY(Math.PI / 2);
    var strap = new THREE.Mesh(strapGeom, blackMat);
    strap.position.set(0, 3.2, 8);
    strap.rotation.set(-0.2, 0, 0.22);
    pirateGroup.add(strap);

    // Pirate Bicorne Hat (Wide prominent silhouette visible from rear and sides!)
    var hatCrownGeom = new THREE.CylinderGeometry(10.5, 9.0, 6.5, 14);
    hatCrownGeom.scale(1.4, 0.85, 1.05);
    var hatCrown = new THREE.Mesh(hatCrownGeom, blackMat);
    hatCrown.position.set(0, 13.5, 6.5);
    hatCrown.rotation.set(-0.15, 0, 0);
    pirateGroup.add(hatCrown);

    // Flared golden brim
    var brimGeom = new THREE.TorusGeometry(10.5, 2.8, 6, 18, Math.PI * 1.35);
    var brim = new THREE.Mesh(brimGeom, goldMat);
    brim.position.set(0, 14.8, 6.5);
    brim.rotation.set(Math.PI / 2, 0, 0);
    pirateGroup.add(brim);

    // Skull and crossbones emblem
    var skullGeom = new THREE.SphereGeometry(1.6, 8, 8);
    var skull = new THREE.Mesh(skullGeom, whiteMat);
    skull.position.set(0, 16.2, 14.2);
    pirateGroup.add(skull);
    var bone1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 0.6), whiteMat);
    bone1.position.set(0, 15.2, 14.1);
    bone1.rotation.z = 0.78;
    pirateGroup.add(bone1);
    var bone2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 0.6), whiteMat);
    bone2.position.set(0, 15.2, 14.1);
    bone2.rotation.z = -0.78;
    pirateGroup.add(bone2);

    pirateGroup.visible = false;
    v.add(pirateGroup);
    this.hatMeshes.pirate = pirateGroup;

    // 2. Scuba Diving Mask & Snorkel
    var scubaGroup = new THREE.Group();
    var cyanRubberMat = new THREE.MeshLambertMaterial({ color: 0x00d4eb });
    var glassMat = new THREE.MeshLambertMaterial({
      color: 0xaff6ff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    var yellowMat = new THREE.MeshLambertMaterial({ color: 0xffd000 });
    var neonOrangeMat = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    // Goggles Frame covering both eyes
    var maskRingGeom = new THREE.TorusGeometry(7.8, 1.4, 6, 18);
    maskRingGeom.scale(1.7, 0.75, 1.0);
    var maskRing = new THREE.Mesh(maskRingGeom, cyanRubberMat);
    maskRing.position.set(0, 3.2, 16.4);
    scubaGroup.add(maskRing);

    // Glass Visor
    var visorGeom = new THREE.PlaneGeometry(19, 8.5);
    var visor = new THREE.Mesh(visorGeom, glassMat);
    visor.position.set(0, 3.2, 17.0);
    scubaGroup.add(visor);

    // Tall Snorkel Breathing Tube (reaches high above head!)
    var snorkelTubeGeom = new THREE.CylinderGeometry(1.1, 1.1, 22, 8);
    var snorkelTube = new THREE.Mesh(snorkelTubeGeom, yellowMat);
    snorkelTube.position.set(10.5, 14, 6.0);
    snorkelTube.rotation.set(-0.25, 0, -0.2);
    scubaGroup.add(snorkelTube);

    // Snorkel high-vis orange safety tip
    var tipGeom = new THREE.CylinderGeometry(1.4, 1.4, 3.5, 8);
    var tip = new THREE.Mesh(tipGeom, neonOrangeMat);
    tip.position.set(12.8, 24.5, 3.8);
    tip.rotation.set(-0.25, 0, -0.2);
    scubaGroup.add(tip);

    scubaGroup.visible = false;
    v.add(scubaGroup);
    this.hatMeshes.scuba = scubaGroup;

    // 3. Royal Golden Crown (Tall, brilliant, and unmistakable from all camera angles!)
    var crownGroup = new THREE.Group();
    var rubyMat = new THREE.MeshBasicMaterial({ color: 0xff1144 });
    var sapphireMat = new THREE.MeshBasicMaterial({ color: 0x00a2ff });

    // Wide Gold Crown Circlet
    var circletGeom = new THREE.CylinderGeometry(7.4, 6.8, 4.2, 16, 1, true);
    var circlet = new THREE.Mesh(circletGeom, goldMat);
    circlet.position.set(0, 11.5, 7.0);
    crownGroup.add(circlet);

    // 5 Soaring Golden Peaks with Rubies
    var peakGeom = new THREE.ConeGeometry(1.8, 6.5, 4);
    var rubyGeom = new THREE.SphereGeometry(1.0, 8, 8);
    for (var p = 0; p < 5; p++) {
      var pAngle = (p / 5) * Math.PI * 2;
      var px = Math.sin(pAngle) * 7.0;
      var pz = Math.cos(pAngle) * 7.0;

      var peak = new THREE.Mesh(peakGeom, goldMat);
      peak.position.set(px, 15.5, 7.0 + pz);
      crownGroup.add(peak);

      var ruby = new THREE.Mesh(rubyGeom, rubyMat);
      ruby.position.set(px, 19.0, 7.0 + pz);
      crownGroup.add(ruby);
    }

    // Sapphire Gem in Center
    var saphGeom = new THREE.BoxGeometry(2.4, 2.4, 1.2);
    var saph = new THREE.Mesh(saphGeom, sapphireMat);
    saph.position.set(0, 11.8, 14.2);
    crownGroup.add(saph);

    // Royal light radiance
    var crownGlow = new THREE.PointLight(0xffdf55, 1.8, 50);
    crownGlow.position.set(0, 17, 7);
    crownGroup.add(crownGlow);

    crownGroup.visible = false;
    v.add(crownGroup);
    this.hatMeshes.crown = crownGroup;

    // 4. Cute Glowing Starfish Hat (Large sprawling starfish with bioluminescent glow!)
    var starfishGroup = new THREE.Group();
    var starfishMat = new THREE.MeshLambertMaterial({ color: 0xff2888, emissive: 0x770033 });

    var starCenterGeom = new THREE.SphereGeometry(4.6, 12, 10);
    starCenterGeom.scale(1, 0.45, 1);
    var starCenter = new THREE.Mesh(starCenterGeom, starfishMat);
    starCenter.position.set(0, 11.8, 7.5);
    starfishGroup.add(starCenter);

    var starArmGeom = new THREE.ConeGeometry(2.4, 8.2, 6);
    starArmGeom.translate(0, 4.1, 0);
    for (var a = 0; a < 5; a++) {
      var armAng = (a / 5) * Math.PI * 2 + 0.3;
      var arm = new THREE.Mesh(starArmGeom, starfishMat);
      arm.position.set(0, 11.8, 7.5);
      arm.rotation.set(0, armAng, Math.PI / 2.3);
      starfishGroup.add(arm);
    }

    // Cute beaded eyes on the starfish
    var sEye1 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), darkMat);
    sEye1.position.set(1.4, 12.8, 11.2);
    starfishGroup.add(sEye1);
    var sEye2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6), darkMat);
    sEye2.position.set(-1.4, 12.8, 11.2);
    starfishGroup.add(sEye2);

    // Bioluminescent radiance
    var starGlow = new THREE.PointLight(0xff44aa, 2.0, 55);
    starGlow.position.set(0, 14, 7.5);
    starfishGroup.add(starGlow);

    starfishGroup.visible = false;
    v.add(starfishGroup);
    this.hatMeshes.starfish = starfishGroup;
  },

  buildBubbleGunMesh: function () {
    var gunGroup = new THREE.Group();

    // High-contrast vibrant aquatic tech materials
    var cyanMetalMat = new THREE.MeshLambertMaterial({
      color: 0x00e5ff,
      emissive: 0x004d66
    });
    var navySaddleMat = new THREE.MeshLambertMaterial({
      color: 0x10283e,
      emissive: 0x040c14
    });
    var goldTrimMat = new THREE.MeshLambertMaterial({
      color: 0xffd000,
      emissive: 0x553800
    });
    var darkSteelMat = new THREE.MeshLambertMaterial({
      color: 0x1a2634
    });
    var glowGlassMat = new THREE.MeshLambertMaterial({
      color: 0x80ffff,
      transparent: true,
      opacity: 0.72
    });
    var neonCyanBasic = new THREE.MeshBasicMaterial({
      color: 0x00ffff
    });

    // 1. Central Tech-Harness Saddle Plate on Back
    // Sits prominently across the catfish shoulders (x: 0, y: 7.8, z: 0.5)
    var saddleGeom = new THREE.BoxGeometry(26, 4.5, 16);
    var saddle = new THREE.Mesh(saddleGeom, navySaddleMat);
    saddle.position.set(0, 7.8, 0.5);
    gunGroup.add(saddle);

    var saddleTrimGeom = new THREE.BoxGeometry(27.5, 1.8, 17.5);
    var saddleTrim = new THREE.Mesh(saddleTrimGeom, goldTrimMat);
    saddleTrim.position.set(0, 7.8, 0.5);
    gunGroup.add(saddleTrim);

    // Glowing energy spine
    var spineGeom = new THREE.CylinderGeometry(1.6, 1.6, 18, 8);
    spineGeom.rotateX(Math.PI / 2);
    var spine = new THREE.Mesh(spineGeom, neonCyanBasic);
    spine.position.set(0, 10.4, 0.5);
    gunGroup.add(spine);

    // 2. Helper to build Left and Right Heavy Blaster Cannons
    var createCannon = function (isLeft) {
      var side = isLeft ? 1 : -1;
      var cannon = new THREE.Group();
      // Mounted high and wide outside the body for 100% visibility!
      cannon.position.set(side * 18.5, 8.5, 2.0);

      // Angled Pylon Mount connecting saddle to cannon
      var pylonGeom = new THREE.BoxGeometry(7.0, 3.2, 5.0);
      var pylon = new THREE.Mesh(pylonGeom, darkSteelMat);
      pylon.position.set(-side * 3.5, -0.5, 0);
      pylon.rotation.z = side * 0.25;
      cannon.add(pylon);

      // Main Heavy Blaster Barrel (Length 30! Projects boldly forward past nose)
      var barrelGeom = new THREE.CylinderGeometry(3.2, 3.6, 30, 12);
      barrelGeom.rotateX(Math.PI / 2);
      var barrel = new THREE.Mesh(barrelGeom, cyanMetalMat);
      cannon.add(barrel);

      // Gold Reinforced Muzzle Nozzle at the front tip (z = +16.5)
      var muzzleGeom = new THREE.CylinderGeometry(4.6, 3.2, 4.8, 12);
      muzzleGeom.rotateX(Math.PI / 2);
      var muzzle = new THREE.Mesh(muzzleGeom, goldTrimMat);
      muzzle.position.set(0, 0, 16.5);
      cannon.add(muzzle);

      // Muzzle bore ring
      var boreGeom = new THREE.RingGeometry(1.0, 3.2, 12);
      var bore = new THREE.Mesh(boreGeom, new THREE.MeshBasicMaterial({ color: 0x002233, side: THREE.DoubleSide }));
      bore.position.set(0, 0, 18.95);
      cannon.add(bore);

      // Rear Breech Housing
      var breechGeom = new THREE.BoxGeometry(7.5, 7.5, 8.5);
      var breech = new THREE.Mesh(breechGeom, navySaddleMat);
      breech.position.set(0, 0, -11.5);
      cannon.add(breech);

      var breechTrim = new THREE.Mesh(new THREE.BoxGeometry(8.2, 8.2, 2.0), goldTrimMat);
      breechTrim.position.set(0, 0, -11.5);
      cannon.add(breechTrim);

      // Giant Bubble Energy Chamber on top
      var chamberGeom = new THREE.SphereGeometry(5.2, 16, 12);
      var chamber = new THREE.Mesh(chamberGeom, glowGlassMat);
      chamber.position.set(0, 5.5, -2.5);
      cannon.add(chamber);

      var core = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 10), neonCyanBasic);
      core.position.set(0, 5.5, -2.5);
      cannon.add(core);

      // Dedicated PointLight on each cannon
      var gunLight = new THREE.PointLight(0x00ffff, 2.4, 60);
      gunLight.position.set(0, 5.5, -2.5);
      cannon.add(gunLight);

      return cannon;
    };

    var leftCannon = createCannon(true);
    gunGroup.add(leftCannon);

    var rightCannon = createCannon(false);
    gunGroup.add(rightCannon);

    gunGroup.visible = false;
    if (this.visualMesh) {
      this.visualMesh.add(gunGroup);
    }
    this.bubbleGunMesh = gunGroup;
  },

  fireBubbleGun: function () {
    if (!this.hasBubbleGun) return;
    if (this.shootCooldown > 0) return;
    this.shootCooldown = 0.20;

    if (CF.Audio && CF.Audio.bubbleFire) CF.Audio.bubbleFire();

    var forward = new THREE.Vector3(0, 0, 1).applyEuler(this.mesh.rotation);
    var right = new THREE.Vector3(1, 0, 0).applyEuler(this.mesh.rotation);
    var up = new THREE.Vector3(0, 1, 0).applyEuler(this.mesh.rotation);

    this.lastCannonSide = !this.lastCannonSide;
    var sideOffset = this.lastCannonSide ? 18.5 : -18.5;

    // Spawns accurately at the forward nozzle tip
    var spawnPos = this.mesh.position.clone()
      .add(forward.clone().multiplyScalar(28))
      .add(right.clone().multiplyScalar(sideOffset))
      .add(up.clone().multiplyScalar(8.5));

    var speed = 28.0;
    var velocity = forward.clone().multiplyScalar(speed);

    // Glowing iridescent bubble projectile
    var bubbleGeom = new THREE.SphereGeometry(3.6, 12, 10);
    var bubbleMat = new THREE.MeshBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.82
    });
    var bubbleMesh = new THREE.Mesh(bubbleGeom, bubbleMat);

    var coreGeom = new THREE.SphereGeometry(1.8, 8, 8);
    var coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    var coreMesh = new THREE.Mesh(coreGeom, coreMat);
    bubbleMesh.add(coreMesh);

    bubbleMesh.position.copy(spawnPos);
    if (CF.Render3D && CF.Render3D.scene) {
      CF.Render3D.scene.add(bubbleMesh);
    }

    this.bubbleProjectiles.push({
      mesh: bubbleMesh,
      x: spawnPos.x,
      y: spawnPos.y,
      z: spawnPos.z,
      vx: velocity.x,
      vy: velocity.y,
      vz: velocity.z,
      life: 2.2
    });

    if (CF.Render3D && CF.Render3D.burst) {
      CF.Render3D.burst(spawnPos.x, spawnPos.y, spawnPos.z, false);
    }
  },

  clearBubbles: function () {
    if (!this.bubbleProjectiles) return;
    for (var i = 0; i < this.bubbleProjectiles.length; i++) {
      var b = this.bubbleProjectiles[i];
      if (b.mesh && CF.Render3D && CF.Render3D.scene) {
        CF.Render3D.scene.remove(b.mesh);
      }
    }
    this.bubbleProjectiles = [];
  },

  updateBubbles: function (dt) {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    if (!this.bubbleProjectiles || this.bubbleProjectiles.length === 0) return;
    var scene = CF.Render3D ? CF.Render3D.scene : null;

    for (var i = this.bubbleProjectiles.length - 1; i >= 0; i--) {
      var b = this.bubbleProjectiles[i];
      b.life -= dt;

      b.x += b.vx;
      b.y += b.vy;
      b.z += b.vz;
      b.vy += 0.04; // slight aquatic buoyancy

      if (b.mesh) {
        b.mesh.position.set(b.x, b.y, b.z);
        b.mesh.scale.multiplyScalar(0.998);
      }

      var hit = false;

      // 1. Check Collision with Giant Octopus Boss!
      if (CF.Octopus && CF.Octopus.alive) {
        var dOcto = CF.dist3D(b.x, b.y, b.z, CF.Octopus.x, CF.Octopus.y, CF.Octopus.z);
        if (dOcto < 75) {
          hit = true;
          CF.Octopus.takeDamage(10, b.x, b.y, b.z);
          if (CF.Audio && CF.Audio.bubbleHit) CF.Audio.bubbleHit();
          if (CF.Render3D && CF.Render3D.burst) CF.Render3D.burst(b.x, b.y, b.z, false);
        }
      }

      // 2. Check Collision with Sharks / Barracuda (defensive stun)
      if (!hit && CF.Shark && CF.Shark.list) {
        for (var p = 0; p < CF.Shark.list.length; p++) {
          var pred = CF.Shark.list[p];
          var dPred = CF.dist3D(b.x, b.y, b.z, pred.x, pred.y, pred.z);
          if (dPred < 48) {
            hit = true;
            pred.speed = -4.0;
            if (CF.Audio && CF.Audio.bubbleHit) CF.Audio.bubbleHit();
            if (CF.Render3D && CF.Render3D.burst) CF.Render3D.burst(b.x, b.y, b.z, false);
            break;
          }
        }
      }

      // 3. Expiration or hit
      if (hit || b.life <= 0 || (CF.CONFIG && b.y > CF.CONFIG.WORLD_SURFACE)) {
        if (b.mesh && scene) {
          scene.remove(b.mesh);
          if (b.mesh.geometry) b.mesh.geometry.dispose();
          if (b.mesh.material) b.mesh.material.dispose();
        }
        this.bubbleProjectiles.splice(i, 1);
      }
    }
  },

  setFirstPerson: function (isFirst) {
    if (this.visualMesh) {
      this.visualMesh.visible = !isFirst;
    }
  },

  update: function (timeScale) {
    var C = CF.CONFIG;
    var a = CF.Input.axis();
    var dt = 1 / 60;
    var ts = (typeof timeScale === 'number') ? timeScale : 1.0;

    // Turbo Boost decay
    if (this.boostTimer > 0) {
      this.boostTimer -= dt * ts;
    }

    // Breach Cooldown decay
    if (this.breachCooldown > 0) {
      this.breachCooldown -= dt * ts;
      if (this.breachCooldown <= 0) {
        this.breachCooldown = 0;
        if (this.breachState === 'cooldown') {
          this.breachState = 'underwater';
        }
      }
    }

    // 1. Yaw Steering (A / D or Left / Right Arrows)
    this.yaw -= a.x * C.PLAYER_TURN_SPEED * ts;

    // 2. Direct Vertical 3D Swimming (Space = UP toward sun, Shift/C/Q = DOWN toward reef)
    if (this.breachState !== 'airborne') {
      if (a.z > 0) {
        this.vy = CF.lerp(this.vy, C.PLAYER_SWIM_UP, 0.18 * ts);
        this.pitch = CF.lerp(this.pitch, 0.42, 0.12 * ts);
      } else if (a.z < 0) {
        this.vy = CF.lerp(this.vy, -C.PLAYER_SWIM_DOWN, 0.18 * ts);
        this.pitch = CF.lerp(this.pitch, -0.42, 0.12 * ts);
      } else {
        this.vy *= Math.pow(0.91, ts);
        this.pitch = CF.lerp(this.pitch, 0, 0.08 * ts);
      }
    }

    // 3. Roll Banking into Turns
    this.roll = CF.lerp(this.roll, -a.x * 0.38, 0.1 * ts);

    // 4. Forward / Backward Propulsion (W / S or Up / Down Arrows)
    var currentMaxSpeed = (this.boostTimer > 0) ? (C.PLAYER_MAX_SPEED * 2.3) : C.PLAYER_MAX_SPEED;
    if (this.breachState !== 'airborne') {
      if (a.y !== 0) {
        this.speed = Math.min(currentMaxSpeed, this.speed + a.y * C.PLAYER_ACCEL * ts);
      }
      this.speed *= Math.pow(C.PLAYER_DRAG, ts);
    } else {
      // In air, maintain forward momentum with minimal air resistance
      this.speed *= Math.pow(0.992, ts);
    }

    // 5. Compute 3D Velocity & Movement
    var fwdX = Math.sin(this.yaw) * Math.cos(this.pitch);
    var fwdY = Math.sin(this.pitch);
    var fwdZ = Math.cos(this.yaw) * Math.cos(this.pitch);

    this.vx = fwdX * this.speed;
    this.vz = fwdZ * this.speed;

    this.x += this.vx * ts;
    this.y += (this.vy + (fwdY * this.speed * 0.5)) * ts;
    this.z += this.vz * ts;

    // 6. Surface Breaching, Airborne Physics & World Bounds Check
    var surfaceY = C.WORLD_SURFACE;
    var floorY = CF.Render3D.getTerrainHeight(this.x, this.z) + 16;

    this.x = CF.clamp(this.x, -C.WORLD_HALF + 40, C.WORLD_HALF - 40);
    this.z = CF.clamp(this.z, -C.WORLD_HALF + 40, C.WORLD_HALF - 40);

    if (this.breachState === 'airborne') {
      this.isBreaching = true;

      // Air gravity smoothly decelerates ascent and accelerates clean descent
      this.vy -= 0.18 * ts;

      // Authentic Dolphin Breach Pitch Arc (Graceful arc, NO tumbling or spinning!)
      // Upward climb: nose points up (+0.35 rad)
      // Apex: smoothly levels out (0 rad)
      // Descent: dips downward (-0.40 rad) for clean ocean dive entry
      var targetPitch = 0.0;
      if (this.vy > 0.8) {
        targetPitch = 0.35;
      } else if (this.vy < -0.8) {
        targetPitch = -0.40;
      } else {
        targetPitch = 0.0;
      }
      this.pitch = CF.lerp(this.pitch, targetPitch, 0.10 * ts);
      this.roll = CF.lerp(this.roll, 0.0, 0.10 * ts);

      // Re-entry into water
      if (this.y < surfaceY) {
        this.y = surfaceY - 1.0;
        this.breachState = 'cooldown';
        this.isBreaching = false;
        this.breachCooldown = 1.6; // 1.6s cooldown guarantees no rapid re-triggering
        this.vy = -3.2; // Clean diving re-entry
        this.pitch = -0.30;
        CF.Render3D.splash(this.x, this.z, false);
        if (CF.Audio && CF.Audio.splash) CF.Audio.splash();
      } else {
        // Natural vault height ceiling (~44 units above water, keeping ships & sky in frame)
        this.y = Math.min(this.y, surfaceY + 46);
      }
    } else {
      // Underwater or Cooldown
      this.isBreaching = false;

      var launching = (this.vy > 1.3) || (this.pitch > 0.18 && this.speed > 2.8);
      if (this.breachState === 'underwater' && this.y >= surfaceY - 10 && launching) {
        // MAJESTIC SOARING LAUNCH INTO THE SUNNY SKY!
        this.breachState = 'airborne';
        this.isBreaching = true;
        this.vy = 4.2; // Perfectly tuned jump impulse: arcs ~44 units above water (peak y ≈ 124)
        CF.Render3D.splash(this.x, this.z, true);
        if (CF.Audio && CF.Audio.slowMoLeap) CF.Audio.slowMoLeap();
        else if (CF.Audio) CF.Audio.leap();
      } else {
        var maxSubmergedY = (this.breachCooldown > 0) ? (surfaceY - 4) : (surfaceY - 1.5);
        this.y = CF.clamp(this.y, floorY, maxSubmergedY);
      }
    }

    // 7. Update Mesh Transform & Smooth Swimming Wag
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, this.z);
      this.mesh.rotation.set(-this.pitch, this.yaw, this.roll, 'YXZ');

      var t = CF.Render3D.clock || performance.now();
      var isMoving = Math.abs(this.speed) > 0.2 || Math.abs(this.vy) > 0.2;
      var wagFreq = (this.boostTimer > 0) ? 0.038 : (isMoving ? 0.018 : 0.008);
      var wagAmp = (this.boostTimer > 0) ? 0.35 : (isMoving ? 0.22 : 0.08);

      if (this.tailMesh) {
        this.tailMesh.rotation.y = Math.sin(t * wagFreq) * wagAmp;
      }

      if (this.leftFin && this.rightFin) {
        this.leftFin.rotation.z = -1.1 + Math.sin(t * wagFreq * 0.8) * 0.22;
        this.rightFin.rotation.z = 1.1 - Math.sin(t * wagFreq * 0.8) * 0.22;
      }
    }

    // 8. Update Tail Trails & Snorkel Bubbles
    this.updateTrails(dt);
  },

  updateTrails: function (dt) {
    if (!this.mesh) return;

    var isMoving = (Math.abs(this.speed) > 0.8 || Math.abs(this.vy) > 0.8 || this.boostTimer > 0);

    // Tail position in world space
    var forward = new THREE.Vector3(0, 0, 1).applyEuler(this.mesh.rotation);
    var tailPos = this.mesh.position.clone().sub(forward.clone().multiplyScalar(32));

    // Rainbow Bubble Trail (Large, glossy, vibrant rainbow spheres!)
    if (this.activeTrail === 'rainbow' && isMoving) {
      var rainbowCols = [0xff2255, 0xff7700, 0xffe600, 0x22dd55, 0x00e5ff, 0x2288ff, 0xb522ff];
      var spawnCount = (this.boostTimer > 0) ? 3 : 2;
      for (var sc = 0; sc < spawnCount; sc++) {
        this.rainbowHueIndex = (this.rainbowHueIndex + 1) % rainbowCols.length;
        var col = rainbowCols[this.rainbowHueIndex];

        var bubGeom = new THREE.SphereGeometry(CF.rand(3.2, 5.8), 8, 8);
        var bubMat = new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.88
        });
        var bub = new THREE.Mesh(bubGeom, bubMat);
        bub.position.copy(tailPos).add(new THREE.Vector3(CF.rand(-4, 4), CF.rand(-4, 4), CF.rand(-4, 4)));

        CF.Render3D.scene.add(bub);
        this.trailParticles.push({
          mesh: bub,
          vy: CF.rand(0.3, 0.8),
          life: 1.0,
          decay: 0.02
        });
      }
    }

    // Sparkle Dust / Neon Comet Trail (Glittering golden stars and cyan comet sparks!)
    if (this.activeTrail === 'sparkle' && isMoving) {
      var spawnCount2 = (this.boostTimer > 0) ? 3 : 2;
      for (var sc2 = 0; sc2 < spawnCount2; sc2++) {
        var spkGeom = new THREE.DodecahedronGeometry(CF.rand(2.4, 4.8), 0);
        var spkColor = (Math.random() < 0.5) ? 0xffea00 : 0x00f5ff;
        var spkMat = new THREE.MeshBasicMaterial({
          color: spkColor,
          transparent: true,
          opacity: 0.95
        });
        var spk = new THREE.Mesh(spkGeom, spkMat);
        spk.position.copy(tailPos).add(new THREE.Vector3(CF.rand(-5, 5), CF.rand(-5, 5), CF.rand(-5, 5)));
        spk.rotation.set(Math.random() * 3, Math.random() * 3, 0);

        CF.Render3D.scene.add(spk);
        this.trailParticles.push({
          mesh: spk,
          vy: CF.rand(-0.2, 0.4),
          life: 1.0,
          decay: 0.024
        });
      }
    }

    // Scuba Mask Periodic Bubbles & Chime
    if (this.activeHat === 'scuba' && !this.isBreaching) {
      this.snorkelTimer += dt;
      if (this.snorkelTimer >= 1.8) {
        this.snorkelTimer = 0;
        CF.Audio.snorkel();
        var headPos = this.mesh.position.clone().add(new THREE.Vector3(9.5, 14, 5).applyEuler(this.mesh.rotation));
        for (var b = 0; b < 2; b++) {
          var sGeom = new THREE.SphereGeometry(CF.rand(1.2, 2.2), 6, 6);
          var sMat = new THREE.MeshBasicMaterial({ color: 0xccffff, transparent: true, opacity: 0.75 });
          var sMesh = new THREE.Mesh(sGeom, sMat);
          sMesh.position.copy(headPos).add(new THREE.Vector3(CF.rand(-1, 1), CF.rand(-1, 1), CF.rand(-1, 1)));
          CF.Render3D.scene.add(sMesh);
          this.trailParticles.push({
            mesh: sMesh,
            vy: CF.rand(0.5, 1.0),
            life: 1.0,
            decay: 0.02
          });
        }
      }
    }

    // Update active trail particles
    for (var i = this.trailParticles.length - 1; i >= 0; i--) {
      var tp = this.trailParticles[i];
      tp.mesh.position.y += tp.vy;
      tp.life -= tp.decay;
      tp.mesh.material.opacity = Math.max(0, tp.life);
      tp.mesh.scale.multiplyScalar(0.98);
      if (tp.life <= 0) {
        CF.Render3D.scene.remove(tp.mesh);
        if (tp.mesh.geometry) tp.mesh.geometry.dispose();
        if (tp.mesh.material) tp.mesh.material.dispose();
        this.trailParticles.splice(i, 1);
      }
    }
  }
};
