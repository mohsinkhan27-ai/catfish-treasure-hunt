window.CF = window.CF || {};

CF.Audio = {
  ctx: null,
  ready: false,

  init: function () {
    if (this.ready) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.ready = true;
    } catch (e) {
      this.ready = false;
    }
  },

  tone: function (freq, dur, type, vol) {
    if (!this.ready || !this.ctx) return;
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    var v = vol == null ? 0.07 : vol;
    g.gain.setValueAtTime(v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  },

  collect: function () {
    var self = this;
    this.tone(660, 0.12, 'triangle', 0.09);
    setTimeout(function () { self.tone(990, 0.16, 'triangle', 0.08); }, 90);
  },

  win: function () {
    var self = this;
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 0.24, 'triangle', 0.09); }, i * 130);
    });
  },

  lose: function () {
    var self = this;
    [392, 311, 233, 165].forEach(function (f, i) {
      setTimeout(function () { self.tone(f, 0.28, 'sawtooth', 0.08); }, i * 150);
    });
  },

  explode: function () {
    var self = this;
    this.tone(95, 0.3, 'sawtooth', 0.13);
    setTimeout(function () { self.tone(58, 0.4, 'square', 0.11); }, 35);
    setTimeout(function () { self.tone(170, 0.14, 'triangle', 0.06); }, 55);
  },

  bump: function () {
    this.tone(180, 0.1, 'sine', 0.05);
  }
};
