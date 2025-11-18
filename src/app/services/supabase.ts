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
  
  async getPlanesConImagen() {
  const { data, error } = await this.supabase
    .from('planes_moviles')
    .select('*')
    .order('precio', { ascending: true });

  if (error) return { data: null, error };

  // Convertir imagen_path → URL pública
  const planesConUrl = data.map(plan => {
    let url = null;
    if (plan.imagen_path) {
      const { data } = this.supabase
        .storage
        .from('planes-imagenes')
        .getPublicUrl(plan.imagen_path);

      url = data.publicUrl;
    }
    return { ...plan, imagen_url: url };
  });

  return { data: planesConUrl, error: null };
  }
  // ========= CRUD PLANES (Solo asesores) =========

crearPlan(plan: any) {
  return this.supabase.from('planes_moviles').insert(plan);
}

actualizarPlan(id: number, plan: any) {
  return this.supabase
    .from('planes_moviles')
    .update(plan)
    .eq('id', id);
}

eliminarPlan(id: number) {
  return this.supabase
    .from('planes_moviles')
    .delete()
    .eq('id', id);
  }

  // ========= SOLICITUDES =========
  getSolicitudes() {
  return this.supabase
    .from('contrataciones')
    .select(`
      *,
      usuario:usuario_id(nombre, telefono),
      plan:plan_id(nombre_comercial, precio)
    `)
    .order('id', { ascending: false });
}
  async actualizarSolicitud(id: number, nuevoEstado: string) {
  // Obtener el usuario actual (asesor que cambia el estado)
  const { data: userData, error: userError } = await this.supabase.auth.getUser();

  if (userError) {
    return { data: null, error: userError };
  }

  const user = userData.user;

  // Actualizar la solicitud
  return this.supabase
    .from('contrataciones')
    .update({
      estado: nuevoEstado,
      asesor_id: user?.id
    })
    .eq('id', id);
}

// --------- CHAT / REALTIME ----------
/**
 * Obtener lista de chats con info de contratacion, usuario y plan
 * Devuelve filas con: chat.id, contratacion_id, usuario (nombre, telefono), plan (nombre_comercial, precio), ultimo_mensaje (opcional)
 */
getChatsParaAsesor() {
  return this.supabase
    .from('chats')
    .select(`id, contratacion_id,
      contratacion:contratacion_id(
        id, estado, usuario_id, plan_id, asesor_id, fecha_contratacion
      ),
      participantes:chat_participantes(perfil_id)
    `)
    .order('id', { ascending: false });
}

/** Obtener mensajes de un chat (ordenados asc por creado_at) */
getMensajes(chatId: number) {
  return this.supabase
    .from('mensajes_chat')
    .select('*')
    .eq('chat_id', chatId)
    .order('creado_at', { ascending: true });
}

/** Enviar mensaje */
async enviarMensaje(chatId: number, remitenteId: string, contenido: string) {
  return this.supabase
    .from('mensajes_chat')
    .insert({
      chat_id: chatId,
      remitente_id: remitenteId,
      contenido
    });
}

/** Suscribirse a nuevos mensajes de un chat (arma callback) */
subscribeMensajes(chatId: number, callback: (payload: any) => void) {
  // usando channel/postgres_changes (supabase-js v2)
  const channel = this.supabase
    .channel(`public:mensajes_chat:chat_id=eq.${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensajes_chat', filter: `chat_id=eq.${chatId}` },
      (payload) => callback(payload)
    )
    .subscribe();

  return channel;
}

/** Cancelar suscripción (channel) */
unsubscribeChannel(channel: any) {
  if (!channel) return;
  this.supabase.removeChannel(channel);
}

/** Typing status: upsert (insert/actualizar) */
async setTypingStatus(chat_id: number, perfil_id: string, estado: boolean) {
  return this.supabase
    .from("typing_status")
    .upsert(
      {
        chat_id,
        perfil_id,
        is_typing: estado,
        updated_at: new Date().toISOString()
      },
      { onConflict: "chat_id,perfil_id" }
    );
}


/** Suscribirse a cambios en typing_status para un chat */
subscribeTyping(chatId: number, callback: (payload: any) => void) {
  const channel = this.supabase
    .channel(`public:typing_status:chat_id=eq.${chatId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'typing_status', filter: `chat_id=eq.${chatId}` },
      (payload) => callback(payload)
    )
    .subscribe();

  return channel;
}

async contratarPlan(planId: number) {
  const { data: userData, error: userError } = await this.supabase.auth.getUser();
  if (userError || !userData?.user) return { data: null, error: userError };

  const usuarioId = userData.user.id;

  return this.supabase
    .from("contrataciones")
    .insert({
      usuario_id: usuarioId,
      plan_id: planId,
      estado: "pendiente",
      asesor_id: null
    });
}

getMisContrataciones(userId: string) {
  return this.supabase
    .from('contrataciones')
    .select(`
      *,
      plan:plan_id(nombre_comercial, precio)
    `)
    .eq('usuario_id', userId)
    .order('id', { ascending: false });
}
}
