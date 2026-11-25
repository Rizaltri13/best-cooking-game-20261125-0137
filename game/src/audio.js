// Warung Rush — all sound is synthesized with WebAudio: no audio files,
// no network. Created lazily on the first user gesture, so autoplay rules
// never block the page; every call is a no-op when muted or unavailable.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

function ac() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null, delay = 0) {
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol = 0.08, freq = 1200, delay = 0) {
  const audio = ac();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const len = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = audio.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  src.start(t0);
}

/** Play the named kitchen sound. Unknown names are silent. */
export function playSound(name) {
  switch (name) {
    case 'pickup':
      tone(520, 0.09, 'triangle', 0.1);
      tone(780, 0.08, 'triangle', 0.08, null, 0.06);
      break;
    case 'chop':
      noise(0.07, 0.16, 900);
      tone(180, 0.06, 'square', 0.06);
      break;
    case 'chopDone':
      noise(0.07, 0.16, 900);
      tone(660, 0.1, 'triangle', 0.1, null, 0.05);
      tone(880, 0.14, 'triangle', 0.1, null, 0.12);
      break;
    case 'cookStart':
      noise(0.5, 0.05, 2400);
      tone(220, 0.2, 'sine', 0.05, 330);
      break;
    case 'cookTake':
      tone(440, 0.1, 'triangle', 0.1);
      tone(660, 0.12, 'triangle', 0.1, null, 0.08);
      break;
    case 'burnt':
      tone(220, 0.25, 'sawtooth', 0.1, 110);
      noise(0.2, 0.1, 500);
      break;
    case 'plate':
      tone(700, 0.07, 'triangle', 0.09);
      break;
    case 'plateReady':
      tone(523, 0.1, 'triangle', 0.1);
      tone(659, 0.1, 'triangle', 0.1, null, 0.09);
      tone(784, 0.16, 'triangle', 0.11, null, 0.18);
      break;
    case 'serve':
      tone(880, 0.12, 'triangle', 0.12);
      tone(1174, 0.2, 'triangle', 0.12, null, 0.1);
      tone(1568, 0.24, 'sine', 0.09, null, 0.2);
      break;
    case 'trash':
      noise(0.15, 0.1, 400);
      tone(160, 0.15, 'sine', 0.08, 90);
      break;
    case 'expire':
      tone(330, 0.2, 'square', 0.07, 220);
      tone(220, 0.3, 'square', 0.07, 165, 0.18);
      break;
    case 'deny':
      tone(140, 0.12, 'square', 0.07);
      break;
    case 'click':
      tone(600, 0.05, 'triangle', 0.06);
      break;
    case 'win':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, null, i * 0.13));
      break;
    case 'lose':
      [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, null, i * 0.18));
      break;
    default:
      break;
  }
}
