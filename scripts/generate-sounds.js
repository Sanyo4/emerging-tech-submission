/**
 * Generate 5 budget-state WAV sound files.
 * Uses raw PCM → WAV encoding (no dependencies).
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function encodeWav(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buffer;
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function envelope(t, attack, sustain, release, total) {
  if (t < attack) return t / attack;
  if (t < attack + sustain) return 1;
  const rel = t - attack - sustain;
  if (rel < release) return 1 - rel / release;
  return 0;
}

// Excellent: C major chord, slow arpeggiation (1.2s)
function generateExcellent() {
  const duration = 1.2;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(n);
  const notes = [261.63, 329.63, 392.0]; // C4, E4, G4
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (let j = 0; j < notes.length; j++) {
      const onset = j * 0.25;
      if (t >= onset) {
        const lt = t - onset;
        const env = envelope(lt, 0.05, 0.4, 0.5, duration - onset);
        val += sine(notes[j], t) * env * 0.3;
      }
    }
    samples[i] = val;
  }
  return samples;
}

// Good: G major chord, moderate tempo (1.0s)
function generateGood() {
  const duration = 1.0;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(n);
  const notes = [392.0, 493.88, 587.33]; // G4, B4, D5
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (let j = 0; j < notes.length; j++) {
      const onset = j * 0.15;
      if (t >= onset) {
        const lt = t - onset;
        const env = envelope(lt, 0.03, 0.35, 0.4, duration - onset);
        val += sine(notes[j], t) * env * 0.3;
      }
    }
    samples[i] = val;
  }
  return samples;
}

// Warning: A minor chord, faster tempo (0.8s)
function generateWarning() {
  const duration = 0.8;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(n);
  const notes = [220.0, 261.63, 329.63]; // A3, C4, E4
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let val = 0;
    for (let j = 0; j < notes.length; j++) {
      const onset = j * 0.1;
      if (t >= onset) {
        const lt = t - onset;
        const env = envelope(lt, 0.02, 0.25, 0.3, duration - onset);
        val += sine(notes[j], t) * env * 0.35;
      }
    }
    samples[i] = val;
  }
  return samples;
}

// Critical: Dissonant cluster, rapid staccato (0.7s)
function generateCritical() {
  const duration = 0.7;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(n);
  const notes = [233.08, 246.94, 261.63, 277.18]; // Bb3, B3, C4, C#4
  const pulseCount = 6;
  const pulseLen = duration / pulseCount;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const pulsePhase = (t % pulseLen) / pulseLen;
    const pulseEnv = pulsePhase < 0.6 ? 1 : 1 - (pulsePhase - 0.6) / 0.4;
    let val = 0;
    for (const freq of notes) {
      val += sine(freq, t) * 0.2;
    }
    samples[i] = val * pulseEnv;
  }
  return samples;
}

// Over budget: Descending chromatic, harsh timbre (1.0s)
function generateOverBudget() {
  const duration = 1.0;
  const n = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float64Array(n);
  const startFreq = 523.25; // C5
  const endFreq = 220.0; // A3
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const freq = startFreq * Math.pow(endFreq / startFreq, progress);
    const env = envelope(t, 0.02, 0.6, 0.38, duration);
    // Add harmonics for harsh timbre
    let val = sine(freq, t) * 0.3;
    val += sine(freq * 2, t) * 0.15;
    val += sine(freq * 3, t) * 0.1;
    samples[i] = val * env;
  }
  return samples;
}

// Generate all files
const sounds = [
  { name: 'excellent.wav', gen: generateExcellent },
  { name: 'good.wav', gen: generateGood },
  { name: 'warning.wav', gen: generateWarning },
  { name: 'critical.wav', gen: generateCritical },
  { name: 'overbudget.wav', gen: generateOverBudget },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { name, gen } of sounds) {
  const samples = gen();
  const wav = encodeWav(samples, SAMPLE_RATE);
  const outPath = path.join(OUT_DIR, name);
  fs.writeFileSync(outPath, wav);
  console.log(`Created ${name} (${wav.length} bytes)`);
}

console.log('Done!');
