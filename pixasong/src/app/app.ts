import { Component, signal, computed, effect, ViewEncapsulation, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { extractColors } from './utils/color-extractor';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: string;
  audioUrl?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string; // SVG path data (d attribute)
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  encapsulation: ViewEncapsulation.None
})
export class App {
  // --- STATE ---
  activeTab = signal('listen-now');
  isPlaying = signal(false);
  listeningTime = signal(0); // Time in seconds
  volume = signal(0.5); // Volume 0 to 1

  // Real Audio Object (Client only)
  audio: HTMLAudioElement | undefined;

  formattedTime = computed(() => {
    const totalSeconds = this.listeningTime();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  });

  // --- MOCK DATA ---
  navItems: Category[] = [
    {
      id: 'listen-now',
      name: 'Listen Now',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z'
    },
    {
      id: 'browse',
      name: 'Browse',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
    },
    {
      id: 'radio',
      name: 'Radio',
      icon: 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H3.24zM12 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm8-9.25l-7.25 2.72c-.22.08-.47.05-.66-.11L8.5 4.5c-.32-.26-.14-.76.28-.76h7.5c.37 0 .69.23.83.56l.89 2.45z'
    },
  ];

  isPixelMode = signal(false);

  togglePixelMode() {
    this.isPixelMode.update(v => !v);
  }

  // add songs to playlist (assets/music)
  playlist = [
    'assets/music/BAUWZ - IF YOU SAID GOODBYE.m4a',
    'assets/music/Lucas_Larvenz_REDRUM.m4a',
    'assets/music/Olivia Rodrigo - vampire.m4a',
    'assets/music/Taylor Swift - Cruel Summer.m4a',
    "assets/music/L7OR_HES_BIYA.m4a",
  ]
  coverlist = [
    'assets/cover/photo_1.jpg',
    'assets/cover/photo_2.jpg',
    'assets/cover/photo_3.jpg',
    'assets/cover/photo_4.jpg',
    'assets/cover/photo_5.jpg',
  ];


  // Demo Audio URL
  demoAudio = this.playlist[0];
  demoCover = this.coverlist[0];

