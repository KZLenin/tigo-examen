// src/app/pages/tabs-usuario/chat/chat.page.ts
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase';

interface RawRowFromSupabase {
  chat_id: number;
  // Supabase devuelve relations como arrays cuando usas select(relations)
  chats?: { id: number; contratacion_id: number }[] | null;
  contrataciones?: { id: number; plan_id: number; estado: string }[] | null;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false
})
export class ChatPage implements OnInit, OnDestroy {

  @ViewChild('chatModal') chatModal!: IonModal;

  cargando = true;

  // Estructura usable para la UI
  chatsUsuario: {
    chat_id: number;
    contratacion_id: number;
    plan_id: number;
    estado: string;
  }[] = [];

  chatActivo: {
    chat_id: number;
    contratacion_id: number;
    plan_id: number;
    estado: string;
  } | null = null;

  mensajes: any[] = [];
  nuevoMensaje = '';

  perfilId: string = ''; // siempre string para evitar errores de tipado
  mensajesChannel: any = null;
  typingChannel: any = null;
  escribiendo: boolean = false; // indicador si otro está escribiendo
  typingTimeout: any = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    // obtener id del usuario autenticado
    const userResp = await this.supabase.getSupabase().auth.getUser();
    this.perfilId = userResp.data?.user?.id ?? '';

    await this.cargarMisChats();
  }

  ngOnDestroy() {
    if (this.mensajesChannel) this.supabase.unsubscribeChannel(this.mensajesChannel);
    if (this.typingChannel) this.supabase.unsubscribeChannel(this.typingChannel);
  }

  // ============================================================
  // Cargar lista de chats del usuario (participante)
  // ============================================================
  async cargarMisChats() {
    this.cargando = true;

    // Pedimos chat_participantes con info relacionada
    const { data, error } = await this.supabase.getSupabase()
      .from('chat_participantes')
      .select(`
        chat_id,
        chats ( id, contratacion_id ),
        contrataciones!inner ( id, plan_id, estado )
      `)
      .eq('perfil_id', this.perfilId);

    if (error) {
      console.error('Error cargando chats:', error);
      this.cargando = false;
      return;
    }

    if (!data) {
      this.chatsUsuario = [];
      this.cargando = false;
      return;
    }

    // data tiene filas con relaciones como arrays; normalizamos y protegemos contra nulls
    this.chatsUsuario = (data as RawRowFromSupabase[]).map(row => {
      const contratRow = Array.isArray(row.contrataciones) && row.contrataciones.length > 0
        ? row.contrataciones[0]
        : { id: 0, plan_id: 0, estado: 'desconocido' };

      return {
        chat_id: row.chat_id,
        contratacion_id: contratRow.id,
        plan_id: contratRow.plan_id,
        estado: contratRow.estado
      };
    });

    this.cargando = false;
  }

  // ============================================================
  // Abrir chat (modal) y suscribirse a mensajes + typing
  // ============================================================
  async abrirChat(chat: { chat_id: number; contratacion_id: number; plan_id: number; estado: string }) {
    this.chatActivo = chat;

    // cargar mensajes del chat
    const { data: mensajesData, error: mensajesError } = await this.supabase.getSupabase()
      .from('mensajes_chat')
      .select('*')
      .eq('chat_id', chat.chat_id)
      .order('creado_at', { ascending: true });

    if (mensajesError) {
      console.error('Error cargando mensajes:', mensajesError);
      this.mensajes = [];
    } else {
      this.mensajes = mensajesData ?? [];
    }

    // suscribirse a mensajes nuevos
    if (this.mensajesChannel) {
      this.supabase.unsubscribeChannel(this.mensajesChannel);
      this.mensajesChannel = null;
    }

    this.mensajesChannel = this.supabase.subscribeMensajes(chat.chat_id, (payload: any) => {
      // payload puede venir con .new, .record, .payload.record según la versión/config
      const record = payload?.new ?? payload?.record ?? payload?.payload?.record ?? null;
      if (record) {
        this.mensajes.push(record);
        // Opcional: hacer scroll al final (si quieres usar ViewChild de IonContent)
      }
    });

    // suscribirse a typing updates
    if (this.typingChannel) {
      this.supabase.unsubscribeChannel(this.typingChannel);
      this.typingChannel = null;
    }

    this.typingChannel = this.supabase.subscribeTyping(chat.chat_id, (payload: any) => {
      const record = payload?.new ?? payload?.record ?? payload?.payload?.record ?? null;
      if (!record) return;

      // si el que escribe no es yo, mostramos indicador
      if (record.perfil_id && record.perfil_id !== this.perfilId) {
        this.escribiendo = !!record.is_typing;
      }
    });

    // marcar que yo no estoy escribiendo inicialmente
    if (this.perfilId) {
      this.supabase.setTypingStatus(chat.chat_id, this.perfilId, false).catch(() => {});
    }

    // abrir modal
    this.chatModal.present();
  }

  // ============================================================
  // Cerrar chat: limpiar suscripciones y escribir=false
  // ============================================================
  async cerrarChat() {
    if (this.chatActivo && this.perfilId) {
      // desactivar typing para este perfil (silencioso si falla)
      try {
        await this.supabase.setTypingStatus(this.chatActivo.chat_id, this.perfilId, false);
      } catch (e) {
        console.warn('No se pudo setTypingStatus false al cerrar chat', e);
      }
    }

    if (this.mensajesChannel) {
      this.supabase.unsubscribeChannel(this.mensajesChannel);
      this.mensajesChannel = null;
    }

    if (this.typingChannel) {
      this.supabase.unsubscribeChannel(this.typingChannel);
      this.typingChannel = null;
    }

    this.chatActivo = null;
    this.mensajes = [];
    this.nuevoMensaje = '';
    this.escribiendo = false;

    try { this.chatModal.dismiss(); } catch (e) { /* ignore */ }
  }

  // ============================================================
  // Enviar mensaje
  // ============================================================
  async enviar() {
    if (!this.chatActivo || !this.perfilId) return;
    const contenido = (this.nuevoMensaje ?? '').trim();
    if (!contenido) return;

    try {
      await this.supabase.enviarMensaje(this.chatActivo.chat_id, this.perfilId, contenido);
      // limpiar input; el nuevo mensaje llegará por la suscripción
      this.nuevoMensaje = '';
      // opcional: marcar typing false inmediatamente
      await this.supabase.setTypingStatus(this.chatActivo.chat_id, this.perfilId, false);
    } catch (e) {
      console.error('Error enviando mensaje:', e);
      alert('No se pudo enviar el mensaje.');
    }
  }

  // ============================================================
  // Handler typing (cada input)
  // ============================================================
  async onTyping() {
    if (!this.chatActivo || !this.perfilId) return;

    // set true
    try {
      await this.supabase.setTypingStatus(this.chatActivo.chat_id, this.perfilId, true);
    } catch (e) {
      // ignore errors silently (puede fallar por RLS si no tienes permisos)
    }

    if (this.typingTimeout) clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(async () => {
      if (!this.chatActivo || !this.perfilId) return;
      try {
        await this.supabase.setTypingStatus(this.chatActivo.chat_id, this.perfilId, false);
      } catch (e) {}
    }, 1200);
  }

  // helper: si otro está escribiendo
  otroEscribiendo() {
    return this.escribiendo;
  }
}
