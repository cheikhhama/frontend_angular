import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisualizerComponent } from '../../shared/components/visualizer/visualizer.component';
import { BadgeToastComponent } from '../../shared/components/badge-toast/badge-toast.component';
import { GamificationService } from '../../core/services/gamification.service';

@Component({
  selector: 'app-retro',
  standalone: true,
  imports: [CommonModule, RouterLink, VisualizerComponent, BadgeToastComponent],
  templateUrl: './retro.component.html',
  styleUrls: ['./retro.component.css']
})
export class RetroComponent {
  gameService = inject(GamificationService);
}