  songs: Song[] = [
    { id: 1, title: 'If You Said Goodbye', artist: 'BAUWZ', album: '7clouds', duration: '2:20', coverUrl: this.coverlist[1], audioUrl: this.playlist[0] },
    { id: 2, title: 'Redrum', artist: 'Lucas Larvenz', album: '7clouds', duration: '2:55', coverUrl:this.coverlist[3], audioUrl: this.playlist[1] },
    { id: 3, title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', duration: '3:40', coverUrl:this.coverlist[2], audioUrl: this.playlist[2] },
    { id: 4, title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: '2:58', coverUrl: this.coverlist[4], audioUrl: this.playlist[3] },
    { id: 5, title: "HES BIYA", artist: 'L7OR', album: '', duration: '4:14', coverUrl: this.coverlist[0], audioUrl: this.playlist[4] },

  ];

  newReleases: Song[] = [
    { id: 1, title: 'If You Said Goodbye', artist: 'BAUWZ', album: '7clouds', duration: '2:20', coverUrl: this.coverlist[1], audioUrl: this.playlist[0] },
    { id: 2, title: 'Redrum', artist: 'Lucas Larvenz', album: '7clouds', duration: '2:55', coverUrl:this.coverlist[3], audioUrl: this.playlist[1] },
    { id: 3, title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', duration: '3:40', coverUrl:this.coverlist[2], audioUrl: this.playlist[2] },
    { id: 4, title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: '2:58', coverUrl: this.coverlist[4], audioUrl: this.playlist[3] },
    { id: 5, title: "HES BIYA", artist: 'L7OR', album: '', duration: '4:14', coverUrl: this.coverlist[0], audioUrl: this.playlist[4] },
 ];

  currentSong = signal<Song>(this.songs[0]);
  isPlayerOpen = signal(false);
  isPlayerVisible = signal(false);

  // Reward System & Timer
  streak = signal(0);
  visualizerBars = new Array(50); // For generating visualizer bars
  showReward = signal(false);
  currentSongTime = signal(0); // Current song progress in seconds
  audioDuration = signal(0); // Add duration signal

  songProgressPercent = computed(() => {
    const duration = this.audioDuration();
    if (!duration || duration === 0) return 0;
    return (this.currentSongTime() / duration) * 100;
  });

  // Goal: 100,000 minutes = 6,000,000 seconds
  goalProgressPercent = computed(() => {
    const GOAL_SECONDS = 60000; // Demo mode: 1 minute goal
    return (this.listeningTime() / GOAL_SECONDS) * 100;
  });

  remainingGoalTime = computed(() => {
    const GOAL_MINUTES = 1000; // Demo mode: 1 minute goal
    const listenedMinutes = Math.floor(this.listeningTime() / 60);
    const remaining = Math.max(0, GOAL_MINUTES - listenedMinutes); // Ensure non-negative
    return remaining.toLocaleString();
  });

  formattedCurrentTime = computed(() => this.formatTime(this.currentSongTime()));

  // Dynamic Background Colors (Apple Music Style)
  readonly COLOR_PALETTES = [
    ['#ff0080', '#ff8c00', '#40e0d0'], // Vibrant
    ['#2193b0', '#6dd5ed', '#2193b0'], // Ocean
    ['#cc2b5e', '#753a88', '#cc2b5e'], // Purple/Pink
    ['#000000', '#0f9b0f', '#000000'], // Matrix/Dark
    ['#fc4a1a', '#f7b733', '#fc4a1a'], // Sunset
  ];

  extractedColors = signal<string[]>([]);

  currentColors = computed(() => {
    if (this.extractedColors().length > 0) {
      return this.extractedColors();
    }
    const songId = this.currentSong().id;
    return this.COLOR_PALETTES[songId % this.COLOR_PALETTES.length];
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) {
    // Extract colors when song changes
    effect(() => {
      const coverUrl = this.currentSong().coverUrl;
      if (isPlatformBrowser(this.platformId) && coverUrl) {
        extractColors(coverUrl).then(colors => {
          if (colors.length > 0) {
            // If we found colors, use them. 
            // Fill up to 3 colors if needed by repeating
            const finalColors = [...colors];
            while (finalColors.length < 3) {
              finalColors.push(finalColors[0]);
            }
            this.extractedColors.set(finalColors);
          } else {
            this.extractedColors.set([]);
          }
        });
      }
    }, { allowSignalWrites: true });

    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio();
      // Configure global audio events
      this.audio.volume = 0.5;

      this.audio.addEventListener('loadedmetadata', () => {
        this.ngZone.run(() => {
          if (this.audio) this.audioDuration.set(this.audio.duration);
        });
      });

      this.audio.addEventListener('durationchange', () => {
        this.ngZone.run(() => {
          if (this.audio) this.audioDuration.set(this.audio.duration);
        });
      });

      this.audio.addEventListener('timeupdate', () => {
        this.ngZone.run(() => {
          if (this.audio) this.currentSongTime.set(this.audio.currentTime);
        });
      });

      this.audio.addEventListener('ended', () => {
        this.ngZone.run(() => {
          this.next();
        });
      });

      // Error handling (auto-recovery)
      this.audio.addEventListener('error', (e) => {
        console.error("Audio error", e);
        // Auto-skip to next song if current one fails
        setTimeout(() => {
          this.ngZone.run(() => this.next());
        }, 1000);
      });
    }

    effect((onCleanup) => {
      let interval: any;

      // Global timer for rewards only (independent of song progress)
      if (this.isPlaying()) {
        interval = setInterval(() => {
          this.listeningTime.update(t => t + 1);

          // Reward System
          if (this.listeningTime() > 0 && this.listeningTime() % 30 === 0) {
            this.streak.update(s => s + 1);
            this.showReward.set(true);
            setTimeout(() => this.showReward.set(false), 3000);
          }
        }, 1000);
      }

      onCleanup(() => {
        if (interval) clearInterval(interval);
      });
    });

    // Persistence for Pixel Mode
    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('pixelMode');
      if (savedMode !== null) {
        this.isPixelMode.set(savedMode === 'true');
      }
    }

    effect(() => {
      const isPixel = this.isPixelMode();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('pixelMode', String(isPixel));
      }
    });
  }

  // --- LOGIC ---
  togglePlay() {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying.set(true);
    } else {
      this.audio.pause();
      this.isPlaying.set(false);
    }
  }

  seek(event: MouseEvent) {
    if (!this.audio) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;

    // Calculate new time
    const newTime = percentage * this.audio.duration;

    // Update audio
    if (!isNaN(newTime) && isFinite(newTime)) {
      this.audio.currentTime = newTime;
      this.currentSongTime.set(newTime);
    }
  }

  setVolume(event: any) {
    if (!this.audio) return;
    const vol = event.target.value / 100;
    this.audio.volume = vol;
    this.volume.set(vol);
  }

  setVolumeOnClick(event: MouseEvent) {
    if (!this.audio) return;
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    let newVolume = clickX / width;

    // Clamp volume between 0 and 1
    newVolume = Math.max(0, Math.min(1, newVolume));

    this.audio.volume = newVolume;
    this.volume.set(newVolume);
  }

  playRandomSong() {
    const allSongs = [...this.songs, ...this.newReleases];
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    this.playSong(allSongs[randomIndex]);
  }

  playSong(song: Song) {
    this.currentSong.set(song);
    this.isPlayerVisible.set(true);

    if (this.audio) {
      // Use song audio or fallback to demo
      this.audio.src = song.audioUrl || this.demoAudio;
      this.audio.load();
      this.audio.play().then(() => {
        this.isPlaying.set(true);
      }).catch(err => {
        console.error("Playback failed", err);
        this.isPlaying.set(false);
      });
    }
  }

  // --- HELPERS ---
  parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  next() {
    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong().id);
    const nextIndex = (currentIndex + 1) % this.songs.length;
    this.playSong(this.songs[nextIndex]);
  }

  previous() {
    const currentIndex = this.songs.findIndex(s => s.id === this.currentSong().id);
    const prevIndex = currentIndex === 0 ? this.songs.length - 1 : currentIndex - 1;
    this.playSong(this.songs[prevIndex]);
  }
}
