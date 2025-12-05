import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BadgeToastComponent } from "./shared/components/badge-toast/badge-toast.component";
import { HomeComponent } from "./features/home/home.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BadgeToastComponent, HomeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'pixasong';
}
