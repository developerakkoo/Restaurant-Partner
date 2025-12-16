import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { PartnerLoginRequest, PartnerLoginResponse } from '../models/auth.models';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  form!: FormGroup;
  isLoggingIn: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private auth: AuthService,
    private loadingController: LoadingController
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if already logged in
    this.checkExistingAuth();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize login form with validators
   */
  private initializeForm(): void {
    this.form = this.formBuilder.group({
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{10}$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      isAgreed: [false, [Validators.requiredTrue]],
    });
  }

  /**
   * Check if user is already authenticated
   */
  private async checkExistingAuth(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      const hotelCount = this.auth.hotelCount.value;
      const hotelId = this.auth.shopId.value;

      if (!hotelId && hotelCount === 0) {
        this.router.navigate(['hotel'], { replaceUrl: true });
      } else {
        this.router.navigate(['tabs', 'tabs', 'tab1'], { replaceUrl: true });
      }
    }
  }

  /**
   * Get form control for easy access
   */
  get phoneNumberControl(): AbstractControl | null {
    return this.form.get('phoneNumber');
  }

  /**
   * Get validation error message
   */
  getPhoneNumberErrorMessage(): string {
    const control = this.phoneNumberControl;
    if (control?.hasError('required')) {
      return 'Phone number is required';
    }
    if (control?.hasError('pattern') || control?.hasError('minlength') || control?.hasError('maxlength')) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  }

  /**
   * Present toast notification
   */
  private async presentToast(
    message: string,
    duration: number = 2000,
    color: 'success' | 'danger' | 'warning' | 'primary' = 'primary',
    position: 'top' | 'bottom' | 'middle' = 'bottom'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color,
      position,
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  /**
   * Handle login submission
   */
  async login(): Promise<void> {
    if (!this.form.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.form.get('isAgreed')?.value) {
      await this.presentToast('Please agree to terms and conditions', 2000, 'warning', 'bottom');
      return;
    }

    this.isLoggingIn = true;
    const loading = await this.loadingController.create({
      message: 'Logging in...',
      animated: true,
      spinner: 'crescent',
    });

    await loading.present();

    const loginRequest: PartnerLoginRequest = {
      phoneNumber: this.form.value.phoneNumber.trim(),
    };

    const loginSubscription = this.auth.login(loginRequest).subscribe({
      next: async (response: PartnerLoginResponse) => {
        this.isLoggingIn = false;
        await loading.dismiss();

        if (!response?.data) {
          await this.presentToast('Invalid response from server', 2000, 'danger', 'bottom');
          return;
        }

        const { hotelId, hotelCount } = response.data;

        // Show success message
        await this.presentToast('Logged in successfully!', 2000, 'success', 'bottom');

        // Navigate based on hotel status
        await this.navigateAfterLogin(hotelId, hotelCount);
      },
      error: async (error: HttpErrorResponse) => {
        this.isLoggingIn = false;
        await loading.dismiss();

        console.error('Login error:', error);

        let errorMessage = 'Login failed. Please try again.';
        if (error?.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Handle specific error cases
        if (error?.status === 404) {
          errorMessage = 'User not found. Please register first.';
        } else if (error?.status === 401) {
          errorMessage = 'Invalid credentials. Please check your phone number.';
        } else if (error?.status === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        }

        await this.presentToast(errorMessage, 3000, 'danger', 'bottom');
      },
    });

    this.subscriptions.add(loginSubscription);
  }

  /**
   * Navigate user after successful login
   */
  private async navigateAfterLogin(hotelId: any, hotelCount: number): Promise<void> {
    // Small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (hotelId === null && hotelCount === 0) {
      // No hotels - navigate to hotel registration
      this.router.navigate(['hotel'], { replaceUrl: true });
    } else if (hotelId !== null && hotelCount > 0) {
      // Hotels exist - navigate to home
      this.router.navigate(['tabs', 'tabs', 'tab1'], { replaceUrl: true });
    } else {
      // Fallback to home
      this.router.navigate(['tabs', 'tabs', 'tab1'], { replaceUrl: true });
    }
  }
}
