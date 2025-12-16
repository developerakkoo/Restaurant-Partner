import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  PartnerRegisterRequest,
  PartnerRegisterResponse,
} from '../models/auth.models';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit, OnDestroy {
  form!: FormGroup;
  isRegistering: boolean = false;
  showPassword: boolean = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private auth: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Check if already logged in
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['tabs', 'tabs', 'tab1'], { replaceUrl: true });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize registration form with validators
   */
  private initializeForm(): void {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        ],
      ],
      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{10}$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
        ],
      ],
    });
  }

  /**
   * Get form controls for easy access
   */
  get nameControl(): AbstractControl | null {
    return this.form.get('name');
  }

  get emailControl(): AbstractControl | null {
    return this.form.get('email');
  }

  get phoneNumberControl(): AbstractControl | null {
    return this.form.get('phoneNumber');
  }

  get passwordControl(): AbstractControl | null {
    return this.form.get('password');
  }

  /**
   * Get validation error messages
   */
  getFieldErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.hasError('email') || (control.hasError('pattern') && fieldName !== 'password')) {
      return `Please enter a valid ${this.getFieldLabel(fieldName)}`;
    }
    if (control.hasError('minlength')) {
      const requiredLength = control.errors['minlength'].requiredLength;
      if (fieldName === 'password') {
        return `Password must be at least ${requiredLength} characters`;
      }
      return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
    }
    if (control.hasError('maxlength')) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must not exceed ${requiredLength} characters`;
    }
    if (control.hasError('pattern') && fieldName === 'password') {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }

    return 'Invalid input';
  }

  /**
   * Get field label for error messages
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      email: 'Email',
      phoneNumber: 'Phone number',
      password: 'Password',
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
   * Handle registration submission
   */
  async register(): Promise<void> {
    if (!this.form.valid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
      await this.presentToast('Please fill all fields correctly', 2000, 'warning', 'bottom');
      return;
    }

    this.isRegistering = true;
    const loading = await this.loadingController.create({
      message: 'Creating your account...',
      animated: true,
      spinner: 'crescent',
    });

    await loading.present();

    const registerRequest: PartnerRegisterRequest = {
      name: this.form.value.name.trim(),
      email: this.form.value.email.trim().toLowerCase(),
      phoneNumber: this.form.value.phoneNumber.trim(),
      password: this.form.value.password,
    };

    const registerSubscription = this.auth.register(registerRequest).subscribe({
      next: async (response: PartnerRegisterResponse) => {
        this.isRegistering = false;
        await loading.dismiss();

        if (!response?.data) {
          await this.presentToast('Invalid response from server', 2000, 'danger', 'bottom');
          return;
        }

        // Show success message
        await this.presentToast(
          'Registration successful! Redirecting to login...',
          2000,
          'success',
          'bottom'
        );

        // Navigate to login page after short delay
        setTimeout(() => {
          this.router.navigate([''], { replaceUrl: true });
        }, 2000);
      },
      error: async (error: HttpErrorResponse) => {
        this.isRegistering = false;
        await loading.dismiss();

        console.error('Registration error:', error);

        let errorMessage = 'Registration failed. Please try again.';
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
        if (error?.status === 409) {
          errorMessage = 'User already exists. Please login instead.';
        } else if (error?.status === 400) {
          errorMessage = 'Invalid data. Please check your inputs.';
        } else if (error?.status === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        }

        await this.presentToast(errorMessage, 3000, 'danger', 'bottom');
      },
    });

    this.subscriptions.add(registerSubscription);
  }
}
