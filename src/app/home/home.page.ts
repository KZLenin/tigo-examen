import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  planes: any[] = [];
  cargando = true;
  rol = localStorage.getItem('rol');  // null si es invitado

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarPlanes();
  }

  async cargarPlanes() {
    this.cargando = true;

    const { data, error } = await this.supabase.getPlanesConImagen();

    if (error) {
      console.error(error);
      this.cargando = false;
      return;
    }

    this.planes = data;
    this.cargando = false;
  }

}
