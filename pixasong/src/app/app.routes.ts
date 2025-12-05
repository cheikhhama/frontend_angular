import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { RetroComponent } from './features/retro/retro.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'SoundWave - Modern' },
  { path: 'retro', component: RetroComponent, title: 'SoundWave - 8Bit' },
  { path: '**', redirectTo: '' }
];