import { Component, OnInit } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {

  perfil: any = null;
  userEmail: string = "";

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.cargarPerfil();
  }

  async cargarPerfil() {
    // obtener cliente supabase
    const supabase = this.supabaseService.getSupabase();

    // Obtener usuario
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    const user = userData.user;
    this.userEmail = user.email ?? "";


    // Obtener perfil
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!perfil) return;

    // Convertir avatar_path → URL
    if (perfil.avatar_path) {
      const { data } = supabase.storage
        .from("planes-imagenes")
        .getPublicUrl(perfil.avatar_path);

      perfil.avatar_url = data.publicUrl;
    }

    this.perfil = perfil;
  }
}
