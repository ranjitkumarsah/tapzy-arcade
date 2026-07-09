// Lightweight Web Audio sound engine — synthesizes all audio at runtime so we
// ship zero binary assets. Provides per-game background music, win/lose jingles,
// small SFX, and a persisted mute setting. Paired with Telegram haptics.
import { hapticNotify, hapticImpact } from '../telegram/initTelegram'

let ctx = null
let muted = typeof localStorage !== 'undefined' && localStorage.getItem('tapzy_muted') === '1'

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = AC ? new AC() : null
  }
  // Browsers/Telegram start the context suspended until a user gesture.
  if (ctx && ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function isMuted() {
  return muted
}
export function setMuted(next) {
  muted = next
  try {
    localStorage.setItem('tapzy_muted', next ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (next) stopMusic()
}
export function toggleMuted() {
  setMuted(!muted)
  return muted
}

// One short synthesized note.
function tone(freq, start, dur, type = 'square', vol = 0.15) {
  const c = getCtx()
  if (!c) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, start)
  g.gain.linearRampToValueAtTime(vol, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(start)
  osc.stop(start + dur + 0.03)
}

// ---- SFX ----
export function playWin() {
  hapticNotify('success')
  if (muted) return
  const c = getCtx()
  if (!c) return
  const t = c.currentTime
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.18, 'square', 0.18))
}

export function playLose() {
  hapticNotify('error')
  if (muted) return
  const c = getCtx()
  if (!c) return
  const t = c.currentTime
  ;[392, 330, 262].forEach((f, i) => tone(f, t + i * 0.18, 0.3, 'sawtooth', 0.16))
}

export function playBlip(good = true) {
  hapticImpact('light')
  if (muted) return
  const c = getCtx()
  if (!c) return
  tone(good ? 740 : 300, c.currentTime, 0.07, 'square', 0.12)
}

// ---- Per-game background music (simple looping chiptune) ----
const TRACKS = {
  tictactoe: { tempo: 0.34, wave: 'triangle', notes: [262, 330, 392, 330] },
  memory: { tempo: 0.28, wave: 'square', notes: [330, 392, 494, 392, 440, 392] },
  quiz: { tempo: 0.32, wave: 'triangle', notes: [294, 370, 440, 370] },
  '2048': { tempo: 0.3, wave: 'square', notes: [262, 392, 330, 494] },
  snake: { tempo: 0.22, wave: 'square', notes: [330, 415, 494, 415, 392, 330] },
  flappy: { tempo: 0.24, wave: 'triangle', notes: [392, 494, 587, 494] },
  reaction: { tempo: 0.36, wave: 'triangle', notes: [440, 554, 440, 330] },
  whack: { tempo: 0.2, wave: 'square', notes: [392, 523, 392, 494, 440, 392] },
  simon: { tempo: 0.4, wave: 'triangle', notes: [330, 392, 494] },
  colormatch: { tempo: 0.26, wave: 'square', notes: [523, 440, 349, 440] },
  bubble: { tempo: 0.3, wave: 'triangle', notes: [440, 523, 659, 523] },
}

let musicTimer = null
let musicStep = 0
let musicTrack = null

export function startMusic(gameId) {
  stopMusic()
  if (muted) return
  const track = TRACKS[gameId] || TRACKS.tictactoe
  if (!getCtx()) return
  musicTrack = track
  musicStep = 0
  const stepMs = track.tempo * 1000
  const tick = () => {
    if (muted || !musicTrack) return
    const c = getCtx()
    if (c) {
      const f = track.notes[musicStep % track.notes.length]
      tone(f, c.currentTime, track.tempo * 0.9, track.wave, 0.05) // low volume bed
    }
    musicStep += 1
    musicTimer = setTimeout(tick, stepMs)
  }
  tick()
}

export function stopMusic() {
  if (musicTimer) {
    clearTimeout(musicTimer)
    musicTimer = null
  }
  musicTrack = null
}
