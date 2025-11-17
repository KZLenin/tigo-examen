import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  // ========= AUTH =========

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({
      email,
      password,
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  // ========= PERFILES =========

  insertPerfil(id: string, nombre: string, telefono: string) {
  return this.supabase.from('perfiles').insert({
    id,
    nombre,
    telefono,
    rol: 'usuario_registrado'
  });
}


  getPerfilById(id: string) {
    return this.supabase.from('perfiles').select('*').eq('id', id).single();
  }

  // ========= PLANES =========

  getPlanes() {
    return this.supabase.from('planes_moviles').select('*');
  }

  getSupabase() {
    return this.supabase;
  }
}
