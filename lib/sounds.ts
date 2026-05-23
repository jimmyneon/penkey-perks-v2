/**
 * Sound Effects System for Penkey Games
 * Uses Web Audio API for better performance
 */

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true

  constructor() {
    // Check if user prefers reduced motion (also applies to sounds)
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      this.enabled = !prefersReducedMotion
    }
  }

  /**
   * Preload a sound file
   */
  preload(name: string, url: string) {
    if (typeof window === 'undefined') return

    const audio = new Audio(url)
    audio.preload = 'auto'
    this.sounds.set(name, audio)
  }

  /**
   * Play a sound
   */
  play(name: string, volume: number = 0.5) {
    if (!this.enabled || typeof window === 'undefined') return

    let audio = this.sounds.get(name)
    
    if (!audio) {
      console.warn(`Sound "${name}" not preloaded`)
      return
    }

    // Clone the audio to allow overlapping plays
    const clone = audio.cloneNode() as HTMLAudioElement
    clone.volume = volume
    clone.play().catch(err => {
      // Ignore errors (user might not have interacted with page yet)
      console.debug('Sound play failed:', err)
    })
  }

  /**
   * Toggle sound on/off
   */
  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled() {
    return this.enabled
  }
}

// Singleton instance
export const soundManager = new SoundManager()

// Game sound effects using data URIs for instant availability
// These are simple beep sounds - replace with actual sound files later

/**
 * Initialize game sounds
 * Call this once when the app loads
 */
export function initGameSounds() {
  // For now, we'll use simple beep sounds via oscillator
  // In production, replace these with actual audio files
  
  // Preload placeholder sounds (empty for now)
  // When you add actual sound files to /public/sounds/, uncomment:
  
  // soundManager.preload('scratch', '/sounds/scratch.mp3')
  // soundManager.preload('spin', '/sounds/spin.mp3')
  // soundManager.preload('win', '/sounds/win.mp3')
  // soundManager.preload('lose', '/sounds/lose.mp3')
  // soundManager.preload('click', '/sounds/click.mp3')
  // soundManager.preload('flip', '/sounds/flip.mp3')
  // soundManager.preload('match', '/sounds/match.mp3')
  // soundManager.preload('dice', '/sounds/dice.mp3')
  // soundManager.preload('catch', '/sounds/catch.mp3')
  // soundManager.preload('stack', '/sounds/stack.mp3')
}

/**
 * Play a simple beep sound using Web Audio API
 * This is a fallback until actual sound files are added
 */
export function playBeep(frequency: number = 440, duration: number = 100, volume: number = 0.3) {
  if (typeof window === 'undefined') return

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration / 1000)
  } catch (err) {
    // Silently fail if audio context not available
    console.debug('Beep failed:', err)
  }
}

/**
 * Game-specific sound helpers
 */
export const gameSounds = {
  // Scratch card
  scratch: () => playBeep(200, 50, 0.2),
  reveal: () => playBeep(600, 200, 0.3),
  
  // Spin wheel
  tick: () => playBeep(400, 30, 0.2),
  spinStart: () => playBeep(300, 100, 0.3),
  spinStop: () => playBeep(500, 150, 0.3),
  
  // General
  win: () => {
    playBeep(523, 100, 0.3) // C
    setTimeout(() => playBeep(659, 100, 0.3), 100) // E
    setTimeout(() => playBeep(784, 200, 0.3), 200) // G
  },
  lose: () => playBeep(200, 300, 0.2),
  click: () => playBeep(440, 50, 0.2),
  
  // Memory game
  flip: () => playBeep(500, 80, 0.2),
  match: () => {
    playBeep(600, 100, 0.3)
    setTimeout(() => playBeep(800, 150, 0.3), 100)
  },
  
  // Dice
  diceRoll: () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playBeep(300 + Math.random() * 200, 50, 0.2), i * 50)
    }
  },
  diceLand: () => playBeep(400, 100, 0.3),
  
  // Catching game
  catch: () => playBeep(600, 80, 0.3),
  miss: () => playBeep(200, 100, 0.2),
  
  // Stacking game
  stack: () => playBeep(500, 80, 0.3),
  topple: () => {
    playBeep(400, 100, 0.3)
    setTimeout(() => playBeep(300, 100, 0.3), 100)
    setTimeout(() => playBeep(200, 200, 0.3), 200)
  },
  
  // Racing game
  tap: () => playBeep(450, 40, 0.2),
  finish: () => {
    playBeep(600, 100, 0.3)
    setTimeout(() => playBeep(700, 100, 0.3), 100)
    setTimeout(() => playBeep(800, 200, 0.3), 200)
  }
}

/**
 * Hook for using sounds in React components
 */
export function useSounds() {
  return {
    soundManager,
    gameSounds,
    playBeep,
  }
}
