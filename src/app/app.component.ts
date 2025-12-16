import { Component } from '@angular/core';
import { DataService } from './services/data.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private data: DataService,
    private router: Router,
    private auth: AuthService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    // Initialize AuthService to load stored auth data
    await this.auth.init();
    
    // Check login status after auth service is initialized
    await this.checkForLoginStatus();
  }

  async checkForLoginStatus(){
    // Use AuthService to check authentication
    if (this.auth.isAuthenticated() && this.auth.userId.value) {
      console.log("User is authenticated, navigating to home");
      this.router.navigate(['tabs','tabs','tab1'], { replaceUrl: true });
    } else {
      console.log("User is not authenticated, navigating to login");
      this.router.navigate([''], { replaceUrl: true });
    }
  }
}
