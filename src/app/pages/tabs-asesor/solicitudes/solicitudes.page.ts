import { Component, OnInit } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-solicitudes',
  templateUrl: './solicitudes.page.html',
  styleUrls: ['./solicitudes.page.scss'],
  standalone: false
})
export class SolicitudesPage implements OnInit {

   solicitudes: any[] = [];
  cargando = true;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    this.cargando = true;

    const { data, error } = await this.supabase.getSolicitudes();

    if (!error) this.solicitudes = data;

    this.cargando = false;
  }

  async aceptar(id: number) {
    await this.supabase.actualizarSolicitud(id, 'aprobada');
    this.cargarSolicitudes();
  }

  async rechazar(id: number) {
    await this.supabase.actualizarSolicitud(id, 'rechazada');
    this.cargarSolicitudes();
  }
}