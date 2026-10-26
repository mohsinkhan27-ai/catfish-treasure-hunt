window.CF = window.CF || {};

CF.Input = {
  held: {},
  pressed: {},
  touchAxis: { x: 0, y: 0, z: 0 },
  isTouchDevice: false,

  init: function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      var k = self.normalize(e.key);
      if (!k) return;
      if (!self.held[k]) self.pressed[k] = true;
      self.held[k] = true;
      if (k === 'up' || k === 'down' || k === 'left' || k === 'right' || k === 'map' || k === 'escape') {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      var k = self.normalize(e.key);
      if (k) self.held[k] = false;
    });

    // Detect touch capability
    this.isTouchDevice = ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    this.initTouchControls();
  },

  initTouchControls: function () {
    var self = this;
    var controls = document.getElementById('touchControls');
    var joystickZone = document.getElementById('joystickZone');
    var joystickBase = document.getElementById('joystickBase');
    var joystickThumb = document.getElementById('joystickThumb');
    var upBtn = document.getElementById('touchUpBtn');
    var downBtn = document.getElementById('touchDownBtn');
    var viewBtn = document.getElementById('touchViewBtn');
    var mapBtn = document.getElementById('touchMapBtn');
    var toggleTouchBtn = document.getElementById('toggleTouchBtn');
    var touchToggleLabel = document.getElementById('touchToggleLabel');

    if (!controls) return;

    // Always visible by default on mobile/tablet and ready to play
    controls.classList.add('visible');
    if (touchToggleLabel) touchToggleLabel.textContent = '📱 Touch ON';

    if (toggleTouchBtn) {
      toggleTouchBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var isVis = controls.classList.toggle('visible');
        if (touchToggleLabel) {
          touchToggleLabel.textContent = isVis ? '📱 Touch ON' : '📱 Touch OFF';
        }
      });
    }

    // 1. Virtual Joystick Math & Event Handling
    var activeTouchId = null;
    var baseRect = null;
    var maxRadius = 42; // Maximum stick radius in px

    var updateJoystick = function (clientX, clientY) {
      if (!joystickBase) return;
      baseRect = joystickBase.getBoundingClientRect();

      var centerX = baseRect.left + baseRect.width / 2;
      var centerY = baseRect.top + baseRect.height / 2;
      var dx = clientX - centerX;
      var dy = clientY - centerY;
      var dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      if (joystickThumb) {
        joystickThumb.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
      }

      // Normalized analog values between -1.0 and 1.0
      // dx > 0: steer right, dx < 0: steer left
      // dy < 0: forward swim, dy > 0: backward swim
      self.touchAxis.x = dx / maxRadius;
      self.touchAxis.y = -dy / maxRadius;
    };

    var resetJoystick = function () {
      activeTouchId = null;
      baseRect = null;
      self.touchAxis.x = 0;
      self.touchAxis.y = 0;
      if (joystickThumb) {
        joystickThumb.style.transform = 'translate(0px, 0px)';
      }
    };

    if (joystickZone) {
      // Touch events for mobile/tablet
      joystickZone.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (activeTouchId !== null) return;
        var touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        updateJoystick(touch.clientX, touch.clientY);
      }, { passive: false });

      window.addEventListener('touchmove', function (e) {
        if (activeTouchId === null) return;
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            e.preventDefault();
            updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }, { passive: false });

      window.addEventListener('touchend', function (e) {
        if (activeTouchId === null) return;
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            resetJoystick();
            break;
          }
        }
      });

      window.addEventListener('touchcancel', function () {
        resetJoystick();
      });

      // Mouse drag emulation for desktop testing (Device Mode or direct mouse click)
      var isMouseDown = false;
      joystickZone.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isMouseDown = true;
        updateJoystick(e.clientX, e.clientY);
      });

      window.addEventListener('mousemove', function (e) {
        if (isMouseDown) {
          e.preventDefault();
          updateJoystick(e.clientX, e.clientY);
        }
      });

      window.addEventListener('mouseup', function () {
        if (isMouseDown) {
          isMouseDown = false;
          resetJoystick();
        }
      });
    }

    // 2. Action Buttons (Swim Up, Dive Down, View, Map)
    var bindTouchBtn = function (btn, onDown, onUp) {
      if (!btn) return;
      var handleDown = function (e) {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        onDown();
      };
      var handleUp = function (e) {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove('active');
        if (onUp) onUp();
      };

      btn.addEventListener('touchstart', handleDown, { passive: false });
      btn.addEventListener('touchend', handleUp, { passive: false });
      btn.addEventListener('touchcancel', handleUp, { passive: false });
      btn.addEventListener('mousedown', handleDown);
      btn.addEventListener('mouseup', handleUp);
    };

    // Swim Up button (held)
    bindTouchBtn(upBtn, function () { self.touchAxis.z = 1; }, function () { if (self.touchAxis.z > 0) self.touchAxis.z = 0; });
    // Dive Down button (held)
    bindTouchBtn(downBtn, function () { self.touchAxis.z = -1; }, function () { if (self.touchAxis.z < 0) self.touchAxis.z = 0; });

    // Camera View button (tap to toggle - single dispatch)
    bindTouchBtn(viewBtn, function () {
      self.pressed['view'] = true;
    });

    // Sonar Map button (tap to toggle - single dispatch)
    bindTouchBtn(mapBtn, function () {
      self.pressed['map'] = true;
    });

    // Tap anywhere on the game to close map if open
    window.addEventListener('pointerdown', function (e) {
      if (CF.Map && CF.Map.open) {
        if (!e.target.closest('#touchMapBtn')) {
          CF.Map.open = false;
        }
      }
    });
  },

  normalize: function (key) {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W': return 'up';
      case 'ArrowDown': case 's': case 'S': return 'down';
      case 'ArrowLeft': case 'a': case 'A': return 'left';
      case 'ArrowRight': case 'd': case 'D': return 'right';
      case ' ': case 'e': case 'E': return 'ascend';
      case 'Shift': case 'q': case 'Q': case 'c': case 'C': return 'descend';
      case 'v': case 'V': return 'view';
      case 'm': case 'M': return 'map';
      case 'Escape': return 'escape';
      default: return null;
    }
  },

  justPressed: function (k) { return !!this.pressed[k]; },

  clearFrame: function () { this.pressed = {}; },

  axis: function () {
    var x = this.touchAxis.x;
    var y = this.touchAxis.y;
    var z = this.touchAxis.z;

    if (this.held.left) x -= 1;
    if (this.held.right) x += 1;
    if (this.held.up) y += 1; // forward
    if (this.held.down) y -= 1; // backward
    if (this.held.ascend) z += 1; // swim up
    if (this.held.descend) z -= 1; // swim down

    // Clamp range
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));
    z = Math.max(-1, Math.min(1, z));

    return { x: x, y: y, z: z };
  }
};
