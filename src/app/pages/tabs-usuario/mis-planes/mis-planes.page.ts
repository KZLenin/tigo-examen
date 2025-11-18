import { Component, OnInit } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-mis-planes',
  templateUrl: './mis-planes.page.html',
  styleUrls: ['./mis-planes.page.scss'],
  standalone: false
})
export class MisPlanesPage implements OnInit {

  misContrataciones: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarContrataciones();
  }

  async cargarContrataciones() {
    this.cargando = true;

    const { data: userData } = await this.supabase.getSupabase().auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await this.supabase.getMisContrataciones(user.id);

    if (!error) {
      this.misContrataciones = data;
    }

    this.cargando = false;
  }

  async contratar(planId: number) {
    const { data: userData } = await this.supabase.getSupabase().auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { error } = await this.supabase.contratarPlan(planId);


    if (error) {
      alert("Error al contratar: " + error.message);
      return;
    }

    alert("Solicitud enviada con éxito.");
    this.cargarContrataciones();
  }
}