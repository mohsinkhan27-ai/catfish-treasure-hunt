window.CF = window.CF || {};

CF.Assets = {
  images: {},
  loaded: false,

  init: function () {
    var toLoad = {
      catfish: 'assets/catfish.png',
      shark: 'assets/Shark.png',
      treasure: 'assets/treasure.png',
      decoy: 'assets/decoy.png'
    };

    var keys = Object.keys(toLoad);
    var remaining = keys.length;
    var self = this;

    keys.forEach(function (key) {
      var img = new Image();
      img.onload = function () {
        self.images[key] = img;
        remaining--;
        if (remaining <= 0) {
          self.loaded = true;
        }
      };
      img.onerror = function () {
        console.warn('Asset failed to load: ' + toLoad[key]);
        remaining--;
        if (remaining <= 0) self.loaded = true;
      };
      img.src = toLoad[key];
    });
  },

  get: function (name) {
    var key = (name || '').toLowerCase();
    var img = this.images[key] || this.images[name];
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  },

  textures: {},
  getTexture: function (name) {
    var key = (name || '').toLowerCase();
    if (this.textures[key]) return this.textures[key];
    var img = this.get(key);
    if (img && typeof THREE !== 'undefined') {
      var tex = new THREE.CanvasTexture(img);
      tex.needsUpdate = true;
      this.textures[key] = tex;
      return tex;
    }
    return null;
  }
};
