/**
 * Pure Web Audio API Ambient Sound Synthesizer.
 * Generates procedural natural soundscapes (Rain, Fireplace, Cafe murmur)
 * without needing external MP3 audio files or internet connection.
 */

export type AmbientSoundType = 'none' | 'rain' | 'fire' | 'cafe';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private gainNode: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private timerId: number | null = null;
  private volume: number = 0.3;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
    }
  }

  public stop() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.noiseNode) {
      try {
        if ('stop' in this.noiseNode) {
          (this.noiseNode as AudioBufferSourceNode).stop();
        }
        this.noiseNode.disconnect();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {
        // ignore
      }
      this.gainNode = null;
    }
    this.currentType = 'none';
  }

  public play(type: AmbientSoundType) {
    this.stop();
    if (type === 'none') return;

    try {
      const ctx = this.getAudioContext();
      this.currentType = type;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.gainNode = masterGain;

      if (type === 'rain') {
        this.startRain(ctx, masterGain);
      } else if (type === 'fire') {
        this.startFire(ctx, masterGain);
      } else if (type === 'cafe') {
        this.startCafe(ctx, masterGain);
      }
    } catch (err) {
      console.warn('Gagal memulai ambient sound:', err);
    }
  }

  private startRain(ctx: AudioContext, destination: AudioNode) {
    // Generate pink noise buffer (2 seconds loop)
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to simulate soft raindrops hitting windows
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(destination);
    noiseSource.start();
    this.noiseNode = noiseSource;
  }

  private startFire(ctx: AudioContext, destination: AudioNode) {
    // Warm low-pass background roar
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(destination);
    noiseSource.start();
    this.noiseNode = noiseSource;

    // Procedural random crackle bursts
    this.timerId = window.setInterval(() => {
      if (Math.random() > 0.4) {
        const crackleBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
        const crackleData = crackleBuffer.getChannelData(0);
        for (let i = 0; i < crackleData.length; i++) {
          crackleData[i] = (Math.random() * 2 - 1) * (1 - i / crackleData.length) * 0.5;
        }
        const crackle = ctx.createBufferSource();
        crackle.buffer = crackleBuffer;
        const crackleGain = ctx.createGain();
        crackleGain.gain.setValueAtTime(0.25 * Math.random(), ctx.currentTime);
        crackle.connect(crackleGain);
        crackleGain.connect(destination);
        crackle.start();
      }
    }, 280);
  }

  private startCafe(ctx: AudioContext, destination: AudioNode) {
    // Warm blended cafe chatter murmur
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.035;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(destination);
    noiseSource.start();
    this.noiseNode = noiseSource;
  }
}

export const ambientSound = new AmbientSoundEngine();
