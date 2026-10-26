window.CF = window.CF || {};

CF.Critters = {
  fish: [],
  jellyfish: [],
  mantas: [],
  dolphins: [],
  initialized: false,
  sharedGeoms: null,
  speciesData: null,
  jellyGeoms: null,
  jellyMats: null,
  mantaGeoms: null,
  mantaMats: null,
  dolphinGeoms: null,
  dolphinMats: null,

  ensureSharedAssets: function () {
    if (this.sharedGeoms && this.dolphinGeoms && this.mantaGeoms) return;

    // 1. Shared Fish Geometries
    var bodyGeom = new THREE.SphereGeometry(6, 12, 8);
    bodyGeom.scale(0.55, 1.1, 1.9);

    var bellyGeom = new THREE.SphereGeometry(4.8, 10, 6);
    bellyGeom.scale(0.48, 0.45, 1.5);

    var stripeGeom = new THREE.TorusGeometry(5.2, 0.75, 4, 14);
    stripeGeom.scale(0.56, 1.1, 1);

    var eyeGeom = new THREE.SphereGeometry(1.4, 6, 6);
    var pupilGeom = new THREE.SphereGeometry(0.75, 5, 5);

    var dorsalGeom = new THREE.PlaneGeometry(10, 4);
    dorsalGeom.rotateY(Math.PI / 2);

    var pecGeom = new THREE.ConeGeometry(2.5, 6, 3);
    pecGeom.scale(0.15, 1, 1.2);

    var tailFinGeom = new THREE.ConeGeometry(5.5, 9, 4);
    tailFinGeom.scale(0.15, 1, 1.4);
    tailFinGeom.rotateX(Math.PI / 2);

    this.sharedGeoms = {
      body: bodyGeom,
      belly: bellyGeom,
      stripe: stripeGeom,
      eye: eyeGeom,
      pupil: pupilGeom,
      dorsal: dorsalGeom,
      pec: pecGeom,
      tailFin: tailFinGeom
    };

    var eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x080808 });

    // 5 Distinct Colorful Tropical Reef Species (including vibrant Clownfish)
    var specs = [
      { name: 'Clownfish', body: 0xff5500, belly: 0xffeedd, tail: 0xff6600, stripe: 0xffffff, isClown: true },
      { name: 'Blue Tang', body: 0x1a75ff, belly: 0x80c0ff, tail: 0xffdf00, stripe: null },
      { name: 'Lemon Tang', body: 0xffcc00, belly: 0xfff5aa, tail: 0xffaa00, stripe: null },
      { name: 'Neon Tetra', body: 0x00e5ff, belly: 0x88ffff, tail: 0xff0066, stripe: 0xff0077 },
      { name: 'Flame Angel', body: 0xff2200, belly: 0xff7733, tail: 0x8338ec, stripe: 0x3a0ca3 }
    ];

    this.speciesData = specs.map(function (s) {
      var bodyCol = new THREE.Color(s.body);
      var bellyCol = new THREE.Color(s.belly);
      var tailCol = new THREE.Color(s.tail);

      var bodyMat = new THREE.MeshLambertMaterial({
        color: bodyCol,
        emissive: bodyCol.clone().multiplyScalar(0.28)
      });
      var bellyMat = new THREE.MeshLambertMaterial({
        color: bellyCol,
        emissive: bellyCol.clone().multiplyScalar(0.15)
      });
      var finMat = new THREE.MeshLambertMaterial({
        color: tailCol,
        emissive: tailCol.clone().multiplyScalar(0.35),
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      });
      var stripeMat = s.stripe ? new THREE.MeshBasicMaterial({ color: new THREE.Color(s.stripe) }) : null;

      return {
        name: s.name,
        isClown: !!s.isClown,
        hasStripe: !!s.stripe,
        bodyMat: bodyMat,
        bellyMat: bellyMat,
        finMat: finMat,
        stripeMat: stripeMat,
        eyeWhiteMat: eyeWhiteMat,
        eyePupilMat: eyePupilMat
      };
    });

    // 2. Manta Ray Shared Geometries & Materials
    var mantaBody = new THREE.ConeGeometry(22, 36, 4);
    mantaBody.scale(1.85, 0.18, 1);
    mantaBody.rotateX(Math.PI / 2);

    var mantaWingL = new THREE.ConeGeometry(15, 26, 3);
    mantaWingL.scale(1.7, 0.12, 0.88);
    mantaWingL.rotateX(Math.PI / 2);

    var mantaWingR = new THREE.ConeGeometry(15, 26, 3);
    mantaWingR.scale(1.7, 0.12, 0.88);
    mantaWingR.rotateX(Math.PI / 2);

    var mantaHorn = new THREE.ConeGeometry(2.4, 7.5, 4);
    mantaHorn.rotateX(Math.PI / 2);

    var mantaTail = new THREE.CylinderGeometry(0.5, 1.3, 48, 4);
    mantaTail.rotateX(Math.PI / 2);

    this.mantaGeoms = {
      body: mantaBody,
      wingL: mantaWingL,
      wingR: mantaWingR,
      horn: mantaHorn,
      tail: mantaTail
    };

    this.mantaMats = {
      back: new THREE.MeshLambertMaterial({ color: 0x132238, emissive: 0x050c16 }),
      belly: new THREE.MeshLambertMaterial({ color: 0xf2f7fc, emissive: 0x223548 }),
      mark: new THREE.MeshBasicMaterial({ color: 0x70e0f0 })
    };

    // 3. Dolphin Shared Geometries & Materials
    var dolphinTorso = new THREE.SphereGeometry(7.5, 14, 10);
    dolphinTorso.scale(0.85, 1.05, 2.8);

    var dolphinSnout = new THREE.ConeGeometry(3.0, 10, 8);
    dolphinSnout.scale(0.85, 0.75, 1.0);
    dolphinSnout.rotateX(Math.PI / 2);

    var dolphinDorsal = new THREE.ConeGeometry(3.2, 9.5, 4);
    dolphinDorsal.scale(0.35, 1, 1.4);
    dolphinDorsal.rotateX(-0.55);

    var dolphinFlipper = new THREE.ConeGeometry(2.6, 9.0, 3);
    dolphinFlipper.scale(0.18, 1, 1.2);

    var dolphinFluke = new THREE.PlaneGeometry(16, 6.5);
    dolphinFluke.rotateX(Math.PI / 2);

    this.dolphinGeoms = {
      torso: dolphinTorso,
      snout: dolphinSnout,
      dorsal: dolphinDorsal,
      flipper: dolphinFlipper,
      fluke: dolphinFluke
    };

    this.dolphinMats = {
      back: new THREE.MeshLambertMaterial({ color: 0x2e6580, emissive: 0x091c26 }),
      belly: new THREE.MeshLambertMaterial({ color: 0xf0f7fb, emissive: 0x243e4f })
    };

    // 4. Jellyfish Shared Geometries & Materials
    this.jellyGeoms = {
      bell: new THREE.SphereGeometry(12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    };

    var jellyColors = [0x55eeff, 0xff77cc, 0xb066ff, 0x00f5d4, 0xffd166];
    this.jellyMats = jellyColors.map(function (colHex) {
      var jCol = new THREE.Color(colHex);
      return {
        bell: new THREE.MeshLambertMaterial({
          color: jCol,
          emissive: jCol.clone().multiplyScalar(0.6),
          transparent: true,
          opacity: 0.78,
          side: THREE.DoubleSide
        }),
        tentacle: new THREE.LineBasicMaterial({
          color: jCol,
          transparent: true,
          opacity: 0.7
        })
      };
    });
  },

  init: function () {
    var C = CF.CONFIG;
    if (!CF.Render3D.scene) return;

    if (this.initialized && this.fish.length > 0) {
      this.reset();
      return;
    }

    this.ensureSharedAssets();

    this.fish = [];
    this.jellyfish = [];
    this.mantas = [];
    this.dolphins = [];

    // 1. Spawn Schools of Fish (including Clownfish near the coral garden)
    var schoolCount = C.FISH_SCHOOLS || 12;
    var perSchool = C.FISH_PER_SCHOOL || 5;

    for (var s = 0; s < schoolCount; s++) {
      var spec = this.speciesData[s % this.speciesData.length];
      // Schools 0 and 1 are dedicated Clownfish positioned in front of spawn over the coral reef!
      var cx, cy, cz;
      if (s === 0) {
        spec = this.speciesData[0]; // Clownfish
        cx = CF.rand(-25, 25);
        cy = -120;
        cz = CF.rand(70, 130);
      } else if (s === 1) {
        spec = this.speciesData[0]; // Clownfish school 2
        cx = CF.rand(30, 80);
        cy = -135;
        cz = CF.rand(110, 170);
      } else if (s === 2) {
        spec = this.speciesData[1]; // Blue Tang near spawn
        cx = CF.rand(-80, -30);
        cy = -95;
        cz = CF.rand(60, 140);
      } else {
        cx = CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
        cy = CF.rand(C.WORLD_FLOOR + 60, C.WORLD_SURFACE - 30);
        cz = CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
      }

      for (var k = 0; k < perSchool; k++) {
        var fx = cx + CF.rand(-30, 30);
        var fy = cy + CF.rand(-18, 18);
        var fz = cz + CF.rand(-30, 30);

        var fishGroup = this.createFishMesh(spec);
        fishGroup.position.set(fx, fy, fz);
        CF.Render3D.scene.add(fishGroup);

        this.fish.push({
          mesh: fishGroup,
          tail: fishGroup.userData.tail,
          leftPec: fishGroup.userData.leftPec,
          rightPec: fishGroup.userData.rightPec,
          x: fx,
          y: fy,
          z: fz,
          yaw: CF.rand(0, Math.PI * 2),
          pitch: CF.rand(-0.15, 0.15),
          roll: 0,
          speed: CF.rand(1.6, 2.5),
          baseSpeed: CF.rand(1.6, 2.5),
          wag: CF.rand(0, Math.PI * 2),
          burstTimer: CF.rand(0, 4)
        });
      }
    }

    // 2. Spawn Majestic Manta Rays
    var mantaCount = C.MANTA_COUNT || 5;
    for (var mIdx = 0; mIdx < mantaCount; mIdx++) {
      var mx, my, mz;
      if (mIdx === 0) {
        mx = -75; my = -20; mz = 170;
      } else if (mIdx === 1) {
        mx = -135; my = -35; mz = 210;
      } else {
        mx = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
        my = CF.rand(C.WORLD_FLOOR + 120, C.WORLD_SURFACE - 20);
        mz = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
      }

      var mantaGroup = this.createMantaMesh();
      mantaGroup.position.set(mx, my, mz);
      CF.Render3D.scene.add(mantaGroup);

      this.mantas.push({
        mesh: mantaGroup,
        wingL: mantaGroup.userData.wingL,
        wingR: mantaGroup.userData.wingR,
        x: mx,
        y: my,
        z: mz,
        yaw: (mIdx === 0) ? 0.35 : CF.rand(0, Math.PI * 2),
        pitch: 0,
        roll: 0,
        speed: CF.rand(2.2, 3.4),
        phase: CF.rand(0, Math.PI * 2)
      });
    }

    // 3. Spawn Friendly Dolphins (Pod near player + open ocean pod)
    var dolphinCount = C.DOLPHIN_COUNT || 6;
    for (var dIdx = 0; dIdx < dolphinCount; dIdx++) {
      var dx, dy, dz;
      if (dIdx === 0) {
        dx = 75; dy = -52; dz = 135;
      } else if (dIdx === 1) {
        dx = 105; dy = -42; dz = 155;
      } else if (dIdx === 2) {
        dx = 135; dy = -32; dz = 175;
      } else {
        dx = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
        dy = CF.rand(C.WORLD_FLOOR + 100, C.WORLD_SURFACE - 25);
        dz = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
      }

      var dolphinGroup = this.createDolphinMesh();
      dolphinGroup.position.set(dx, dy, dz);
      CF.Render3D.scene.add(dolphinGroup);

      this.dolphins.push({
        mesh: dolphinGroup,
        fluke: dolphinGroup.userData.fluke,
        flipperL: dolphinGroup.userData.flipperL,
        flipperR: dolphinGroup.userData.flipperR,
        x: dx,
        y: dy,
        z: dz,
        yaw: (dIdx < 3) ? -0.3 : CF.rand(0, Math.PI * 2),
        pitch: 0,
        roll: 0,
        speed: CF.rand(3.6, 5.2),
        phase: CF.rand(0, Math.PI * 2)
      });
    }

    // 4. Glowing Bioluminescent Jellyfish
    var jellyCount = C.JELLY_COUNT || 12;
    for (var jIdx = 0; jIdx < jellyCount; jIdx++) {
      var jx = (jIdx < 3) ? CF.rand(-140, 140) : CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
      var jy = (jIdx < 3) ? CF.rand(-60, -220) : CF.rand(C.WORLD_FLOOR + 50, C.WORLD_SURFACE - 40);
      var jz = (jIdx < 3) ? CF.rand(60, 240) : CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
      var jMats = this.jellyMats[jIdx % this.jellyMats.length];

      var jellyGroup = new THREE.Group();

      var bell = new THREE.Mesh(this.jellyGeoms.bell, jMats.bell);
      jellyGroup.add(bell);

      // Trailing tentacles
      for (var tIdx = 0; tIdx < 5; tIdx++) {
        var ang = (tIdx / 5) * Math.PI * 2;
        var rad = 6.5;
        var tLineG = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(ang) * rad, 0, Math.sin(ang) * rad),
          new THREE.Vector3(Math.cos(ang) * rad * 0.8, -16, Math.sin(ang) * rad * 0.8),
          new THREE.Vector3(Math.cos(ang) * rad * 1.1, -30, Math.sin(ang) * rad * 1.1)
        ]);
        var tLine = new THREE.Line(tLineG, jMats.tentacle);
        jellyGroup.add(tLine);
      }

      jellyGroup.position.set(jx, jy, jz);
      CF.Render3D.scene.add(jellyGroup);

      this.jellyfish.push({
        mesh: jellyGroup,
        x: jx,
        y: jy,
        z: jz,
        phase: CF.rand(0, Math.PI * 2),
        vy: CF.rand(0.25, 0.55)
      });
    }

    this.initialized = true;
  },

  reset: function () {
    var C = CF.CONFIG;
    for (var i = 0; i < this.fish.length; i++) {
      var f = this.fish[i];
      if (i < 5) {
        // School 0: Clownfish colony right above the torch/mushroom reef in front of spawn!
        f.x = CF.rand(-25, 25);
        f.y = CF.rand(-130, -145);
        f.z = CF.rand(80, 140);
      } else if (i < 10) {
        // School 1: Second Clownfish school
        f.x = CF.rand(35, 75);
        f.y = CF.rand(-135, -150);
        f.z = CF.rand(100, 160);
      } else if (i < 15) {
        // School 2: Blue Tangs near spawn
        f.x = CF.rand(-75, -25);
        f.y = CF.rand(-110, -135);
        f.z = CF.rand(80, 150);
      } else {
        f.x = CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
        f.y = CF.rand(C.WORLD_FLOOR + 50, C.WORLD_SURFACE - 30);
        f.z = CF.rand(-C.WORLD_HALF + 180, C.WORLD_HALF - 180);
      }
      f.yaw = CF.rand(0, Math.PI * 2);
      f.speed = f.baseSpeed;
      if (f.mesh) f.mesh.position.set(f.x, f.y, f.z);
    }

    for (var m = 0; m < this.mantas.length; m++) {
      var mt = this.mantas[m];
      if (m === 0) {
        mt.x = -75; mt.y = -20; mt.z = 170;
      } else if (m === 1) {
        mt.x = -135; mt.y = -35; mt.z = 210;
      } else {
        mt.x = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
        mt.y = CF.rand(C.WORLD_FLOOR + 120, C.WORLD_SURFACE - 20);
        mt.z = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
      }
      mt.yaw = (m === 0) ? 0.35 : CF.rand(0, Math.PI * 2);
      if (mt.mesh) mt.mesh.position.set(mt.x, mt.y, mt.z);
    }

    for (var d = 0; d < this.dolphins.length; d++) {
      var dp = this.dolphins[d];
      if (d === 0) {
        dp.x = 75; dp.y = -52; dp.z = 135;
      } else if (d === 1) {
        dp.x = 105; dp.y = -42; dp.z = 155;
      } else if (d === 2) {
        dp.x = 135; dp.y = -32; dp.z = 175;
      } else {
        dp.x = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
        dp.y = CF.rand(C.WORLD_FLOOR + 100, C.WORLD_SURFACE - 25);
        dp.z = CF.rand(-C.WORLD_HALF + 200, C.WORLD_HALF - 200);
      }
      dp.yaw = (d < 3) ? -0.3 : CF.rand(0, Math.PI * 2);
      if (dp.mesh) dp.mesh.position.set(dp.x, dp.y, dp.z);
    }
  },

  createFishMesh: function (spec) {
    var G = this.sharedGeoms;
    var group = new THREE.Group();

    // 1. Streamlined Body
    var body = new THREE.Mesh(G.body, spec.bodyMat);
    group.add(body);

    // Pale Underbelly
    var belly = new THREE.Mesh(G.belly, spec.bellyMat);
    belly.position.set(0, -2.2, 0.5);
    group.add(belly);

    // Species Stripes (Clownfish has distinctive triple white bands!)
    if (spec.isClown) {
      // 3 crisp white clownfish stripes
      var stripe1 = new THREE.Mesh(G.stripe, spec.stripeMat);
      stripe1.position.set(0, 0, 4.2);
      stripe1.scale.set(0.92, 0.92, 0.85);
      group.add(stripe1);

      var stripe2 = new THREE.Mesh(G.stripe, spec.stripeMat);
      stripe2.position.set(0, 0, 0.2);
      group.add(stripe2);

      var stripe3 = new THREE.Mesh(G.stripe, spec.stripeMat);
      stripe3.position.set(0, 0, -4.8);
      stripe3.scale.set(0.72, 0.72, 0.8);
      group.add(stripe3);
    } else if (spec.hasStripe && spec.stripeMat) {
      var stripe = new THREE.Mesh(G.stripe, spec.stripeMat);
      stripe.position.set(0, 0, 1.5);
      group.add(stripe);
    }

    // 2. Eyes
    var leftEye = new THREE.Mesh(G.eye, spec.eyeWhiteMat);
    leftEye.position.set(2.8, 1.2, 6.5);
    var leftPupil = new THREE.Mesh(G.pupil, spec.eyePupilMat);
    leftPupil.position.set(0.6, 0, 0.9);
    leftEye.add(leftPupil);
    group.add(leftEye);

    var rightEye = new THREE.Mesh(G.eye, spec.eyeWhiteMat);
    rightEye.position.set(-2.8, 1.2, 6.5);
    var rightPupil = new THREE.Mesh(G.pupil, spec.eyePupilMat);
    rightPupil.position.set(-0.6, 0, 0.9);
    rightEye.add(rightPupil);
    group.add(rightEye);

    // 3. Dorsal Fin
    var dorsal = new THREE.Mesh(G.dorsal, spec.finMat);
    dorsal.position.set(0, 7.2, -1);
    dorsal.rotation.set(-0.35, 0, 0);
    group.add(dorsal);

    // 4. Fluttering Pectoral Fins
    var leftPec = new THREE.Mesh(G.pec, spec.finMat);
    leftPec.position.set(3.2, -1.5, 2.5);
    leftPec.rotation.set(0.4, 0, -1.0);
    group.add(leftPec);

    var rightPec = new THREE.Mesh(G.pec, spec.finMat);
    rightPec.position.set(-3.2, -1.5, 2.5);
    rightPec.rotation.set(0.4, 0, 1.0);
    group.add(rightPec);

    // 5. Caudal Tail Fin
    var tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0, -9);

    var tailFin = new THREE.Mesh(G.tailFin, spec.finMat);
    tailFin.position.set(0, 0, -6);
    tailGroup.add(tailFin);

    group.add(tailGroup);

    group.userData = {
      tail: tailGroup,
      leftPec: leftPec,
      rightPec: rightPec
    };

    return group;
  },

  createMantaMesh: function () {
    var G = this.mantaGeoms;
    var M = this.mantaMats;
    var group = new THREE.Group();

    // Central diamond disc
    var body = new THREE.Mesh(G.body, M.back);
    group.add(body);

    var belly = new THREE.Mesh(G.body, M.belly);
    belly.scale.set(0.95, 0.95, 0.95);
    belly.position.set(0, -0.6, 0);
    group.add(belly);

    // Left Wing (Articulated for undulation)
    var wingLGroup = new THREE.Group();
    wingLGroup.position.set(-18, 0, 0);
    var wingL = new THREE.Mesh(G.wingL, M.back);
    wingLGroup.add(wingL);
    group.add(wingLGroup);

    // Right Wing (Articulated)
    var wingRGroup = new THREE.Group();
    wingRGroup.position.set(18, 0, 0);
    var wingR = new THREE.Mesh(G.wingR, M.back);
    wingRGroup.add(wingR);
    group.add(wingRGroup);

    // Forward Cephalic Horns
    var hornL = new THREE.Mesh(G.horn, M.back);
    hornL.position.set(-5, -0.5, 18);
    hornL.rotation.set(0.3, 0, -0.3);
    group.add(hornL);

    var hornR = new THREE.Mesh(G.horn, M.back);
    hornR.position.set(5, -0.5, 18);
    hornR.rotation.set(0.3, 0, 0.3);
    group.add(hornR);

    // Whip Tail
    var tail = new THREE.Mesh(G.tail, M.back);
    tail.position.set(0, 0, -32);
    group.add(tail);

    // Luminous Manta Wing Markings
    var markL = new THREE.Mesh(G.wingL, M.mark);
    markL.scale.set(0.4, 0.4, 0.4);
    markL.position.set(-10, 0.4, 3);
    group.add(markL);

    var markR = new THREE.Mesh(G.wingR, M.mark);
    markR.scale.set(0.4, 0.4, 0.4);
    markR.position.set(10, 0.4, 3);
    group.add(markR);

    group.userData = {
      wingL: wingLGroup,
      wingR: wingRGroup
    };

    return group;
  },

  createDolphinMesh: function () {
    var G = this.dolphinGeoms;
    var M = this.dolphinMats;
    var group = new THREE.Group();

    // Streamlined Torpedo Body
    var body = new THREE.Mesh(G.torso, M.back);
    group.add(body);

    // White Underbelly
    var belly = new THREE.Mesh(G.torso, M.belly);
    belly.scale.set(0.8, 0.5, 2.7);
    belly.position.set(0, -2.4, 0);
    group.add(belly);

    // Bottlenose Snout
    var snout = new THREE.Mesh(G.snout, M.back);
    snout.position.set(0, -1.2, 22);
    group.add(snout);

    // Swept Back Dorsal Fin
    var dorsal = new THREE.Mesh(G.dorsal, M.back);
    dorsal.position.set(0, 8.2, 2);
    group.add(dorsal);

    // Left Flipper
    var flipperL = new THREE.Mesh(G.flipper, M.back);
    flipperL.position.set(6.8, -2.5, 7);
    flipperL.rotation.set(0.4, 0, -1.1);
    group.add(flipperL);

    // Right Flipper
    var flipperR = new THREE.Mesh(G.flipper, M.back);
    flipperR.position.set(-6.8, -2.5, 7);
    flipperR.rotation.set(0.4, 0, 1.1);
    group.add(flipperR);

    // Horizontal Fluke Tail (Articulated up and down)
    var flukeGroup = new THREE.Group();
    flukeGroup.position.set(0, 0, -22);

    var fluke = new THREE.Mesh(G.fluke, M.back);
    fluke.position.set(0, 0, -6);
    flukeGroup.add(fluke);
    group.add(flukeGroup);

    // Eyes
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    var eyeGeom = new THREE.SphereGeometry(1.2, 6, 6);
    var eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(4.8, 1.5, 14);
    group.add(eyeL);

    var eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(-4.8, 1.5, 14);
    group.add(eyeR);

    group.userData = {
      fluke: flukeGroup,
      flipperL: flipperL,
      flipperR: flipperR
    };

    return group;
  },

  update: function (t) {
    var C = CF.CONFIG;
    var p = CF.Player;

    // 1. Update Schooling Fish (Clownfish, Blue Tangs, etc.)
    for (var i = 0; i < this.fish.length; i++) {
      var f = this.fish[i];
      var distToPlayer = CF.dist3D(f.x, f.y, f.z, p.x, p.y, p.z);

      f.burstTimer += 0.016;

      if (distToPlayer < 85) {
        var fleeYaw = Math.atan2(f.x - p.x, f.z - p.z);
        f.yaw = CF.lerpAngle(f.yaw, fleeYaw, 0.14);
        f.speed = f.baseSpeed * 2.5;
        f.roll = CF.lerp(f.roll, 0.35, 0.1);
      } else {
        var wanderTurn = Math.sin(t * 0.0012 + f.wag) * 0.028;
        f.yaw += wanderTurn;
        f.roll = CF.lerp(f.roll, -wanderTurn * 4.0, 0.08);

        var burst = Math.sin(f.burstTimer * 2.5 + f.wag);
        var currentBase = f.baseSpeed * (0.8 + 0.4 * Math.max(0, burst));
        f.speed = CF.lerp(f.speed, currentBase, 0.05);

        f.pitch = Math.sin(t * 0.0018 + f.wag) * 0.1;
      }

      var fwdX = Math.sin(f.yaw) * Math.cos(f.pitch);
      var fwdY = Math.sin(f.pitch);
      var fwdZ = Math.cos(f.yaw) * Math.cos(f.pitch);

      f.x += fwdX * f.speed;
      f.y += fwdY * f.speed;
      f.z += fwdZ * f.speed;

      if (Math.abs(f.x) > C.WORLD_HALF - 40) f.yaw = Math.PI - f.yaw;
      if (Math.abs(f.z) > C.WORLD_HALF - 40) f.yaw = -f.yaw;
      var floorY = CF.Render3D.getTerrainHeight(f.x, f.z) + 14;
      if (f.y < floorY || f.y > C.WORLD_SURFACE - 12) f.pitch = -f.pitch;

      if (f.mesh) {
        f.mesh.position.set(f.x, f.y, f.z);
        f.mesh.rotation.set(-f.pitch, f.yaw, f.roll, 'YXZ');

        var wagFreq = 0.016 + f.speed * 0.006;
        var wagAmp = 0.28 + f.speed * 0.08;
        if (f.tail) {
          f.tail.rotation.y = Math.sin(t * wagFreq + f.wag) * wagAmp;
        }

        if (f.leftPec && f.rightPec) {
          f.leftPec.rotation.z = -1.0 + Math.sin(t * 0.02 + f.wag) * 0.25;
          f.rightPec.rotation.z = 1.0 - Math.sin(t * 0.02 + f.wag) * 0.25;
        }
      }
    }

    // 2. Update Majestic Manta Rays (Rhythmic Wing Flaps & Wide Ocean Sweeps)
    for (var m = 0; m < this.mantas.length; m++) {
      var mt = this.mantas[m];

      // Smooth wide circular cruising
      mt.yaw += Math.sin(t * 0.0006 + mt.phase) * 0.012;
      mt.pitch = Math.sin(t * 0.0014 + mt.phase) * 0.08;
      mt.roll = CF.lerp(mt.roll, -Math.sin(t * 0.0006 + mt.phase) * 0.25, 0.05);

      var mfwdX = Math.sin(mt.yaw) * Math.cos(mt.pitch);
      var mfwdY = Math.sin(mt.pitch);
      var mfwdZ = Math.cos(mt.yaw) * Math.cos(mt.pitch);

      mt.x += mfwdX * mt.speed;
      mt.y += mfwdY * mt.speed;
      mt.z += mfwdZ * mt.speed;

      if (Math.abs(mt.x) > C.WORLD_HALF - 80) mt.yaw = Math.PI - mt.yaw;
      if (Math.abs(mt.z) > C.WORLD_HALF - 80) mt.yaw = -mt.yaw;
      var mFloor = CF.Render3D.getTerrainHeight(mt.x, mt.z) + 60;
      if (mt.y < mFloor || mt.y > C.WORLD_SURFACE - 15) mt.pitch = -mt.pitch;

      if (mt.mesh) {
        mt.mesh.position.set(mt.x, mt.y, mt.z);
        mt.mesh.rotation.set(-mt.pitch, mt.yaw, mt.roll, 'YXZ');

        // Graceful undulating wing flaps
        var flap = Math.sin(t * 0.003 + mt.phase);
        if (mt.wingL) mt.wingL.rotation.z = flap * 0.38;
        if (mt.wingR) mt.wingR.rotation.z = -flap * 0.38;
      }
    }

    // 3. Update Playful Dolphins (Up & Down Fluke Motion & Breaching)
    for (var d = 0; d < this.dolphins.length; d++) {
      var dp = this.dolphins[d];

      // Playful fluid swimming
      dp.yaw += Math.sin(t * 0.001 + dp.phase) * 0.018;
      dp.pitch = Math.sin(t * 0.003 + dp.phase) * 0.16;
      dp.roll = CF.lerp(dp.roll, -Math.sin(t * 0.001 + dp.phase) * 0.3, 0.06);

      var dfwdX = Math.sin(dp.yaw) * Math.cos(dp.pitch);
      var dfwdY = Math.sin(dp.pitch);
      var dfwdZ = Math.cos(dp.yaw) * Math.cos(dp.pitch);

      dp.x += dfwdX * dp.speed;
      dp.y += dfwdY * dp.speed;
      dp.z += dfwdZ * dp.speed;

      if (Math.abs(dp.x) > C.WORLD_HALF - 70) dp.yaw = Math.PI - dp.yaw;
      if (Math.abs(dp.z) > C.WORLD_HALF - 70) dp.yaw = -dp.yaw;
      var dFloor = CF.Render3D.getTerrainHeight(dp.x, dp.z) + 40;
      if (dp.y < dFloor || dp.y > C.WORLD_SURFACE - 10) dp.pitch = -dp.pitch;

      if (dp.mesh) {
        dp.mesh.position.set(dp.x, dp.y, dp.z);
        dp.mesh.rotation.set(-dp.pitch, dp.yaw, dp.roll, 'YXZ');

        // Dorso-ventral fluke tail undulation (up and down)
        if (dp.fluke) {
          dp.fluke.rotation.x = Math.sin(t * 0.007 + dp.phase) * 0.36;
        }

        if (dp.flipperL && dp.flipperR) {
          dp.flipperL.rotation.z = -1.1 + Math.sin(t * 0.003 + dp.phase) * 0.15;
          dp.flipperR.rotation.z = 1.1 - Math.sin(t * 0.003 + dp.phase) * 0.15;
        }
      }
    }

    // 4. Update Bioluminescent Jellyfish
    for (var j = 0; j < this.jellyfish.length; j++) {
      var jf = this.jellyfish[j];
      var pulse = Math.sin(t * 0.0028 + jf.phase);
      var pulseScaleY = 1.0 + pulse * 0.32;
      var pulseScaleXZ = 1.0 - pulse * 0.18;

      jf.y += jf.vy * (1.2 + pulse * 0.95);
      if (jf.y > C.WORLD_SURFACE - 20) {
        jf.y = C.WORLD_FLOOR + 50;
      }

      if (jf.mesh) {
        jf.mesh.position.set(jf.x, jf.y, jf.z);
        jf.mesh.scale.set(pulseScaleXZ, pulseScaleY, pulseScaleXZ);
      }
    }
  }
};
