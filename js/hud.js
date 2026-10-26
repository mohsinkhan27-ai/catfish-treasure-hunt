window.CF = window.CF || {};

CF.HUD = {
  els: {},

  init: function () {
    this.els.count = document.getElementById('treasureCount');
    this.els.signal = document.getElementById('signalFill');
    this.els.life = document.getElementById('lifeFill');
    this.els.start = document.getElementById('startScreen');
    this.els.win = document.getElementById('winScreen');
    this.els.lose = document.getElementById('loseScreen');
    this.els.winText = document.getElementById('winText');
    this.els.loseText = document.getElementById('loseText');
    this.els.startBtn = document.getElementById('startBtn');
    this.els.againBtn = document.getElementById('againBtn');
    this.els.retryBtn = document.getElementById('retryBtn');
    this.els.viewBtn = document.getElementById('viewBtn');
    this.els.viewLabel = document.getElementById('viewLabel');

    if (this.els.viewBtn) {
      this.els.viewBtn.addEventListener('click', function () {
        if (CF.Render3D && CF.Render3D.toggleCameraMode) {
          CF.Render3D.toggleCameraMode();
        }
      });
    }
  },

  updateView: function (mode) {
    if (this.els.viewLabel) {
      if (mode === 'first') {
        this.els.viewLabel.textContent = '1st Person (V)';
      } else if (mode === 'birdsEye') {
        this.els.viewLabel.textContent = "Bird's Eye (V)";
      } else {
        this.els.viewLabel.textContent = '3rd Person (V)';
      }
    }
  },

  update: function () {
    var C = CF.CONFIG;
    this.els.count.textContent = CF.Treasure.foundCount + ' / ' + C.TREASURE_COUNT;

    var s = CF.Treasure.signal;
    this.els.signal.style.width = (s * 100) + '%';
    this.els.signal.style.background = 'hsl(' + CF.lerp(200, 0, s) + ', 85%, 55%)';

    var h = CF.clamp(CF.Player.health / C.HEALTH_MAX, 0, 1);
    this.els.life.style.width = (h * 100) + '%';
    this.els.life.style.background = 'hsl(' + (h * 120) + ', 80%, 50%)';
  },

  hideScreens: function () {
    this.els.start.classList.add('hidden');
    this.els.win.classList.add('hidden');
    this.els.lose.classList.add('hidden');
  },

  showWin: function (seconds) {
    var C = CF.CONFIG;
    this.els.winText.textContent = 'You found all ' + C.TREASURE_COUNT + ' treasures in ' + seconds.toFixed(1) + 's!';
    this.els.win.classList.remove('hidden');
  },

  showLose: function (found, total) {
    this.els.loseText.textContent = 'The shark drained all your life. You recovered ' + found + ' of ' + total + ' treasures.';
    this.els.lose.classList.remove('hidden');
  }
};
