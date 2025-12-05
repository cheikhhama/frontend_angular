import { Component, ElementRef, ViewChild, AfterViewInit, Input, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visualizer-container">
      <canvas #canvas [width]="width" [height]="height"></canvas>
      
      <!-- Audio Player (Hidden or Visible depending on preference) -->
      <audio #audioPlayer src="assets/music.mp3" controls 
             (play)="onPlay()" (pause)="onPause()"></audio>
    </div>
  `,
  styleUrls: ['./visualizer.component.css']
})
export class VisualizerComponent implements AfterViewInit, OnDestroy {
  @Input() mode: 'modern' | 'retro' = 'modern';
  @Input() width = 600;
  @Input() height = 200;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioPlayer') audioRef!: ElementRef<HTMLAudioElement>;

  private audioService = inject(AudioService);
  private animationId: number = 0;
  private isRunning = false;

  ngAfterViewInit() {
    // Connect audio element to service once view is ready
    this.audioService.initAudio(this.audioRef.nativeElement);
  }

  onPlay() {
    this.audioService.play();
    this.isRunning = true;
    this.loop();
  }

  onPause() {
    this.audioService.pause();
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  loop() {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this.loop());
    const data = this.audioService.getFrequencyData();
    
    if (this.mode === 'modern') {
      this.drawModern(data);
    } else {
      this.drawRetro(data);
    }
  }

  // DRAW STYLE 1: Modern (Smooth, Gradient, Rounded)
  drawModern(data: Uint8Array) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);

    const barWidth = (this.width / data.length) * 2.5;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const barHeight = data[i] / 1.5;
      
      // Modern Gradient Color
      const gradient = ctx.createLinearGradient(0, this.height, 0, this.height - barHeight);
      gradient.addColorStop(0, '#4facfe');
      gradient.addColorStop(1, '#00f2fe');

      ctx.fillStyle = gradient;
      
      // Draw rounded top bars
      ctx.beginPath();
      ctx.roundRect(x, this.height - barHeight, barWidth, barHeight, 5);
      ctx.fill();

      x += barWidth + 1;
    }
  }

  // DRAW STYLE 2: Retro (Blocky, Green, Pixelated)
  drawRetro(data: Uint8Array) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;
    
    // Clear with slight trail effect for retro feel? No, let's keep it sharp.
    ctx.fillStyle = '#000000'; // Ensure background is black
    ctx.fillRect(0, 0, this.width, this.height);

    const barWidth = (this.width / data.length) * 3; // Wider bars
    let x = 0;

    ctx.fillStyle = '#00ff00'; // Classic Matrix Green

    for (let i = 0; i < data.length; i++) {
      const barHeight = data[i] / 1.8;
      
      // Draw as distinct blocks
      const numBlocks = Math.floor(barHeight / 10);
      
      for (let j = 0; j < numBlocks; j++) {
        // Draw small squares with gaps
        ctx.fillRect(x, this.height - (j * 12), barWidth - 2, 10);
      }

      x += barWidth;
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }
}
