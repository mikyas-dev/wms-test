// Keep a single AudioContext instance
let audioContext: AudioContext | null = null

export function playErrorSound() {
  // Only run on client and if we're in a browser that supports Audio
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      // Create or resume AudioContext
      if (!audioContext) {
        audioContext = new AudioContext()
      }
      
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = 440 // A4 note
      gainNode.gain.value = 0.1 // Lower volume

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1) // Short 100ms beep

      // Clean up
      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
      }
    } catch (error) {
      console.error('Error playing error sound:', error)
    }
  }
} 