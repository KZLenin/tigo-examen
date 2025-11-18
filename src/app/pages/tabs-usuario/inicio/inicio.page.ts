import { Component, OnInit } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: false
})
export class InicioPage implements OnInit {

  planes: any[] = [];
  cargando = true;

  constructor(
    private supabase: SupabaseService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.cargarPlanes();
  }

  async cargarPlanes() {
    const { data, error } = await this.supabase.getPlanesConImagen();

    if (!error) this.planes = data || [];
    this.cargando = false;
  }

  async contratar(planId: number) {
    const { error } = await this.supabase.contratarPlan(planId);

    if (error) {
      this.mostrarToast("Error al solicitar el plan");
      return;
    }

    this.mostrarToast("Solicitud enviada correctamente");
  }

  async mostrarToast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      color: 'success'
    });
    t.present();
  }
}