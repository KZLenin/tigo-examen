import { Component, ViewChild } from '@angular/core';
import { SupabaseService } from '../../services/supabase';
import { LoadingController, NavController, IonModal } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  @ViewChild('loginModal') loginModal!: IonModal;
  @ViewChild('registerModal') registerModal!: IonModal;

  // LOGIN
  emailLogin = '';
  passwordLogin = '';

  // REGISTER
  nameRegister = '';
  phoneRegister = '';
  emailRegister = '';
  passwordRegister = '';

  constructor(
    private supabase: SupabaseService,
    private loadingCtrl: LoadingController,
    private nav: NavController
  ) {}

  // ➤ MODALES
  openLoginModal() { this.loginModal.present(); }
  openRegisterModal() { this.registerModal.present(); }
  closeLoginModal() { this.loginModal.dismiss(); }
  closeRegisterModal() { this.registerModal.dismiss(); }

  // ➤ LOGIN CON ROLES
  async login() {
    if (!this.emailLogin || !this.passwordLogin) {
      alert('Completa todos los campos');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Ingresando...',
      spinner: 'crescent',
    });
    loading.present();

    const { data, error } = await this.supabase.signIn(
      this.emailLogin,
      this.passwordLogin
    );

    if (error) {
      loading.dismiss();
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    // CONSULTAR PERFIL
    const { data: perfilData, error: perfilError } =
      await this.supabase.getPerfilById(userId);

    if (perfilError || !perfilData) {
      loading.dismiss();
      alert('No se pudo obtener el rol del usuario');
      return;
    }

    // GUARDAR ROL REAL
    localStorage.setItem('rol', perfilData.rol);

    loading.dismiss();
    this.closeLoginModal();
    this.nav.navigateRoot('/home');
  }

  // ➤ REGISTRO
  async register() {
    if (!this.nameRegister || !this.phoneRegister ||
        !this.emailRegister || !this.passwordRegister) {
      alert('Completa todos los campos');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando cuenta...',
      spinner: 'crescent',
    });
    loading.present();

    const { data, error } = await this.supabase.signUp(
      this.emailRegister,
      this.passwordRegister
    );

    if (error) {
      loading.dismiss();
      alert(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      await this.supabase.insertPerfil(
        userId,
        this.nameRegister,
        this.phoneRegister
      );
    }

    loading.dismiss();
    alert('Cuenta creada correctamente. Ahora inicia sesión.');
    this.closeRegisterModal();
  }

  continueAsGuest() {
    this.nav.navigateRoot('/home');
  }

  async recoverPassword() {
  if (!this.emailLogin) {
    alert('Ingresa tu correo para recuperar la contraseña');
    return;
  }

  const { error } = await this.supabase.getSupabase().auth.resetPasswordForEmail(this.emailLogin);

  if (error) {
    alert(error.message);
    return;
  }

  alert('Te enviamos un correo con instrucciones para restablecer tu contraseña.');
}

}
