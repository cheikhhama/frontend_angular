import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisualizerComponent } from '../../shared/components/visualizer/visualizer.component';
import { BadgeToastComponent } from '../../shared/components/badge-toast/badge-toast.component';
import { GamificationService } from '../../core/services/gamification.service';
import { AudioService, Song } from '../../core/services/audio.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, VisualizerComponent, BadgeToastComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  gameService = inject(GamificationService);
  audioService = inject(AudioService);

  @ViewChild('audioPlayer') audioRef!: ElementRef<HTMLAudioElement>;

  showWelcome = true;
  showFullPlayer = false;

  // MOCK SONGS (You need to have at least 'music.mp3' in assets, or rename these)
  songs: Song[] = [
    {
      id: 1,
      title: "Midnight City",
      artist: "M83",
      url: "assets/music.mp3", // Make sure this file exists!
      cover: "https://i.scdn.co/image/ab67616d0000b273297b2c53224bd1916fa4a344", 
      color: "#ff00cc",
      lyrics: ["Waiting in a car", "Waiting for a ride in the dark", "Drinking in the lights"]
    },
    {
      id: 2,
      title: "Starboy",
      artist: "The Weeknd",
      url: "assets/music.mp3", // Use different file if you have it
      cover: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png",
      color: "#ff3333",
      lyrics: ["I'm tryna put you in the worst mood, ah", "P1 cleaner than your church shoes, ah"]
    },
    {
      id: 3,
      title: "Instant Crush",
      artist: "Daft Punk",
      url: "assets/music.mp3",
      cover: "https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg",
      color: "#00ccff",
      lyrics: ["I didn't want to be the one to forget", "I thought of everything I'd never regret"]
    }
  ];

  ngAfterViewInit() {
    // Only init if player exists
    if(this.audioRef) {
       this.audioService.initAudio(this.audioRef.nativeElement);
    }
  }

  startJourney() {
    this.showWelcome = false;
  }

  selectSong(song: Song) {
    this.audioService.playSong(this.songs, this.songs.indexOf(song));
    this.showFullPlayer = true;
    
    // Auto-play trigger
    setTimeout(() => {
      if (this.audioRef) {
        this.audioRef.nativeElement.src = song.url;
        this.audioRef.nativeElement.play();
        this.gameService.startTracking();
      }
    }, 100);
  }

  closePlayer() {
    this.showFullPlayer = false;
  }

  onAudioEnded() {
    this.gameService.stopTracking();
    this.audioService.pause();
  }
}