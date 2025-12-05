import { Component, signal, computed, effect, ViewEncapsulation, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: string;
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

  // Demo Audio URL (Free to use sample)
  demoAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  songs: Song[] = [
    { id: 1, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '4:03', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop' },
    { id: 2, title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: '3:50', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&h=400&fit=crop' },
    { id: 3, title: 'Neon Lights', artist: 'Demi Lovato', album: 'Demi', duration: '3:53', coverUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=400&h=400&fit=crop' },

    { id: 10, title: 'Breathe', artist: 'Pink Floyd', album: 'Dark Side of the Moon', duration: '2:43', coverUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=400&fit=crop' },
    { id: 12, title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', coverUrl: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&h=400&fit=crop' },
    { id: 15, title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '6:30', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
    { id: 16, title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration: '5:56', coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop' },
    { id: 17, title: 'Imagine', artist: 'John Lennon', album: 'Imagine', duration: '3:03', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop' },
  ];

  newReleases: Song[] = [
    { id: 6, title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration: '3:20', coverUrl: 'https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop' },
    { id: 8, title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', duration: '2:47', coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop' },
    { id: 9, title: 'Rich Flex', artist: 'Drake & 21 Savage', album: 'Her Loss', duration: '3:59', coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop' },
    { id: 13, title: 'Kill Bill', artist: 'SZA', album: 'SOS', duration: '2:33', coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop' },
    { id: 14, title: 'Creepin\'', artist: 'Metro Boomin', album: 'Heroes & Villains', duration: '3:41', coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop' },
  ];

  currentSong = signal<Song>(this.songs[0]);
  isPlayerOpen = signal(false);
  isPlayerVisible = signal(false);

  // Reward System & Timer
  streak = signal(0);
  visualizerBars = new Array(50); // For generating visualizer bars
  showReward = signal(false);
  currentSongTime = signal(0); // Current song progress in seconds

  songProgressPercent = computed(() => {
    if (!this.audio) return 0;
    // Use actual audio duration if available
    const duration = this.audio.duration;
    if (!duration || isNaN(duration)) return 0;
    return (this.currentSongTime() / duration) * 100;
  });

  // Goal: 100,000 minutes = 6,000,000 seconds
  goalProgressPercent = computed(() => {
    const GOAL_SECONDS = 6000000;
    return (this.listeningTime() / GOAL_SECONDS) * 100;
  });

  remainingGoalTime = computed(() => {
    const GOAL_MINUTES = 1000;
    const listenedMinutes = Math.floor(this.listeningTime() / 60);
    return (GOAL_MINUTES - listenedMinutes).toLocaleString();
  });

  formattedCurrentTime = computed(() => this.formatTime(this.currentSongTime()));

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio();
      // Configure global audio events
      this.audio.volume = 0.5;

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) this.currentSongTime.set(this.audio.currentTime);
      });

      this.audio.addEventListener('ended', () => {
        this.next();
      });

      // Error handling (auto-recovery for demo)
      this.audio.addEventListener('error', (e) => {
        console.error("Audio error", e);
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

  setVolume(event: any) {
    if (!this.audio) return;
    const vol = event.target.value / 100;
    this.audio.volume = vol;
    this.volume.set(vol);
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
      // Use demo audio for everything for now
      this.audio.src = this.demoAudio;
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
