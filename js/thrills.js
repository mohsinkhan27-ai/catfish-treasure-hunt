window.CF = window.CF || {};

CF.Thrills = {
  rings: [],
  jetstreams: [],
  activeJetstream: null,
  activeJetstreamT: 0,
  boostLines: [],

  init: function () {
    this.buildRings();
    this.buildJetstreams();
    this.initSpeedLines();
  },

  reset: function () {
    this.activeJetstream = null;
    this.activeJetstreamT = 0;
    for (var i = 0; i < this.rings.length; i++) {
      this.rings[i].cooldown = 0;
      if (this.rings[i].mesh) this.rings[i].mesh.visible = true;
    }
  },

  buildRings: function () {
    var C = CF.CONFIG;
    var scene = CF.Render3D.scene;
    if (!scene) return;

    // 16 Scenic Speed Rings placed at fun navigation corridors
    var ringCoords = [
      // Northern Reef Slalom
      { x: -120, y: -65, z: 220, yaw: 0, pitch: 0 },
      { x: -180, y: -60, z: 420, yaw: 0.25, pitch: 0 },
      { x: -80,  y: -50, z: 620, yaw: -0.15, pitch: 0.1 },
      { x: 140,  y: -40, z: 780, yaw: 0.4, pitch: 0.15 },

      // High-speed Ocean Trench Highway
      { x: 300,  y: -140, z: 300, yaw: -0.5, pitch: -0.1 },
      { x: 550,  y: -180, z: 100, yaw: -0.8, pitch: -0.05 },
      { x: 750,  y: -170, z: -150, yaw: -1.2, pitch: 0 },
      { x: 650,  y: -130, z: -420, yaw: -1.6, pitch: 0.1 },

      // Southern Coral Archway
      { x: -350, y: -90, z: -250, yaw: 1.0, pitch: 0 },
      { x: -550, y: -100, z: -480, yaw: 0.7, pitch: -0.1 },
      { x: -750, y: -110, z: -700, yaw: 0.4, pitch: 0 },
      { x: -500, y: -70, z: -850, yaw: -0.3, pitch: 0.1 },

      // Ramp-Up Rings leading straight to Epic Surface Leaps!
      { x: -280, y: -45, z: -50, yaw: -0.4, pitch: 0.35 },
      { x: -380, y: 10,  z: 50,  yaw: -0.4, pitch: 0.45 },
      { x: 260,  y: -35, z: -220, yaw: 0.6, pitch: 0.35 },
      { x: 420,  y: 15,  z: -160, yaw: 0.6, pitch: 0.45 }
    ];

    var torusGeom = new THREE.TorusGeometry(20, 2.4, 10, 24);
    var orbGeom = new THREE.SphereGeometry(1.8, 8, 8);

    for (var i = 0; i < ringCoords.length; i++) {
      var rc = ringCoords[i];
      var group = new THREE.Group();

      var hueMat = new THREE.MeshLambertMaterial({
        color: (i >= 12) ? 0xffbb00 : 0x00f0ff,
        emissive: (i >= 12) ? 0x774400 : 0x006688
      });

      var torus = new THREE.Mesh(torusGeom, hueMat);
      group.add(torus);

      // Rotating orbit bubbles around each ring
      var orbs = [];
      var orbMat = new THREE.MeshBasicMaterial({ color: (i >= 12) ? 0xffea88 : 0xccffff });
      for (var o = 0; o < 6; o++) {
        var orb = new THREE.Mesh(orbGeom, orbMat);
        var ang = (o / 6) * Math.PI * 2;
        orb.position.set(Math.cos(ang) * 20, Math.sin(ang) * 20, 0);
        group.add(orb);
        orbs.push(orb);
      }

      group.position.set(rc.x, rc.y, rc.z);
      group.rotation.set(-rc.pitch, rc.yaw, 0, 'YXZ');
      scene.add(group);

      this.rings.push({
        x: rc.x,
        y: rc.y,
        z: rc.z,
        mesh: group,
        torus: torus,
        orbs: orbs,
        cooldown: 0,
        isJumpRamp: (i >= 12)
      });
    }
  },

  buildJetstreams: function () {
    var scene = CF.Render3D.scene;
    if (!scene) return;

    // 2 Grand Underwater Coaster Currents
    var streams = [
      {
        id: 'coral-coaster',
        name: 'Coral Highway Coaster',
        color: 0x2ae8ff,
        points: [
          new THREE.Vector3(-600, -85, -450),
          new THREE.Vector3(-250, -65, -720),
          new THREE.Vector3(380, -90, -560),
          new THREE.Vector3(720, -115, -40),
          new THREE.Vector3(560, -95, 480),
          new THREE.Vector3(60, -75, 680),
          new THREE.Vector3(-420, -70, 420),
          new THREE.Vector3(-600, -85, -450)
        ]
      },
      {
        id: 'deep-plunge',
        name: 'Abyssal Geyser Ride',
        color: 0x66ffcc,
        points: [
          new THREE.Vector3(450, -320, 350),
          new THREE.Vector3(120, -240, 150),
          new THREE.Vector3(-260, -170, -120),
          new THREE.Vector3(-520, -95, -280),
          new THREE.Vector3(-650, -30, -50),
          new THREE.Vector3(-480, 25, 220)
        ]
      }
    ];

    for (var s = 0; s < streams.length; s++) {
      var st = streams[s];
      var isClosed = (st.id === 'coral-coaster');
      var curve = new THREE.CatmullRomCurve3(st.points, isClosed, 'centripetal', 0.5);

      // Translucent spiraling current tube
      var tubeGeom = new THREE.TubeGeometry(curve, 90, 24, 8, isClosed);
      var tubeMat = new THREE.MeshBasicMaterial({
        color: st.color,
        transparent: true,
        opacity: 0.22,
        wireframe: true,
        side: THREE.DoubleSide
      });
      var tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
      scene.add(tubeMesh);

      // Glowing current chevron markers along path
      var markerGeom = new THREE.ConeGeometry(3.5, 9, 4);
      markerGeom.rotateX(Math.PI / 2);
      var markerMat = new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.75 });
      var markers = [];

      var markerCount = isClosed ? 24 : 16;
      for (var m = 0; m < markerCount; m++) {
        var tParam = m / markerCount;
        var p = curve.getPointAt(tParam);
        var tang = curve.getTangentAt(tParam);
        var cone = new THREE.Mesh(markerGeom, markerMat);
        cone.position.copy(p);
        cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tang);
        scene.add(cone);
        markers.push({ mesh: cone, t: tParam, speed: 0.003 });
      }

      this.jetstreams.push({
        id: st.id,
        name: st.name,
        curve: curve,
        isClosed: isClosed,
        tubeMesh: tubeMesh,
        markers: markers,
        length: curve.getLength()
      });
    }
  },

  initSpeedLines: function () {
    this.boostLines = [];
    var count = 30;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      this.boostLines.push({
        angle: angle,
        len: CF.rand(60, 160),
        dist: CF.rand(180, 360),
        speed: CF.rand(8, 16),
        width: CF.rand(1.5, 3.5),
        alpha: CF.rand(0.3, 0.8)
      });
    }
  },

  update: function (dt, t) {
    var p = CF.Player;
    if (!p) return;

    // 1. Update Speed Rings
    for (var i = 0; i < this.rings.length; i++) {
      var r = this.rings[i];
      if (r.cooldown > 0) {
        r.cooldown -= dt;
        if (r.cooldown <= 0) {
          r.mesh.visible = true;
          r.torus.scale.set(1, 1, 1);
        }
      }

      if (r.mesh.visible) {
        r.mesh.rotation.z += 0.015;
        // Orbit bubbles spin
        for (var o = 0; o < r.orbs.length; o++) {
          var ang = (o / r.orbs.length) * Math.PI * 2 + t * 0.004;
          r.orbs[o].position.set(Math.cos(ang) * 20, Math.sin(ang) * 20, 0);
        }

        // Collision check with player
        var dist = CF.dist3D(p.x, p.y, p.z, r.x, r.y, r.z);
        if (dist < 26 && r.cooldown <= 0) {
          // ACTIVATE TURBO BOOST!
          p.boostTimer = 3.2;
          p.speed = CF.CONFIG.PLAYER_MAX_SPEED * 2.3;
          if (r.isJumpRamp) {
            p.vy = Math.max(p.vy, 4.8);
          }

          CF.Audio.boost();
          CF.Render3D.burst(r.x, r.y, r.z, false);
          r.cooldown = 4.0;
          r.mesh.visible = false;
        }
      }
    }

    // 2. Update Jetstreams & Riding Logic
    var wasInJetstream = (this.activeJetstream !== null);
    var ridingNow = false;

    for (var s = 0; s < this.jetstreams.length; s++) {
      var js = this.jetstreams[s];

      // Animate flowing chevron markers
      for (var m = 0; m < js.markers.length; m++) {
        var mk = js.markers[m];
        mk.t = (mk.t + mk.speed) % 1.0;
        var pt = js.curve.getPointAt(mk.t);
        var tg = js.curve.getTangentAt(mk.t);
        mk.mesh.position.copy(pt);
        mk.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tg);
      }

      // Check if player is near stream
      // Sample 32 equidistant points to find closest point on spline
      var bestD = Infinity;
      var bestT = 0;
      var samples = 36;
      for (var sp = 0; sp <= samples; sp++) {
        var tSample = sp / samples;
        var pSample = js.curve.getPointAt(tSample);
        var d = CF.dist3D(p.x, p.y, p.z, pSample.x, pSample.y, pSample.z);
        if (d < bestD) {
          bestD = d;
          bestT = tSample;
        }
      }

      // Enter or continue riding current
      if (bestD < 38) {
        ridingNow = true;
        this.activeJetstream = js;
        this.activeJetstreamT = bestT;

        // Move player along curve tangent with high coaster speed
        var tangent = js.curve.getTangentAt(bestT);
        var targetPos = js.curve.getPointAt((bestT + 0.012) % 1.0);

        // Smoothly pull player into tube center
        p.x = CF.lerp(p.x, targetPos.x, 0.2);
        p.y = CF.lerp(p.y, targetPos.y, 0.2);
        p.z = CF.lerp(p.z, targetPos.z, 0.2);

        // Steer player orientation smoothly along current
        p.yaw = Math.atan2(tangent.x, tangent.z);
        p.pitch = Math.asin(tangent.y);
        p.speed = CF.CONFIG.PLAYER_MAX_SPEED * 2.1;
        p.boostTimer = 0.5;

        // Swirling current particles
        if (Math.random() < 0.4) {
          CF.Audio.jetstream();
        }
        break;
      }
    }

    if (!ridingNow) {
      this.activeJetstream = null;
    }
  },

  drawSpeedLines: function (ctx) {
    var p = CF.Player;
    if (!p) return;
    var isBoosting = (p.boostTimer > 0) || (this.activeJetstream !== null);
    if (!isBoosting) return;

    var C = CF.CONFIG;
    var cx = C.VIEW_W / 2;
    var cy = C.VIEW_H / 2;

    ctx.save();
    for (var i = 0; i < this.boostLines.length; i++) {
      var bl = this.boostLines[i];
      bl.dist += bl.speed;
      if (bl.dist > C.VIEW_W * 0.75) {
        bl.dist = CF.rand(140, 220);
        bl.angle = Math.random() * Math.PI * 2;
      }

      var cosA = Math.cos(bl.angle);
      var sinA = Math.sin(bl.angle);

      var x1 = cx + cosA * bl.dist;
      var y1 = cy + sinA * bl.dist;
      var x2 = cx + cosA * (bl.dist + bl.len);
      var y2 = cy + sinA * (bl.dist + bl.len);

      var g = ctx.createLinearGradient(x1, y1, x2, y2);
      var isGold = (p.isBreaching || (p.boostTimer > 2.0));
      var col = isGold ? 'rgba(255, 235, 120, ' : 'rgba(120, 240, 255, ';
      g.addColorStop(0, col + '0)');
      g.addColorStop(1, col + bl.alpha + ')');

      ctx.strokeStyle = g;
      ctx.lineWidth = bl.width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // High-speed HUD indicator pill
    ctx.fillStyle = 'rgba(9, 28, 44, 0.82)';
    ctx.strokeStyle = 'rgba(120, 240, 255, 0.8)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - 70, 88, 140, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var txt = this.activeJetstream ? '🌊 RIDING JETSTREAM!' : '⚡ TURBO BOOST!';
    ctx.fillText(txt, cx, 102);

    ctx.restore();
  }
};
