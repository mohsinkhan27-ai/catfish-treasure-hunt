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
    this.els.bossWin = document.getElementById('bossWinScreen');
    this.els.bossWinText = document.getElementById('bossWinText');
    this.els.bossAgainBtn = document.getElementById('bossAgainBtn');
    this.els.grandWin = document.getElementById('grandWinScreen');
    this.els.grandWinText = document.getElementById('grandWinText');
    this.els.grandAgainBtn = document.getElementById('grandAgainBtn');
    this.els.weaponChip = document.getElementById('weaponChip');
    this.els.octoObjective = document.getElementById('octoObjective');

    if (this.els.grandAgainBtn) {
      this.els.grandAgainBtn.addEventListener('click', function () {
        if (CF.Main) CF.Main.start();
      });
    }

    if (this.els.weaponChip) {
      this.els.weaponChip.addEventListener('click', function () {
        if (CF.Player && CF.Player.fireBubbleGun) {
          CF.Player.fireBubbleGun();
        }
      });
    }

    if (this.els.bossAgainBtn) {
      this.els.bossAgainBtn.addEventListener('click', function () {
        if (CF.Main) CF.Main.start();
      });
    }

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
      var closeFn = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        self.closeWardrobe();
      };
      this.els.wardrobeCloseBtn.addEventListener('click', closeFn);
      this.els.wardrobeCloseBtn.addEventListener('touchend', closeFn);
    }

    if (this.els.wardrobeModal) {
      this.els.wardrobeModal.addEventListener('click', function (e) {
        if (e.target === self.els.wardrobeModal) {
          self.closeWardrobe();
        }
      });
    }

    window.addEventListener('keydown', function (e) {
      if (e.key === 'c' || e.key === 'C') {
        self.toggleWardrobe();
      } else if (e.key === 'Escape' && self.wardrobeOpen) {
        self.closeWardrobe();
      }
    });

    this.updateAvatar();
  },

  updateAvatar: function () {
    var p = CF.Player;
    if (!p) return;
    var hatEl = document.getElementById('avatarHat');
    var roleEl = document.getElementById('avatarRole');
    var labelEl = document.getElementById('wardrobeLabel');

    var hatEmoji = '';
    var hatTitle = 'Closet (C)';
    var roleTitle = 'Dress-Up';

    if (p.activeHat === 'pirate') {
      hatEmoji = '🏴‍☠️';
      hatTitle = 'Pirate Cat (C)';
      roleTitle = 'Ahoy Captain!';
    } else if (p.activeHat === 'scuba') {
      hatEmoji = '🤿';
      hatTitle = 'Scuba Diver (C)';
      roleTitle = 'Deep Explorer';
    } else if (p.activeHat === 'crown') {
      hatEmoji = '👑';
      hatTitle = 'Royal King (C)';
      roleTitle = 'Ocean Royalty';
    } else if (p.activeHat === 'starfish') {
      hatEmoji = '⭐️';
      hatTitle = 'Starfish Cat (C)';
      roleTitle = 'Reef Star';
    }

    if (p.activeTrail === 'rainbow') {
      hatTitle += ' 🌈';
    } else if (p.activeTrail === 'sparkle') {
      hatTitle += ' ✨';
    }

    if (hatEl) hatEl.textContent = hatEmoji;
    if (roleEl) {
      if (p.hasBubbleGun) {
        roleEl.textContent = '🫧 Armed · ' + roleTitle;
      } else {
        roleEl.textContent = roleTitle;
      }
    }
    if (labelEl) labelEl.textContent = hatTitle;
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
      this.els.wardrobeModal.style.display = 'flex';
    }
  },

  closeWardrobe: function () {
    this.wardrobeOpen = false;
    if (this.els.wardrobeModal) {
      this.els.wardrobeModal.classList.add('hidden');
      this.els.wardrobeModal.style.display = 'none';
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
      var isEquipped = false;
      if (item.id === 'bubblegun') {
        isEquipped = p && p.hasBubbleGun;
      } else {
        isEquipped = p && (p.activeHat === item.id || p.activeTrail === item.id);
      }

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
        html += '<button class="wardrobe-btn equip-btn">' + (item.id === 'bubblegun' ? 'Arm' : 'Wear') + '</button>';
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

        if (id === 'bubblegun') {
          p.equipWeapon();
        } else if (id === 'rainbow' || id === 'sparkle') {
          p.equipTrail(id);
        } else {
          p.equipHat(id);
        }
        self.renderWardrobe();
        self.updateAvatar();
      });
    });
  },

  showUnlock: function (reward) {
    var self = this;
    this.updateAvatar();
    if (!this.els.unlockToast) return;

    var iconEl = document.getElementById('unlockIcon');
    var titleEl = document.getElementById('unlockTitle');
    var descEl = document.getElementById('unlockDesc');

    if (iconEl) iconEl.textContent = reward.icon;
    if (titleEl) titleEl.textContent = reward.name;
    if (descEl) descEl.textContent = reward.desc;

    this.els.unlockToast.classList.remove('hidden');
    this.els.unlockToast.style.display = 'flex';
    this.els.unlockToast.classList.add('pop-in');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      if (self.els.unlockToast) {
        self.els.unlockToast.classList.add('hidden');
        self.els.unlockToast.classList.remove('pop-in');
        self.els.unlockToast.style.display = 'none';
      }
    }, 4500);
  },

  update: function () {
    var C = CF.CONFIG;
    if (this.els.count) {
      var isAllChests = (CF.Treasure.foundCount >= C.TREASURE_COUNT);
      this.els.count.textContent = CF.Treasure.foundCount + ' / ' + C.TREASURE_COUNT + (isAllChests ? ' ✓' : '');
      if (isAllChests) this.els.count.style.color = '#51cf66';
      else this.els.count.style.color = '';
    }

    if (this.els.octoObjective) {
      if (CF.Octopus && !CF.Octopus.alive) {
        this.els.octoObjective.textContent = '🐙 Defeated ✓';
        this.els.octoObjective.style.color = '#51cf66';
      } else {
        this.els.octoObjective.textContent = '🐙 Lurking';
        this.els.octoObjective.style.color = '#ff99bb';
      }
    }

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
    if (this.els.bossWin) {
      this.els.bossWin.classList.add('hidden');
      this.els.bossWin.style.display = 'none';
    }
    if (this.els.grandWin) {
      this.els.grandWin.classList.add('hidden');
      this.els.grandWin.style.display = 'none';
    }
    this.closeWardrobe();
  },

  showObjectiveToast: function (msg) {
    var self = this;
    if (!this.els.unlockToast) return;
    var iconEl = document.getElementById('unlockIcon');
    var titleEl = document.getElementById('unlockTitle');
    var descEl = document.getElementById('unlockDesc');
    if (iconEl) iconEl.textContent = '🎯';
    if (titleEl) titleEl.textContent = 'MISSION OBJECTIVE';
    if (descEl) descEl.textContent = msg;

    this.els.unlockToast.classList.remove('hidden');
    this.els.unlockToast.style.display = 'flex';
    this.els.unlockToast.classList.add('pop-in');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      if (self.els.unlockToast) {
        self.els.unlockToast.classList.add('hidden');
        self.els.unlockToast.classList.remove('pop-in');
        self.els.unlockToast.style.display = 'none';
      }
    }, 5500);
  },

  showGrandWin: function (seconds) {
    if (this.els.grandWinText) {
      this.els.grandWinText.textContent = 'You successfully recovered all ' + CF.CONFIG.TREASURE_COUNT + ' ancient treasures AND destroyed the Giant Abyssal Octopus with your Bubble Blaster in ' + seconds.toFixed(1) + 's!';
    }
    if (this.els.grandWin) {
      this.els.grandWin.classList.remove('hidden');
      this.els.grandWin.style.display = 'flex';
    }
  },

  showWin: function (seconds) {
    this.showGrandWin(seconds);
  },

  showBossWin: function (seconds) {
    this.showGrandWin(seconds);
  },

  showLose: function (found, total) {
    this.els.loseText.textContent = 'Your lifeline was fully depleted! You recovered ' + found + ' of ' + total + ' treasures.';
    this.els.lose.classList.remove('hidden');
  }
};
