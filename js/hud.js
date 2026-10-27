window.CF = window.CF || {};

CF.HUD = {
  els: {},
  toastTimer: null,
  wardrobeOpen: false,

  init: function () {
    var self = this;
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
    this.els.wardrobeBtn = document.getElementById('wardrobeBtn');
    this.els.wardrobeModal = document.getElementById('wardrobeModal');
    this.els.wardrobeCloseBtn = document.getElementById('wardrobeCloseBtn');
    this.els.wardrobeGrid = document.getElementById('wardrobeGrid');
    this.els.unlockToast = document.getElementById('unlockToast');
    this.els.touchWardrobeBtn = document.getElementById('touchWardrobeBtn');

    if (this.els.viewBtn) {
      this.els.viewBtn.addEventListener('click', function () {
        if (CF.Render3D && CF.Render3D.toggleCameraMode) {
          CF.Render3D.toggleCameraMode();
        }
      });
    }

    if (this.els.wardrobeBtn) {
      this.els.wardrobeBtn.addEventListener('click', function () {
        self.toggleWardrobe();
      });
    }

    if (this.els.touchWardrobeBtn) {
      this.els.touchWardrobeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        self.toggleWardrobe();
      });
    }

    if (this.els.wardrobeCloseBtn) {
      this.els.wardrobeCloseBtn.addEventListener('click', function () {
        self.closeWardrobe();
      });
    }

    window.addEventListener('keydown', function (e) {
      if (e.key === 'c' || e.key === 'C') {
        self.toggleWardrobe();
      } else if (e.key === 'Escape' && self.wardrobeOpen) {
        self.closeWardrobe();
      }
    });
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

  toggleWardrobe: function () {
    if (this.wardrobeOpen) {
      this.closeWardrobe();
    } else {
      this.openWardrobe();
    }
  },

  openWardrobe: function () {
    this.wardrobeOpen = true;
    if (this.els.wardrobeModal) {
      this.renderWardrobe();
      this.els.wardrobeModal.classList.remove('hidden');
    }
  },

  closeWardrobe: function () {
    this.wardrobeOpen = false;
    if (this.els.wardrobeModal) {
      this.els.wardrobeModal.classList.add('hidden');
    }
  },

  renderWardrobe: function () {
    var self = this;
    if (!this.els.wardrobeGrid || !CF.Treasure || !CF.Treasure.ACCESSORIES) return;

    var p = CF.Player;
    var html = '';

    for (var i = 0; i < CF.Treasure.ACCESSORIES.length; i++) {
      var item = CF.Treasure.ACCESSORIES[i];
      var isUnlocked = p && p.unlocked && p.unlocked[item.id];
      var isEquipped = p && (p.activeHat === item.id || p.activeTrail === item.id);

      var cardClass = 'wardrobe-card';
      if (!isUnlocked) cardClass += ' locked';
      if (isEquipped) cardClass += ' equipped';

      html += '<div class="' + cardClass + '" data-id="' + item.id + '">';
      html += '<div class="wardrobe-icon">' + item.icon + '</div>';
      html += '<div class="wardrobe-info">';
      html += '<div class="wardrobe-name">' + item.name + '</div>';
      html += '<div class="wardrobe-desc">' + item.desc + '</div>';
      html += '</div>';

      html += '<div class="wardrobe-action">';
      if (!isUnlocked) {
        html += '<span class="badge-locked">🔒 Chest #' + (i + 1) + '</span>';
      } else if (isEquipped) {
        html += '<button class="wardrobe-btn unequip-btn">Equipped ✓</button>';
      } else {
        html += '<button class="wardrobe-btn equip-btn">Wear</button>';
      }
      html += '</div>';
      html += '</div>';
    }

    this.els.wardrobeGrid.innerHTML = html;

    // Attach click events
    var cards = this.els.wardrobeGrid.querySelectorAll('.wardrobe-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        if (!p || !p.unlocked || !p.unlocked[id]) return;

        if (id === 'rainbow' || id === 'sparkle') {
          p.equipTrail(id);
        } else {
          p.equipHat(id);
        }
        self.renderWardrobe();
      });
    });
  },

  showUnlock: function (reward) {
    var self = this;
    if (!this.els.unlockToast) return;

    var iconEl = document.getElementById('unlockIcon');
    var titleEl = document.getElementById('unlockTitle');
    var descEl = document.getElementById('unlockDesc');

    if (iconEl) iconEl.textContent = reward.icon;
    if (titleEl) titleEl.textContent = reward.name;
    if (descEl) descEl.textContent = reward.desc;

    this.els.unlockToast.classList.remove('hidden');
    this.els.unlockToast.classList.add('pop-in');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      if (self.els.unlockToast) {
        self.els.unlockToast.classList.add('hidden');
        self.els.unlockToast.classList.remove('pop-in');
      }
    }, 4500);
  },

  update: function () {
    var C = CF.CONFIG;
    if (this.els.count) this.els.count.textContent = CF.Treasure.foundCount + ' / ' + C.TREASURE_COUNT;

    var s = CF.Treasure.signal;
    if (this.els.signal) {
      this.els.signal.style.width = (s * 100) + '%';
      this.els.signal.style.background = 'hsl(' + CF.lerp(200, 0, s) + ', 85%, 55%)';
    }

    var h = CF.clamp(CF.Player.health / C.HEALTH_MAX, 0, 1);
    if (this.els.life) {
      this.els.life.style.width = (h * 100) + '%';
      this.els.life.style.background = 'hsl(' + (h * 120) + ', 80%, 50%)';
    }
  },

  hideScreens: function () {
    if (this.els.start) this.els.start.classList.add('hidden');
    if (this.els.win) this.els.win.classList.add('hidden');
    if (this.els.lose) this.els.lose.classList.add('hidden');
    this.closeWardrobe();
  },

  showWin: function (seconds) {
    var C = CF.CONFIG;
    this.els.winText.textContent = 'You found all ' + C.TREASURE_COUNT + ' treasures in ' + seconds.toFixed(1) + 's!';
    this.els.win.classList.remove('hidden');
  },

  showLose: function (found, total) {
    this.els.loseText.textContent = 'The predator drained all your life. You recovered ' + found + ' of ' + total + ' treasures.';
    this.els.lose.classList.remove('hidden');
  }
};
