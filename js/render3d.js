window.CF = window.CF || {};

CF.Render3D = {
  scene: null,
  camera: null,
  renderer: null,
  bubbles: null,
  marineSnow: null,
  particles: [],
  kelpBlades: [],
  surfaceShips: [],
  heroCamTimer: 0,
  terrainGeom: null,
  clock: 0,
  cameraMode: 'third', // 'third', 'first', or 'birdsEye'

  triggerHeroCam: function (dur) {
    this.heroCamTimer = dur || 3.2;
  },

  toggleCameraMode: function () {
    if (this.cameraMode === 'third') {
      this.cameraMode = 'first';
    } else if (this.cameraMode === 'first') {
      this.cameraMode = 'birdsEye';
    } else {
      this.cameraMode = 'third';
    }

    if (CF.Player && CF.Player.setFirstPerson) {
      CF.Player.setFirstPerson(this.cameraMode === 'first');
    }
    if (CF.HUD && CF.HUD.updateView) {
      CF.HUD.updateView(this.cameraMode);
    }
  },

  resetCamera: function () {
    if (CF.Player && CF.Player.mesh && this.camera) {
      var pm = CF.Player.mesh;
      var forward = new THREE.Vector3(0, 0, 1).applyEuler(pm.rotation);
      var up = new THREE.Vector3(0, 1, 0).applyEuler(pm.rotation);
      var right = new THREE.Vector3(1, 0, 0).applyEuler(pm.rotation);
      var camTarget = pm.position.clone()
        .sub(forward.clone().multiplyScalar(140))
        .add(right.clone().multiplyScalar(30))
        .add(up.clone().multiplyScalar(50));
      this.camera.position.copy(camTarget);
      var lookTarget = pm.position.clone().add(forward.clone().multiplyScalar(70));
      this.camera.lookAt(lookTarget);
    }
  },

  init: function () {
    var C = CF.CONFIG;
    var canvas = document.getElementById('game');

    this.scene = new THREE.Scene();

    // Crystal-clear tropical Caribbean azure ocean with vast visibility
    var oceanColor = 0x0c7da8;
    this.scene.background = new THREE.Color(oceanColor);
    // Push fog way back: perfectly crystal clear for 1400m, soft horizon fade up to 5500m
    this.scene.fog = new THREE.Fog(oceanColor, 1400, 5500);

    // 65 degree field of view for panoramic open ocean
    this.camera = new THREE.PerspectiveCamera(65, C.VIEW_W / C.VIEW_H, 1, 6000);

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        powerPreference: 'default'
      });
      this.renderer.setSize(C.VIEW_W, C.VIEW_H);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    } catch (err) {
      console.error('WebGLRenderer initialization failed:', err);
      var hint = document.getElementById('hint');
      if (hint) {
        hint.innerHTML = '<span style="color:#ff6666;font-weight:bold;">WebGL could not initialize. Please verify hardware acceleration in browser settings.</span>';
      }
      return;
    }

    this.setupLighting();
    this.buildTerrain();
    this.buildWaterSurface();
    this.buildSkyAndSun();
    this.buildSurfaceShips();
    this.buildKelpForest();
    this.buildReefsAndCorals();
    this.buildBubbleSystem();
    this.buildMarineSnow();
  },

  setupLighting: function () {
    // Balanced warm-white ambient fill so orange, red, pink, and yellow retain their vivid true colors!
    var ambient = new THREE.AmbientLight(0xe8f4fc, 1.4);
    this.scene.add(ambient);

    // Warm tropical sunlight from above
    var sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    sunLight.position.set(200, 700, 150);
    this.scene.add(sunLight);

    // Aquamarine upward bounce light from the reef floor
    var bounceLight = new THREE.DirectionalLight(0x28bad8, 0.7);
    bounceLight.position.set(-150, -500, -150);
    this.scene.add(bounceLight);
  },

  getTerrainHeight: function (x, z) {
    var C = CF.CONFIG;
    var base = C.WORLD_FLOOR; // -550
    // Central coral atoll plateau around spawn (r < 480m) elevates seafloor to ~ -175m for lush coral viewing
    var dCenter = Math.sqrt(x * x + z * z);
    if (dCenter < 480) {
      var p = 1 - (dCenter / 480);
      var plateau = p * p * (3 - 2 * p); // smoothstep
      base += plateau * 365;
    }
    var h = base +
      Math.sin(x * 0.002) * 45 +
      Math.cos(z * 0.0025) * 35 +
      Math.sin((x + z) * 0.004) * 20;
    return h;
  },

  buildTerrain: function () {
    var C = CF.CONFIG;
    var geom = new THREE.PlaneGeometry(C.WORLD_SIZE + 1000, C.WORLD_SIZE + 1000, 56, 56);
    geom.rotateX(-Math.PI / 2);

    var pos = geom.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i);
      var pz = pos.getZ(i);
      pos.setY(i, this.getTerrainHeight(px, pz));
    }
    geom.computeVertexNormals();

    // Vibrant tropical sandy turquoise reef floor with contrast
    var mat = new THREE.MeshLambertMaterial({
      color: 0x1d7b82,
      emissive: 0x05282c
    });

    var mesh = new THREE.Mesh(geom, mat);
    this.scene.add(mesh);
    this.terrainGeom = geom;
  },

  buildWaterSurface: function () {
    var C = CF.CONFIG;
    var geom = new THREE.PlaneGeometry(C.WORLD_SIZE + 1000, C.WORLD_SIZE + 1000, 24, 24);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, C.WORLD_SURFACE, 0);

    var mat = new THREE.MeshBasicMaterial({
      color: 0x5de0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });

    var surface = new THREE.Mesh(geom, mat);
    this.scene.add(surface);
  },

  buildSkyAndSun: function () {
    var C = CF.CONFIG;
    // 1. Radiant Cartoon Sun in the open sky
    var sunGeom = new THREE.SphereGeometry(65, 16, 16);
    var sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4b8 });
    var sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.set(400, 680, 250);
    this.scene.add(sunMesh);

    var haloGeom = new THREE.SphereGeometry(110, 16, 16);
    var haloMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.28 });
    var haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.position.copy(sunMesh.position);
    this.scene.add(haloMesh);

    // 2. Fluffy Stylized Low-Poly Clouds scattered across the upper atmosphere
    var cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x223344 });
    var sphereGeom = new THREE.SphereGeometry(1, 8, 8);

    for (var c = 0; c < 14; c++) {
      var cloudGroup = new THREE.Group();
      var cx = CF.rand(-C.WORLD_HALF + 300, C.WORLD_HALF - 300);
      var cz = CF.rand(-C.WORLD_HALF + 300, C.WORLD_HALF - 300);
      var cy = CF.rand(240, 360);

      var puffCount = CF.randInt(4, 7);
      for (var p = 0; p < puffCount; p++) {
        var puff = new THREE.Mesh(sphereGeom, cloudMat);
        var pSize = CF.rand(25, 48);
        puff.scale.set(pSize * 1.3, pSize * 0.75, pSize);
        puff.position.set((p - puffCount / 2) * 26 + CF.rand(-10, 10), CF.rand(-6, 8), CF.rand(-12, 12));
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(cx, cy, cz);
      this.scene.add(cloudGroup);
    }
  },

  buildSurfaceShips: function () {
    this.surfaceShips = [];
    var scene = this.scene;
    var C = CF.CONFIG;
    var surfaceY = C.WORLD_SURFACE; // 80

    // 1. Grand Royal Galleon "Sea Queen"
    var galleon = new THREE.Group();
    var woodDark = new THREE.MeshLambertMaterial({ color: 0x4a2c11 });
    var woodDeck = new THREE.MeshLambertMaterial({ color: 0xc49a6c });
    var goldTrim = new THREE.MeshLambertMaterial({ color: 0xdfb135 });
    var sailMat = new THREE.MeshLambertMaterial({ color: 0xfdfaf0, side: THREE.DoubleSide });
    var redFlag = new THREE.MeshLambertMaterial({ color: 0xdd2233 });

    // Hull (lower hull sits partly in water, upper hull reaches y+16)
    var hullGeom = new THREE.CylinderGeometry(14, 18, 70, 8);
    hullGeom.rotateX(Math.PI / 2);
    hullGeom.scale(1.1, 0.7, 1.25);
    var hull = new THREE.Mesh(hullGeom, woodDark);
    hull.position.set(0, -2, 0);
    galleon.add(hull);

    // Deck
    var deckGeom = new THREE.BoxGeometry(26, 2, 74);
    var deck = new THREE.Mesh(deckGeom, woodDeck);
    deck.position.set(0, 7, 0);
    galleon.add(deck);

    // Stern Castle (quarterdeck at back)
    var sternGeom = new THREE.BoxGeometry(24, 14, 22);
    var stern = new THREE.Mesh(sternGeom, woodDark);
    stern.position.set(0, 14, -26);
    galleon.add(stern);

    // Stern gold gallery
    var galGeom = new THREE.BoxGeometry(20, 6, 2);
    var gallery = new THREE.Mesh(galGeom, goldTrim);
    gallery.position.set(0, 15, -37.5);
    galleon.add(gallery);

    // Bowsprit pole at front
    var bowGeom = new THREE.CylinderGeometry(0.8, 1.6, 32, 6);
    bowGeom.rotateX(Math.PI / 3);
    var bowsprit = new THREE.Mesh(bowGeom, woodDark);
    bowsprit.position.set(0, 14, 45);
    galleon.add(bowsprit);

    // 2 Tall Masts with Billowing Square Sails
    var mastGeom1 = new THREE.CylinderGeometry(1.4, 2.2, 95, 8);
    var mast1 = new THREE.Mesh(mastGeom1, woodDark);
    mast1.position.set(0, 52, 6);
    galleon.add(mast1);

    var mastGeom2 = new THREE.CylinderGeometry(1.2, 1.8, 80, 8);
    var mast2 = new THREE.Mesh(mastGeom2, woodDark);
    mast2.position.set(0, 46, -18);
    galleon.add(mast2);

    // Main Yardarms & Billowing Sails
    var sailGeom1 = new THREE.PlaneGeometry(38, 28, 4, 4);
    var pos1 = sailGeom1.attributes.position;
    for (var si = 0; si < pos1.count; si++) {
      var sz = Math.sin((pos1.getY(si) / 28 + 0.5) * Math.PI) * 4.5;
      pos1.setZ(si, sz);
    }
    sailGeom1.computeVertexNormals();

    var sail1 = new THREE.Mesh(sailGeom1, sailMat);
    sail1.position.set(0, 58, 6);
    galleon.add(sail1);

    var sailGeom2 = new THREE.PlaneGeometry(30, 22, 4, 4);
    var sail2 = new THREE.Mesh(sailGeom2, sailMat);
    sail2.position.set(0, 50, -18);
    galleon.add(sail2);

    // Crow's Nest Lookout Barrel on Main Mast
    var nestGeom = new THREE.CylinderGeometry(4.5, 3.8, 6, 8, 1, true);
    var nest = new THREE.Mesh(nestGeom, woodDark);
    nest.position.set(0, 85, 6);
    galleon.add(nest);

    // Royal flag at mast tip
    var flagGeom = new THREE.PlaneGeometry(10, 6);
    var flag = new THREE.Mesh(flagGeom, redFlag);
    flag.position.set(5, 98, 6);
    galleon.add(flag);

    galleon.position.set(-190, surfaceY, 130);
    galleon.rotation.y = 0.45;
    scene.add(galleon);
    this.surfaceShips.push({ mesh: galleon, baseRotY: 0.45, bobPhase: 0 });

    // 2. Coastal Fishing Trawler "Ocean Explorer"
    var trawler = new THREE.Group();
    var hullRed = new THREE.MeshLambertMaterial({ color: 0xd62828 });
    var cabinWhite = new THREE.MeshLambertMaterial({ color: 0xf4f7f6 });
    var glassCyan = new THREE.MeshLambertMaterial({ color: 0x48cae4 });

    var tHullGeom = new THREE.BoxGeometry(22, 14, 56);
    var tHull = new THREE.Mesh(tHullGeom, hullRed);
    tHull.position.set(0, 2, 0);
    trawler.add(tHull);

    var cabinGeom = new THREE.BoxGeometry(16, 12, 18);
    var cabin = new THREE.Mesh(cabinGeom, cabinWhite);
    cabin.position.set(0, 14, 6);
    trawler.add(cabin);

    var tWinGeom = new THREE.BoxGeometry(14, 4, 1);
    var tWin = new THREE.Mesh(tWinGeom, glassCyan);
    tWin.position.set(0, 15, 15.5);
    trawler.add(tWin);

    var craneMastGeom = new THREE.CylinderGeometry(0.8, 1.2, 42, 6);
    var craneMast = new THREE.Mesh(craneMastGeom, woodDark);
    craneMast.position.set(0, 26, -14);
    craneMast.rotation.x = -0.15;
    trawler.add(craneMast);

    trawler.position.set(320, surfaceY, -170);
    trawler.rotation.y = -1.1;
    scene.add(trawler);
    this.surfaceShips.push({ mesh: trawler, baseRotY: -1.1, bobPhase: 1.8 });

    // 3. Tropical Twin-Hull Sailing Catamaran
    var catamaran = new THREE.Group();
    var pontoonGeom = new THREE.CylinderGeometry(3.5, 4.0, 52, 8);
    pontoonGeom.rotateX(Math.PI / 2);
    var pontoonMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var pL = new THREE.Mesh(pontoonGeom, pontoonMat);
    pL.position.set(12, 1, 0);
    catamaran.add(pL);
    var pR = new THREE.Mesh(pontoonGeom, pontoonMat);
    pR.position.set(-12, 1, 0);
    catamaran.add(pR);

    var cDeck = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 34), woodDeck);
    cDeck.position.set(0, 4, 0);
    catamaran.add(cDeck);

    var cMast = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 58, 6), woodDark);
    cMast.position.set(0, 31, 2);
    catamaran.add(cMast);

    var cSailGeom = new THREE.BufferGeometry();
    var cSailVertices = new Float32Array([
      0, 56, 2,
      0, 8, 2,
      0, 8, -22
    ]);
    cSailGeom.setAttribute('position', new THREE.BufferAttribute(cSailVertices, 3));
    cSailGeom.computeVertexNormals();
    var cSail = new THREE.Mesh(cSailGeom, new THREE.MeshLambertMaterial({ color: 0x00f0ff, side: THREE.DoubleSide }));
    catamaran.add(cSail);

    catamaran.position.set(150, surfaceY, 390);
    catamaran.rotation.y = 1.6;
    scene.add(catamaran);
    this.surfaceShips.push({ mesh: catamaran, baseRotY: 1.6, bobPhase: 3.2 });
  },

  buildKelpForest: function () {
    var C = CF.CONFIG;
    this.kelpBlades = [];

    // Shared high-performance kelp blade geometry
    var kelpGeom = new THREE.CylinderGeometry(0.8, 3.2, 110, 5, 3);
    kelpGeom.translate(0, 55, 0); // bottom pivot

    var kelpMat1 = new THREE.MeshLambertMaterial({ color: 0x27b85c, emissive: 0x062812 });
    var kelpMat2 = new THREE.MeshLambertMaterial({ color: 0x1b9247, emissive: 0x041c0c });

    for (var i = 0; i < C.SEAWEED_COUNT; i++) {
      var x = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      var z = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      // Keep clear swimming corridor directly in front of spawn
      if (Math.abs(x) < 50 && z > 0 && z < 180) {
        x = (x >= 0 ? 1 : -1) * CF.rand(65, 130);
      }
      var y = this.getTerrainHeight(x, z);
      var heightScale = CF.rand(0.7, 1.3);

      var mesh = new THREE.Mesh(kelpGeom, (i % 2 === 0) ? kelpMat1 : kelpMat2);
      mesh.position.set(x, y, z);
      mesh.scale.set(1, heightScale, 1);
      mesh.rotation.y = CF.rand(0, Math.PI * 2);
      this.scene.add(mesh);

      this.kelpBlades.push({
        mesh: mesh,
        phase: CF.rand(0, Math.PI * 2)
      });
    }
  },

  swayingCorals: [],

  buildReefsAndCorals: function () {
    var C = CF.CONFIG;
    this.swayingCorals = [];

    // 1. Shared Rock Geometries & Materials
    var rockGeom1 = new THREE.DodecahedronGeometry(1, 1);
    var rockGeom2 = new THREE.DodecahedronGeometry(1, 0);
    var rockMat1 = new THREE.MeshLambertMaterial({ color: 0x44555f, emissive: 0x0c161a });
    var rockMat2 = new THREE.MeshLambertMaterial({ color: 0x323f47, emissive: 0x081014 });

    for (var r = 0; r < C.ROCK_COUNT; r++) {
      // Natural rocky ridges flanking the reef corridor to the left and right
      var rx = (r < 6) ? ((r % 2 === 0 ? 1 : -1) * CF.rand(85, 150)) : CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      var rz = (r < 6) ? CF.rand(70, 180) : CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      var ry = this.getTerrainHeight(rx, rz);
      var radius = CF.rand(16, 38);

      var rock = new THREE.Mesh((r % 2 === 0) ? rockGeom1 : rockGeom2, (r % 2 === 0) ? rockMat1 : rockMat2);
      rock.position.set(rx, ry + radius * 0.4, rz);
      rock.rotation.set(CF.rand(0, 3), CF.rand(0, 3), CF.rand(0, 3));
      rock.scale.set(radius * 1.2, radius * 0.7, radius * 1.1);
      this.scene.add(rock);
    }

    // 2. Shared Coral Geometries & Materials
    // Branching Coral Geoms
    var branchGeom = new THREE.CylinderGeometry(1, 1.7, 1, 6);
    branchGeom.translate(0, 0.5, 0);
    var tipGeom = new THREE.SphereGeometry(1, 6, 6);

    // Brain Coral Geoms (Domed boulder with corrugated ripple rings)
    var brainDomeGeom = new THREE.SphereGeometry(1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    var brainRingGeom1 = new THREE.TorusGeometry(0.72, 0.12, 4, 14);
    brainRingGeom1.rotateX(Math.PI / 2);
    var brainRingGeom2 = new THREE.TorusGeometry(0.42, 0.1, 4, 10);
    brainRingGeom2.rotateX(Math.PI / 2);

    // Mushroom Coral Geoms (Flat disc with radial ridges)
    var mushroomDiscGeom = new THREE.CylinderGeometry(1, 0.88, 0.22, 16);
    var mushroomSlitGeom = new THREE.TorusGeometry(0.26, 0.08, 4, 8);
    mushroomSlitGeom.scale(1.8, 0.6, 1);
    mushroomSlitGeom.rotateX(Math.PI / 2);

    // Hammer Coral Geoms (Stalk + T-shaped anchor hammer cap)
    var hammerStalkGeom = new THREE.CylinderGeometry(0.35, 0.55, 1, 6);
    hammerStalkGeom.translate(0, 0.5, 0);
    var hammerHeadGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.3, 6);
    hammerHeadGeom.rotateZ(Math.PI / 2);

    // Torch Coral Geoms (Slender flowing tentacle + luminous bulb tip)
    var torchTentacleGeom = new THREE.CylinderGeometry(0.2, 0.38, 1, 5);
    torchTentacleGeom.translate(0, 0.5, 0);
    var torchBulbGeom = new THREE.SphereGeometry(0.42, 8, 8);

    // Coral Color Palettes
    var brainColors = [0x70e000, 0xa7c957, 0xff5c8a, 0xe0a96d, 0x06d6a0];
    var mushroomColors = [0x9d4edd, 0xff007f, 0x00f5d4, 0xff9e00, 0xe056fd];
    var hammerColors = [
      { stalk: 0x228b22, head: 0x39ff14 },
      { stalk: 0x5a189a, head: 0xffd166 },
      { stalk: 0x0077b6, head: 0x90e0ef }
    ];
    var torchColors = [
      { stalk: 0x1d3557, tip: 0xccff00 },
      { stalk: 0x3d0066, tip: 0xff007f },
      { stalk: 0x005f73, tip: 0x00f5d4 }
    ];

    // Coral Branch Materials
    var coralMats = CF.CORAL_COLORS.map(function (hex) {
      var col = new THREE.Color(hex);
      return {
        branch: new THREE.MeshLambertMaterial({ color: col, emissive: col.clone().multiplyScalar(0.4) }),
        tip: new THREE.MeshBasicMaterial({ color: col })
      };
    });

    // BUILD BRAIN CORALS (Corrugated domes)
    for (var bc = 0; bc < (C.BRAIN_CORAL_COUNT || 22); bc++) {
      var bx, bz;
      if (bc === 0) { bx = -25; bz = 100; }
      else if (bc === 1) { bx = 32; bz = 115; }
      else if (bc === 2) { bx = -50; bz = 145; }
      else if (bc === 3) { bx = 50; bz = 155; }
      else {
        bx = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
        bz = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      }
      var by = this.getTerrainHeight(bx, bz);
      var bSize = CF.rand(16, 26);

      var bCol = new THREE.Color(CF.pick(brainColors));
      var bMat = new THREE.MeshLambertMaterial({ color: bCol, emissive: bCol.clone().multiplyScalar(0.35) });
      var bRingMat = new THREE.MeshBasicMaterial({ color: bCol.clone().multiplyScalar(1.25) });

      var brainGroup = new THREE.Group();
      brainGroup.position.set(bx, by, bz);

      var dome = new THREE.Mesh(brainDomeGeom, bMat);
      dome.scale.set(bSize, bSize * 0.72, bSize);
      brainGroup.add(dome);

      var ring1 = new THREE.Mesh(brainRingGeom1, bRingMat);
      ring1.scale.set(bSize, bSize, bSize);
      ring1.position.set(0, bSize * 0.28, 0);
      brainGroup.add(ring1);

      var ring2 = new THREE.Mesh(brainRingGeom2, bRingMat);
      ring2.scale.set(bSize, bSize, bSize);
      ring2.position.set(0, bSize * 0.52, 0);
      brainGroup.add(ring2);

      this.scene.add(brainGroup);
    }

    // BUILD MUSHROOM CORALS (Solitary flat disc corals)
    for (var mc = 0; mc < (C.MUSHROOM_CORAL_COUNT || 28); mc++) {
      var mx, mz;
      if (mc === 0) { mx = -15; mz = 90; }
      else if (mc === 1) { mx = 20; mz = 95; }
      else if (mc === 2) { mx = -40; mz = 110; }
      else if (mc === 3) { mx = 45; mz = 120; }
      else {
        mx = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
        mz = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      }
      var my = this.getTerrainHeight(mx, mz);
      var mSize = CF.rand(12, 22);

      var mCol = new THREE.Color(CF.pick(mushroomColors));
      var mMat = new THREE.MeshLambertMaterial({ color: mCol, emissive: mCol.clone().multiplyScalar(0.4) });
      var mSlitMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      var mushGroup = new THREE.Group();
      mushGroup.position.set(mx, my + 1, mz);
      mushGroup.rotation.set(CF.rand(-0.2, 0.2), CF.rand(0, Math.PI * 2), CF.rand(-0.2, 0.2));

      var disc = new THREE.Mesh(mushroomDiscGeom, mMat);
      disc.scale.set(mSize, mSize * 0.28, mSize * 0.92);
      mushGroup.add(disc);

      var slit = new THREE.Mesh(mushroomSlitGeom, mSlitMat);
      slit.scale.set(mSize, mSize, mSize);
      slit.position.set(0, mSize * 0.14, 0);
      mushGroup.add(slit);

      this.scene.add(mushGroup);
    }

    // BUILD HAMMER CORALS (T-shaped anchor heads)
    for (var hc = 0; hc < (C.HAMMER_CORAL_COUNT || 24); hc++) {
      var hx, hz;
      if (hc === 0) { hx = -35; hz = 120; }
      else if (hc === 1) { hx = 10; hz = 125; }
      else if (hc === 2) { hx = -20; hz = 155; }
      else if (hc === 3) { hx = 35; hz = 160; }
      else {
        hx = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
        hz = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      }
      var hy = this.getTerrainHeight(hx, hz);
      var hSize = CF.rand(14, 22);
      var hPair = CF.pick(hammerColors);

      var hStalkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(hPair.stalk) });
      var hHeadMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hPair.head) });

      var hammerGroup = new THREE.Group();
      hammerGroup.position.set(hx, hy, hz);

      var hBranches = CF.randInt(5, 8);
      for (var hb = 0; hb < hBranches; hb++) {
        var branchLen = hSize * CF.rand(0.7, 1.2);
        var branchHolder = new THREE.Group();
        branchHolder.position.set(CF.rand(-hSize * 0.35, hSize * 0.35), 0, CF.rand(-hSize * 0.35, hSize * 0.35));
        branchHolder.rotation.set(CF.rand(-0.2, 0.2), CF.rand(0, Math.PI * 2), CF.rand(-0.2, 0.2));

        var stalk = new THREE.Mesh(hammerStalkGeom, hStalkMat);
        stalk.scale.set(hSize * 0.2, branchLen, hSize * 0.2);
        branchHolder.add(stalk);

        var head = new THREE.Mesh(hammerHeadGeom, hHeadMat);
        head.scale.set(hSize * 0.26, hSize * 0.24, hSize * 0.52);
        head.position.set(0, branchLen, 0);
        branchHolder.add(head);

        hammerGroup.add(branchHolder);
      }

      this.scene.add(hammerGroup);
      this.swayingCorals.push({ mesh: hammerGroup, phase: CF.rand(0, Math.PI * 2) });
    }

    // BUILD TORCH CORALS (Slender tentacles with glowing torch bulb tips)
    for (var tc = 0; tc < (C.TORCH_CORAL_COUNT || 26); tc++) {
      var tx, tz;
      if (tc === 0) { tx = -5; tz = 80; }
      else if (tc === 1) { tx = 25; tz = 85; }
      else if (tc === 2) { tx = -30; tz = 105; }
      else if (tc === 3) { tx = 40; tz = 135; }
      else {
        tx = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
        tz = CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      }
      var ty = this.getTerrainHeight(tx, tz);
      var tSize = CF.rand(14, 24);
      var tPair = CF.pick(torchColors);

      var tStalkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(tPair.stalk) });
      var tBulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tPair.tip) });

      var torchGroup = new THREE.Group();
      torchGroup.position.set(tx, ty, tz);

      var tentCount = CF.randInt(6, 10);
      for (var tb = 0; tb < tentCount; tb++) {
        var tLen = tSize * CF.rand(0.8, 1.3);
        var tentHolder = new THREE.Group();
        tentHolder.position.set(CF.rand(-tSize * 0.3, tSize * 0.3), 0, CF.rand(-tSize * 0.3, tSize * 0.3));
        tentHolder.rotation.set(CF.rand(-0.22, 0.22), CF.rand(0, Math.PI * 2), CF.rand(-0.22, 0.22));

        var tent = new THREE.Mesh(torchTentacleGeom, tStalkMat);
        tent.scale.set(tSize * 0.18, tLen, tSize * 0.18);
        tentHolder.add(tent);

        var bulb = new THREE.Mesh(torchBulbGeom, tBulbMat);
        bulb.scale.set(tSize * 0.26, tSize * 0.26, tSize * 0.26);
        bulb.position.set(0, tLen, 0);
        tentHolder.add(bulb);

        torchGroup.add(tentHolder);
      }

      this.scene.add(torchGroup);
      this.swayingCorals.push({ mesh: torchGroup, phase: CF.rand(0, Math.PI * 2) });
    }

    // BUILD STAGHORN BRANCHING CORALS (Classic colorful reef clusters)
    for (var c = 0; c < C.CORAL_COUNT; c++) {
      var cx = (c < 5) ? CF.rand(-120, 120) : CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      var cz = (c < 5) ? CF.rand(70, 250) : CF.rand(-C.WORLD_HALF + 100, C.WORLD_HALF - 100);
      var cy = this.getTerrainHeight(cx, cz);
      var size = CF.rand(12, 22);
      var matPair = coralMats[c % coralMats.length];

      var coralGroup = new THREE.Group();
      coralGroup.position.set(cx, cy, cz);

      var branchCount = CF.randInt(4, 6);
      for (var b = 0; b < branchCount; b++) {
        var h = size * (0.8 + 0.4 * Math.random());
        var bHolder = new THREE.Group();
        bHolder.position.set(CF.rand(-size * 0.3, size * 0.3), 0, CF.rand(-size * 0.3, size * 0.3));
        bHolder.rotation.set(CF.rand(-0.25, 0.25), CF.rand(0, Math.PI * 2), CF.rand(-0.25, 0.25));

        var bmesh = new THREE.Mesh(branchGeom, matPair.branch);
        bmesh.scale.set(size * 0.15, h, size * 0.15);
        bHolder.add(bmesh);

        var tip = new THREE.Mesh(tipGeom, matPair.tip);
        tip.scale.set(size * 0.18, size * 0.18, size * 0.18);
        tip.position.set(0, h, 0);
        bHolder.add(tip);

        coralGroup.add(bHolder);
      }
      this.scene.add(coralGroup);
    }
  },

  buildBubbleSystem: function () {
    var C = CF.CONFIG;
    var count = 300;
    var geom = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var speeds = new Float32Array(count);
    var phases = new Float32Array(count);

    for (var i = 0; i < count; i++) {
      positions[i * 3] = CF.rand(-C.WORLD_HALF, C.WORLD_HALF);
      positions[i * 3 + 1] = CF.rand(C.WORLD_FLOOR, C.WORLD_SURFACE);
      positions[i * 3 + 2] = CF.rand(-C.WORLD_HALF, C.WORLD_HALF);
      speeds[i] = CF.rand(0.7, 2.2);
      phases[i] = CF.rand(0, Math.PI * 2);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(215, 245, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath(); ctx.arc(12, 12, 4, 0, Math.PI * 2); ctx.fill();

    var tex = new THREE.CanvasTexture(canvas);
    var mat = new THREE.PointsMaterial({
      size: 8.5,
      map: tex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.bubbles = {
      mesh: new THREE.Points(geom, mat),
      speeds: speeds,
      phases: phases,
      count: count
    };
    this.scene.add(this.bubbles.mesh);
  },

  buildMarineSnow: function () {
    var C = CF.CONFIG;
    var count = 350;
    var geom = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);

    for (var i = 0; i < count; i++) {
      positions[i * 3] = CF.rand(-C.WORLD_HALF, C.WORLD_HALF);
      positions[i * 3 + 1] = CF.rand(C.WORLD_FLOOR, C.WORLD_SURFACE);
      positions[i * 3 + 2] = CF.rand(-C.WORLD_HALF, C.WORLD_HALF);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      color: 0xa0ebff,
      size: 2.8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.marineSnow = new THREE.Points(geom, mat);
    this.scene.add(this.marineSnow);
  },

  burst: function (x, y, z, isExplosion) {
    var count = isExplosion ? 30 : 20;
    var col = isExplosion ? 0xff4d22 : 0xffdf55;

    var sharedSphere = new THREE.SphereGeometry(1, 4, 4);
    var sharedMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 1
    });

    for (var i = 0; i < count; i++) {
      var p = new THREE.Mesh(sharedSphere, sharedMat.clone());
      var scale = CF.rand(1.5, 3.5);
      p.scale.set(scale, scale, scale);
      p.position.set(x, y, z);

      var a1 = CF.rand(0, Math.PI * 2);
      var a2 = CF.rand(-Math.PI / 2, Math.PI / 2);
      var sp = CF.rand(1.5, isExplosion ? 6.5 : 4.2);

      this.particles.push({
        mesh: p,
        vx: Math.cos(a1) * Math.cos(a2) * sp,
        vy: Math.sin(a2) * sp,
        vz: Math.sin(a1) * Math.cos(a2) * sp,
        life: 1.0,
        decay: isExplosion ? 0.024 : 0.018
      });
      this.scene.add(p);
    }
  },

  splash: function (x, z, isLeap) {
    var count = isLeap ? 35 : 28;
    var splashSphere = new THREE.SphereGeometry(1, 4, 4);
    var splashMat = new THREE.MeshBasicMaterial({
      color: 0xebffff,
      transparent: true,
      opacity: 0.95
    });

    for (var i = 0; i < count; i++) {
      var p = new THREE.Mesh(splashSphere, splashMat.clone());
      var scale = CF.rand(1.8, 3.8);
      p.scale.set(scale, scale, scale);
      p.position.set(x + CF.rand(-10, 10), CF.CONFIG.WORLD_SURFACE + 2, z + CF.rand(-10, 10));

      var ang = CF.rand(0, Math.PI * 2);
      var sp = CF.rand(1.8, 4.6);
      var upSp = isLeap ? CF.rand(3.5, 7.0) : CF.rand(1.8, 4.2);

      this.particles.push({
        mesh: p,
        vx: Math.cos(ang) * sp,
        vy: upSp,
        vz: Math.sin(ang) * sp,
        life: 1.0,
        decay: 0.025
      });
      this.scene.add(p);
    }
  },

  update: function (dt, t) {
    var C = CF.CONFIG;
    this.clock = t;

    // Dynamic Camera FOV Kick during Turbo Boost or Jetstream Ride!
    if (this.camera) {
      var isThrilling = (CF.Player && (CF.Player.boostTimer > 0 || (CF.Thrills && CF.Thrills.activeJetstream)));
      var targetFov = isThrilling ? 76 : 65;
      if (Math.abs(this.camera.fov - targetFov) > 0.15) {
        this.camera.fov = CF.lerp(this.camera.fov, targetFov, 0.08);
        this.camera.updateProjectionMatrix();
      }
    }

    // Surface ships wave bobbing
    if (this.surfaceShips) {
      for (var sIdx = 0; sIdx < this.surfaceShips.length; sIdx++) {
        var sObj = this.surfaceShips[sIdx];
        sObj.mesh.position.y = C.WORLD_SURFACE + Math.sin(t * 0.0014 + sObj.bobPhase) * 1.6;
        sObj.mesh.rotation.z = Math.sin(t * 0.001 + sObj.bobPhase) * 0.04;
        sObj.mesh.rotation.x = Math.cos(t * 0.0012 + sObj.bobPhase) * 0.03;
      }
    }

    // Dynamic Sky & Fog transition between Deep Ocean and Sunny Atmosphere
    var isBreaching = (CF.Player && CF.Player.y > C.WORLD_SURFACE);
    var targetBgColor = isBreaching ? new THREE.Color(0x38bdf8) : new THREE.Color(0x0c7da8);
    var targetFogColor = isBreaching ? new THREE.Color(0x7dd3fc) : new THREE.Color(0x0c7da8);
    var targetFogNear = isBreaching ? 3200 : 1400;
    var targetFogFar = isBreaching ? 10000 : 5500;

    if (this.scene) {
      if (this.scene.background) {
        this.scene.background.lerp(targetBgColor, 0.08);
      }
      if (this.scene.fog) {
        this.scene.fog.color.lerp(targetFogColor, 0.08);
        this.scene.fog.near = CF.lerp(this.scene.fog.near, targetFogNear, 0.08);
        this.scene.fog.far = CF.lerp(this.scene.fog.far, targetFogFar, 0.08);
      }
    }

    // Kelp swaying
    for (var k = 0; k < this.kelpBlades.length; k++) {
      var kb = this.kelpBlades[k];
      kb.mesh.rotation.z = Math.sin(t * 0.0015 + kb.phase) * 0.12;
      kb.mesh.rotation.x = Math.cos(t * 0.0012 + kb.phase) * 0.1;
    }

    // Torch & Hammer coral gentle current swaying
    for (var sc = 0; sc < this.swayingCorals.length; sc++) {
      var cr = this.swayingCorals[sc];
      cr.mesh.rotation.z = Math.sin(t * 0.0018 + cr.phase) * 0.08;
      cr.mesh.rotation.x = Math.cos(t * 0.0014 + cr.phase) * 0.06;
    }

    // Bubbles rising
    if (this.bubbles) {
      var pos = this.bubbles.mesh.geometry.attributes.position;
      for (var i = 0; i < this.bubbles.count; i++) {
        var cy = pos.getY(i) + this.bubbles.speeds[i];
        if (cy > C.WORLD_SURFACE) {
          cy = C.WORLD_FLOOR + 10;
        }
        pos.setY(i, cy);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.0012 + this.bubbles.phases[i]) * 0.25);
      }
      pos.needsUpdate = true;
    }

    // Particles
    for (var pIdx = this.particles.length - 1; pIdx >= 0; pIdx--) {
      var pt = this.particles[pIdx];
      pt.mesh.position.x += pt.vx;
      pt.mesh.position.y += pt.vy;
      pt.mesh.position.z += pt.vz;
      pt.vx *= 0.94;
      pt.vy *= 0.94;
      pt.vz *= 0.94;
      pt.life -= pt.decay;
      pt.mesh.material.opacity = Math.max(0, pt.life);
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        if (pt.mesh.material) pt.mesh.material.dispose();
        this.particles.splice(pIdx, 1);
      }
    }

    // 3 Camera Modes: 1st Person, 3rd Person, and Bird's Eye View!
    if (CF.Player && CF.Player.mesh && this.camera) {
      var pm = CF.Player.mesh;
      var forward = new THREE.Vector3(0, 0, 1).applyEuler(pm.rotation);
      var up = new THREE.Vector3(0, 1, 0).applyEuler(pm.rotation);
      var right = new THREE.Vector3(1, 0, 0).applyEuler(pm.rotation);

      if (this.cameraMode === 'first') {
        // 1. First-Person View (Looking out from Catfish Eyes)
        var eyePos = pm.position.clone()
          .add(forward.clone().multiplyScalar(22))
          .add(up.clone().multiplyScalar(2));

        this.camera.position.copy(eyePos);
        var lookTarget = eyePos.clone().add(forward.clone().multiplyScalar(100));
        this.camera.lookAt(lookTarget);

      } else if (this.cameraMode === 'birdsEye') {
        // 2. Bird's Eye View (Grand High-Altitude Panoramic View)
        var birdPos = pm.position.clone()
          .sub(forward.clone().multiplyScalar(120))
          .add(new THREE.Vector3(0, 260, 0));

        this.camera.position.lerp(birdPos, 0.08);

        var birdLookTarget = pm.position.clone().add(forward.clone().multiplyScalar(50));
        this.camera.lookAt(birdLookTarget);

      } else {
        // 3. Third-Person View: Over-The-Shoulder View with Hero Cam & Sky Jump Views
        if (this.heroCamTimer > 0) {
          // Hero close-up showcasing catfish face & new accessory!
          this.heroCamTimer -= dt;
          var heroCamTarget = pm.position.clone()
            .add(forward.clone().multiplyScalar(95))
            .add(right.clone().multiplyScalar(35))
            .add(up.clone().multiplyScalar(22));
          this.camera.position.lerp(heroCamTarget, 0.1);
          var heroLook = pm.position.clone().add(forward.clone().multiplyScalar(8)).add(up.clone().multiplyScalar(4));
          this.camera.lookAt(heroLook);

        } else if (CF.Player && CF.Player.y > C.WORLD_SURFACE) {
          // Panoramic Airborne Breach Camera: pulls back & frames soaring jump with ship & sky!
          var skyCamTarget = pm.position.clone()
            .sub(forward.clone().multiplyScalar(190))
            .add(right.clone().multiplyScalar(35))
            .add(new THREE.Vector3(0, 20, 0));
          this.camera.position.lerp(skyCamTarget, 0.06);
          var skyLook = pm.position.clone().add(forward.clone().multiplyScalar(25));
          this.camera.lookAt(skyLook);

        } else {
          // Enhanced Three-Quarters Over-the-Shoulder View!
          // Catfish face, cat ears, and accessories (crown, pirate hat, mask, starfish) are prominently visible!
          var camTarget = pm.position.clone()
            .sub(forward.clone().multiplyScalar(138))
            .add(right.clone().multiplyScalar(30))
            .add(up.clone().multiplyScalar(52));

          this.camera.position.lerp(camTarget, 0.08);

          // Focus on the catfish's head so face & accessories are clearly in view!
          var lookTarget = pm.position.clone()
            .add(forward.clone().multiplyScalar(16))
            .add(up.clone().multiplyScalar(6));
          this.camera.lookAt(lookTarget);
        }
      }
    }
  },

  render: function () {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
};
