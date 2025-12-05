import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../../core/services/gamification.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-badge-toast',
  standalone: true,
  imports: [CommonModule,RouterLink],
  template: `
    <div class="toast" *ngIf="show()">
      <div class="icon">🏆</div>
      <div class="content">
        <h4>Badge Unlocked!</h4>
        <p>{{ lastBadge }}</p>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 15px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 15px;
      animation: slideIn 0.5s ease-out;
      z-index: 1000;
      border-left: 5px solid #FFD700;
    }
    .icon { font-size: 2rem; }
    h4 { margin: 0; color: #333; }
    p { margin: 0; color: #666; font-size: 0.9rem; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class BadgeToastComponent {
  gameService = inject(GamificationService);
  show = signal(false);
  lastBadge = '';
  private previousBadgeCount = 0;

  constructor() {
    // Effect runs whenever badges signal changes
    effect(() => {
      const badges = this.gameService.badges();
      if (badges.length > this.previousBadgeCount) {
        this.lastBadge = badges[badges.length - 1];
        this.showToast();
        this.previousBadgeCount = badges.length;
      }
    });
  }

  showToast() {
    this.show.set(true);
    setTimeout(() => this.show.set(false), 4000);
  }
}