import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  // User Stats
  points = signal(0);
  listeningSeconds = signal(0); // Real-life timer
  badges = signal<string[]>([]);
  
  // Community Goal (100,000 minutes = 6,000,000 seconds)
  communitySeconds = signal(450200); 

  private timerInterval: any;

  constructor() {
    this.loadData();
    
    // Simulate community people listening worldwide
    setInterval(() => {
      this.communitySeconds.update(v => v + Math.floor(Math.random() * 10));
    }, 2000);
  }

  startTracking() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.listeningSeconds.update(v => v + 1);
      this.addPoints(1); // 1 Point per second listened
      this.saveData();
    }, 1000);
  }

  stopTracking() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  addPoints(amount: number) {
    this.points.update(p => p + amount);
    this.checkBadges();
  }

  private checkBadges() {
    const mins = this.listeningSeconds() / 60;
    const currentBadges = this.badges();

    if (mins >= 1 && !currentBadges.includes('First Minute')) this.unlockBadge('First Minute');
    if (mins >= 10 && !currentBadges.includes('Vibe Master')) this.unlockBadge('Vibe Master');
    if (mins >= 60 && !currentBadges.includes('Hour Hero')) this.unlockBadge('Hour Hero');
  }

  private unlockBadge(badgeName: string) {
    this.badges.update(b => [...b, badgeName]);
    this.saveData();
  }

  private loadData() {
    const s = localStorage.getItem('nuit_seconds');
    const b = localStorage.getItem('nuit_badges');
    if (s) this.listeningSeconds.set(parseInt(s));
    if (b) this.badges.set(JSON.parse(b));
  }

  private saveData() {
    localStorage.setItem('nuit_seconds', this.listeningSeconds().toString());
    localStorage.setItem('nuit_badges', JSON.stringify(this.badges()));
  }

  // Helper to format 125 seconds -> "02:05"
  formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}