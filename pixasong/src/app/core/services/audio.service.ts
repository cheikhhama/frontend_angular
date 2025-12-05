import { Injectable, signal } from '@angular/core';

export interface Song {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
  color: string;
  lyrics: string[];
}

@Injectable({ providedIn: 'root' })
export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  
  // Signals
  isPlaying = signal(false);
  currentSong = signal<Song | null>(null);
  
  // NEW: Queue Management
  queue = signal<Song[]>([]);
  currentIndex = signal(0);

  initAudio(audioElement: HTMLAudioElement) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.connect(this.audioContext.destination);
      this.analyser.fftSize = 256; 
    }

    try {
      if (this.source) this.source.disconnect();
      const newSource = this.audioContext!.createMediaElementSource(audioElement);
      newSource.connect(this.analyser!); 
      this.source = newSource;
    } catch (err) {
      // Ignore error if element is already connected
    }
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      const data = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(data);
      return data;
    }
    return new Uint8Array(0);
  }

  // MODIFIED: Now expects an array of songs and a starting index
  playSong(songs: Song[], index: number = 0) {
    this.queue.set(songs);
    this.currentIndex.set(index);
    
    const song = songs[index];
    if (song) {
      this.currentSong.set(song);
      this.play(); 
    }
  }

  async play() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.isPlaying.set(true);
  }

  pause() {
    this.isPlaying.set(false);
  }

  resume() {
    this.isPlaying.set(true);
  }

  // NEW: Navigation controls
  next() {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.queue().length) {
      this.playSong(this.queue(), nextIndex);
    }
  }

  prev() {
    const prevIndex = this.currentIndex() - 1;
    if (prevIndex >= 0) {
      this.playSong(this.queue(), prevIndex);
    }
  }
}