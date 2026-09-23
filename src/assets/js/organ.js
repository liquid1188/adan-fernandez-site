// Playable organ widget on the homepage: a facade of clickable pipes and a
// two-octave keyboard, synthesized with Web Audio (no audio files to load).
(function () {
  var facade = document.getElementById("organFacade");
  var keyboard = document.getElementById("organKeyboard");
  if (!facade || !keyboard) return;

  var NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  var KEY_MAP = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k", "o", "l"];
  var hoverToggle = document.getElementById("organHoverToggle");
  var volumeControl = document.getElementById("organVolume");

  var audio, master, dry, wet, convolver;
  var soundEnabled = false;
  var hoverEnabled = false;
  var pointerDown = false;
  var voices = new Map();
  var heldKeys = new Set();

  function midiToHz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
  function labelFor(midi) { return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1); }

  function build() {
    // One pipe for every key on the keyboard (C3 to C5), so each note played
    // lights its own pipe. Heights mirror outward from the center, like a facade.
    var pipeMidis = Array.from({ length: 25 }, function (_, i) { return 48 + i; });
    pipeMidis.forEach(function (midi, i) {
      var distance = Math.abs(i - 12);
      var pipe = document.createElement("button");
      pipe.type = "button";
      pipe.className = "organ-pipe";
      pipe.dataset.midi = midi;
      pipe.style.setProperty("--height", (97 - distance * 4.6) + "%");
      pipe.setAttribute("aria-label", "Pipe " + labelFor(midi));
      pipe.title = labelFor(midi);
      facade.appendChild(pipe);
    });

    var whiteMidis = [];
    for (var midi = 48; midi <= 72; midi++) {
      if ([1, 3, 6, 8, 10].indexOf(midi % 12) === -1) whiteMidis.push(midi);
    }
    whiteMidis.forEach(function (m) { keyboard.appendChild(makeKey(m, false)); });
    for (var bm = 49; bm < 72; bm++) {
      if ([1, 3, 6, 8, 10].indexOf(bm % 12) === -1) continue;
      var whitesBefore = whiteMidis.filter(function (n) { return n < bm; }).length;
      var key = makeKey(bm, true);
      key.style.setProperty("--x", whitesBefore);
      keyboard.appendChild(key);
    }
  }

  function makeKey(midi, black) {
    var key = document.createElement("button");
    key.type = "button";
    key.className = "organ-key" + (black ? " organ-key--black" : "");
    key.dataset.midi = midi;
    key.setAttribute("aria-label", labelFor(midi));
    key.title = labelFor(midi);
    return key;
  }

  function initAudio() {
    if (audio) return;
    audio = new (window.AudioContext || window.webkitAudioContext)();
    master = audio.createGain();
    dry = audio.createGain();
    wet = audio.createGain();
    convolver = audio.createConvolver();
    master.gain.value = (Number(volumeControl.value) / 100) * 0.42;
    dry.gain.value = 0.82;
    wet.gain.value = 0.46;
    convolver.buffer = createImpulse(2.6, 2.4);
    master.connect(dry).connect(audio.destination);
    master.connect(convolver).connect(wet).connect(audio.destination);
  }

  function createImpulse(seconds, decay) {
    var length = audio.sampleRate * seconds;
    var impulse = audio.createBuffer(2, length, audio.sampleRate);
    for (var channel = 0; channel < 2; channel++) {
      var data = impulse.getChannelData(channel);
      for (var i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
  }

  function running() { return !!audio && audio.state === "running"; }

  // Browsers only let audio start from certain gestures: a mouse press, a key
  // press, or lifting a finger (not touching down). This is called from all of
  // them. iOS also mutes web audio in silent mode unless the page asks to play
  // as media, and needs a sound started inside the gesture to fully unlock.
  function enableSound() {
    initAudio();
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    if (running()) { soundEnabled = true; return Promise.resolve(); }
    var resumed;
    try { resumed = audio.resume(); } catch (e) { resumed = Promise.resolve(); }
    try {
      var silent = audio.createBufferSource();
      silent.buffer = audio.createBuffer(1, 1, 22050);
      silent.connect(audio.destination);
      silent.start(0);
    } catch (e) {}
    return Promise.resolve(resumed).then(function () { soundEnabled = running(); }, function () { soundEnabled = running(); });
  }

  function play(midi, source) {
    if (!running() || voices.has(source + ":" + midi)) return;
    var now = audio.currentTime;
    var gain = audio.createGain();
    var filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4300;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.17, now + 0.045);
    var partials = [[1, 1], [2, 0.42], [3, 0.2], [4, 0.12], [0.5, 0.1]];
    var oscillators = partials.map(function (p) {
      var osc = audio.createOscillator();
      var partialGain = audio.createGain();
      osc.type = p[0] === 0.5 ? "sine" : "triangle";
      osc.frequency.value = midiToHz(midi) * p[0];
      partialGain.gain.value = p[1];
      osc.connect(partialGain).connect(filter);
      osc.start(now);
      return osc;
    });
    filter.connect(gain).connect(master);
    voices.set(source + ":" + midi, { oscillators: oscillators, gain: gain });
    document.querySelectorAll('[data-midi="' + midi + '"]').forEach(function (el) { el.classList.add("is-playing"); });
  }

  function stop(midi, source) {
    var id = source + ":" + midi;
    var voice = voices.get(id);
    if (!voice || !audio) return;
    var now = audio.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0.0001, now, 0.08);
    voice.oscillators.forEach(function (osc) { osc.stop(now + 0.5); });
    voices.delete(id);
    var stillPlaying = Array.from(voices.keys()).some(function (key) { return Number(key.split(":")[1]) === midi; });
    if (!stillPlaying) document.querySelectorAll('[data-midi="' + midi + '"]').forEach(function (el) { el.classList.remove("is-playing"); });
  }

  function noteTarget(event) { return event.target.closest("[data-midi]"); }

  var activePointers = new Set();
  var pointerNote = new Map();   // pointer id -> note it pressed, for the first-tap fallback

  function releasePointer(event) {
    var id = event.pointerId;
    activePointers.delete(id);
    pointerDown = activePointers.size > 0;
    var sounding = Array.from(voices.keys()).filter(function (k) { return k.indexOf("pointer" + id + ":") === 0; });
    sounding.forEach(function (k) { stop(Number(k.split(":")[1]), "pointer" + id); });
    var midi = pointerNote.get(id);
    pointerNote.delete(id);
    // On phones the first touch-down cannot start audio; lifting the finger
    // can. If that press made no sound, unlock now and play it as a short tap.
    if (event.type === "pointerup" && midi !== undefined && !sounding.length) {
      enableSound().then(function () {
        if (!running()) return;
        play(midi, "tap" + id);
        setTimeout(function () { stop(midi, "tap" + id); }, 320);
      });
    }
  }

  document.addEventListener("pointerdown", function (event) {
    var el = noteTarget(event);
    if (!el) return;
    event.preventDefault();
    var id = event.pointerId;
    var midi = Number(el.dataset.midi);
    activePointers.add(id);
    pointerNote.set(id, midi);
    pointerDown = true;
    // Touch pointers are captured to the first element automatically; release
    // that so a finger sliding along the keyboard reaches each key it crosses.
    // A mouse keeps capture so a press that leaves the key still ends cleanly.
    try {
      if (event.pointerType === "touch") el.releasePointerCapture && el.releasePointerCapture(id);
      else el.setPointerCapture && el.setPointerCapture(id);
    } catch (e) {}
    if (running()) { play(midi, "pointer" + id); return; }
    enableSound().then(function () {
      // Audio may wake after a quick tap is already lifted; don't start it then.
      if (activePointers.has(id)) play(midi, "pointer" + id);
    });
  });
  document.addEventListener("pointerup", releasePointer);
  document.addEventListener("pointercancel", releasePointer);
  document.addEventListener("pointerover", function (event) {
    var el = noteTarget(event);
    if (!el || !running()) return;
    if (activePointers.has(event.pointerId)) play(Number(el.dataset.midi), "pointer" + event.pointerId);
    else if (hoverEnabled && event.pointerType === "mouse") play(Number(el.dataset.midi), "hover");
  });
  document.addEventListener("pointerout", function (event) {
    var el = noteTarget(event);
    if (!el) return;
    stop(Number(el.dataset.midi), activePointers.has(event.pointerId) ? "pointer" + event.pointerId : "hover");
  });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) return;
    Array.from(voices.keys()).forEach(function (k) { stop(Number(k.split(":")[1]), k.split(":")[0]); });
    activePointers.clear(); pointerDown = false;
  });

  window.addEventListener("keydown", function (event) {
    if (event.repeat || heldKeys.has(event.key.toLowerCase())) return;
    var index = KEY_MAP.indexOf(event.key.toLowerCase());
    if (index < 0) return;
    event.preventDefault();
    heldKeys.add(event.key.toLowerCase());
    (soundEnabled ? Promise.resolve() : enableSound()).then(function () { play(48 + index, "keyboard"); });
  });
  window.addEventListener("keyup", function (event) {
    var index = KEY_MAP.indexOf(event.key.toLowerCase());
    if (index < 0) return;
    heldKeys.delete(event.key.toLowerCase());
    stop(48 + index, "keyboard");
  });
  window.addEventListener("blur", function () {
    Array.from(voices.keys()).forEach(function (k) { stop(Number(k.split(":")[1]), k.split(":")[0]); });
    heldKeys.clear();
    activePointers.clear();
    pointerDown = false;
  });

  hoverToggle.addEventListener("click", function () {
    (soundEnabled ? Promise.resolve() : enableSound()).then(function () {
      hoverEnabled = !hoverEnabled;
      hoverToggle.setAttribute("aria-pressed", String(hoverEnabled));
    });
  });
  volumeControl.addEventListener("input", function () {
    initAudio();
    master.gain.setTargetAtTime((Number(volumeControl.value) / 100) * 0.42, audio.currentTime, 0.02);
  });

  build();
})();
