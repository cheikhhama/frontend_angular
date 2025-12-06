import { Component, signal, computed, effect, ViewEncapsulation, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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

  // Demo Audio URL (Free to use sample)
  demoAudio = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  songs: Song[] = [
    { id: 1, title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: '6:12', coverUrl: 'https://picsum.photos/seed/1/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 2, title: 'Vampire', artist: 'Olivia Rodrigo', album: 'GUTS', duration: '7:15', coverUrl: 'https://picsum.photos/seed/2/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 3, title: 'Seven', artist: 'Jung Kook', album: 'Golden', duration: '5:44', coverUrl: 'https://picsum.photos/seed/3/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 4, title: 'Paint The Town Red', artist: 'Doja Cat', album: 'Scarlet', duration: '5:02', coverUrl: 'https://picsum.photos/seed/4/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 5, title: 'Dance The Night', artist: 'Dua Lipa', album: 'Barbie Album', duration: '5:53', coverUrl: 'https://picsum.photos/seed/5/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 6, title: 'Flowers', artist: 'Miley Cyrus', album: 'Endless Summer Vacation', duration: '5:46', coverUrl: 'https://picsum.photos/seed/6/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 7, title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', duration: '4:21', coverUrl: 'https://picsum.photos/seed/7/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 8, title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', duration: '5:20', coverUrl: 'https://picsum.photos/seed/8/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 9, title: 'Rich Flex', artist: 'Drake & 21 Savage', album: 'Her Loss', duration: '4:48', coverUrl: 'https://picsum.photos/seed/9/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 10, title: 'Kill Bill', artist: 'SZA', album: 'SOS', duration: '6:12', coverUrl: 'https://picsum.photos/seed/10/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 11, title: 'Creepin\'', artist: 'Metro Boomin', album: 'Heroes & Villains', duration: '5:33', coverUrl: 'https://picsum.photos/seed/11/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
    { id: 12, title: 'Die For You', artist: 'The Weeknd', album: 'Starboy', duration: '6:10', coverUrl: 'https://picsum.photos/seed/12/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
    { id: 13, title: 'Last Night', artist: 'Morgan Wallen', album: 'One Thing At A Time', duration: '6:30', coverUrl: 'https://picsum.photos/seed/13/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
    { id: 14, title: 'Calm Down', artist: 'Rema & Selena Gomez', album: 'Rave & Roses', duration: '5:27', coverUrl: 'https://picsum.photos/seed/14/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
    { id: 15, title: 'Boy\'s a liar Pt. 2', artist: 'PinkPantheress', album: 'Take me home', duration: '4:35', coverUrl: 'https://picsum.photos/seed/15/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
    { id: 16, title: 'Fast Car', artist: 'Luke Combs', album: 'Gettin\' Old', duration: '7:05', coverUrl: 'https://picsum.photos/seed/16/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
    { id: 17, title: 'Chemical', artist: 'Post Malone', album: 'Austin', duration: '6:12', coverUrl: 'https://picsum.photos/seed/17/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 18, title: 'All My Life', artist: 'Lil Durk', album: 'Almost Healed', duration: '7:15', coverUrl: 'https://picsum.photos/seed/18/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 19, title: 'Ella Baila Sola', artist: 'Eslabon Armado', album: 'Desvelado', duration: '5:44', coverUrl: 'https://picsum.photos/seed/19/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 20, title: 'Unholy', artist: 'Sam Smith', album: 'Gloria', duration: '5:02', coverUrl: 'https://picsum.photos/seed/20/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 21, title: 'Super Shy', artist: 'NewJeans', album: 'Get Up', duration: '5:53', coverUrl: 'https://picsum.photos/seed/21/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 22, title: 'Daylight', artist: 'David Kushner', album: 'Daylight', duration: '5:46', coverUrl: 'https://picsum.photos/seed/22/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 23, title: 'I Remember Everything', artist: 'Zach Bryan', album: 'Zach Bryan', duration: '4:21', coverUrl: 'https://picsum.photos/seed/23/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 24, title: 'What Was I Made For?', artist: 'Billie Eilish', album: 'Barbie Album', duration: '5:20', coverUrl: 'https://picsum.photos/seed/24/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { id: 25, title: 'Lala', artist: 'Myke Towers', album: 'La Vida Es Una', duration: '4:48', coverUrl: 'https://picsum.photos/seed/25/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 26, title: 'Blank Space', artist: 'Taylor Swift', album: '1989', duration: '6:12', coverUrl: 'https://picsum.photos/seed/26/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 27, title: 'Style', artist: 'Taylor Swift', album: '1989', duration: '5:33', coverUrl: 'https://picsum.photos/seed/27/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
    { id: 28, title: 'Bad Blood', artist: 'Taylor Swift', album: '1989', duration: '6:10', coverUrl: 'https://picsum.photos/seed/28/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
    { id: 29, title: 'Shake It Off', artist: 'Taylor Swift', album: '1989', duration: '6:30', coverUrl: 'https://picsum.photos/seed/29/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3' },
    { id: 30, title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: '5:27', coverUrl: 'https://picsum.photos/seed/30/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3' },
    { id: 31, title: 'Heroes', artist: 'David Bowie', album: 'Heroes', duration: '4:35', coverUrl: 'https://picsum.photos/seed/31/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
    { id: 32, title: 'Starman', artist: 'David Bowie', album: 'Ziggy Stardust', duration: '7:05', coverUrl: 'https://picsum.photos/seed/32/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' },
    { id: 33, title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '6:12', coverUrl: 'https://picsum.photos/seed/33/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 34, title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', duration: '7:15', coverUrl: 'https://picsum.photos/seed/34/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 35, title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', duration: '5:44', coverUrl: 'https://picsum.photos/seed/35/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 36, title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', duration: '5:02', coverUrl: 'https://picsum.photos/seed/36/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { id: 37, title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', duration: '5:53', coverUrl: 'https://picsum.photos/seed/37/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { id: 38, title: 'Thriller', artist: 'Michael Jackson', album: 'Thriller', duration: '5:46', coverUrl: 'https://picsum.photos/seed/38/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { id: 39, title: 'Beat It', artist: 'Michael Jackson', album: 'Thriller', duration: '4:21', coverUrl: 'https://picsum.photos/seed/39/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { id: 40, title: 'Take On Me', artist: 'a-ha', album: 'Hunting High and Low', duration: '5:20', coverUrl: 'https://picsum.photos/seed/40/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  ];

  newReleases: Song[] = [
    { id: 41, title: 'Houdini', artist: 'Dua Lipa', album: 'Houdini', duration: '3:05', coverUrl: 'https://picsum.photos/seed/41/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' },
    { id: 42, title: 'Is It Over Now?', artist: 'Taylor Swift', album: '1989 (TV)', duration: '3:49', coverUrl: 'https://picsum.photos/seed/42/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
    { id: 43, title: 'Agora Hills', artist: 'Doja Cat', album: 'Scarlet', duration: '4:25', coverUrl: 'https://picsum.photos/seed/43/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3' },
    { id: 44, title: 'Water', artist: 'Tyla', album: 'Tyla', duration: '3:20', coverUrl: 'https://picsum.photos/seed/44/400/400', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3' },
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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) {
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
