import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { SupabaseService } from 'src/app/services/supabase';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: false
})
export class ChatPage implements OnInit {

  @ViewChild('chatModal') chatModal!: IonModal;

  solicitudesChats: any[] = []; // lista de chats/contrataciones
  cargando = true;

  // Chat activo (modal)
  chatActivo: any = null;
  mensajes: any[] = [];
  nuevoMensaje = '';
  perfilId: string | null = null; // id del asesor autenticado

  // suscripciones (channels)
  mensajesChannel: any = null;
  typingChannel: any = null;

  escribiendoUsuarios: Record<string, boolean> = {}; // { perfil_id: true/false }

  typingTimeout: any = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    // obtener perfil actual para usar como remitente (puedes obtener de supabase.auth.getUser() o de tu localStorage)
    const { data: userResp } = await this.supabase.getSupabase().auth.getUser();
    this.perfilId = userResp?.user?.id ?? null;

    await this.cargarSolicitudes();
  }

  ngOnDestroy() {
    // limpiar canales si quedan
    if (this.mensajesChannel) this.supabase.unsubscribeChannel(this.mensajesChannel);
    if (this.typingChannel) this.supabase.unsubscribeChannel(this.typingChannel);
  }

  async cargarSolicitudes() {
    this.cargando = true;
    // reusable: usa tu getSolicitudes() si ya devuelve la info adecuada
    const { data, error } = await this.supabase.getSolicitudes();
    if (!error) this.solicitudesChats = data || [];
    this.cargando = false;
  }

  // abrir modal del chat (recibe objeto solicitud/chat)
  async abrirChat(solicitud: any) {
    // buscar o crear chat asociado a la contratacion (flujo recomendado: crear chat al crear contratacion)
    // suponiendo 'solicitud' incluye contratacion_id y campo 'chat' si existe
    const contratacionId = solicitud.id ?? solicitud.contratacion_id ?? solicitud.contratacion?.id;

    // intentar obtener chat existente:
    const { data: chatRows } = await this.supabase.getSupabase()
      .from('chats')
      .select('*')
      .eq('contratacion_id', contratacionId)
      .limit(1);

    let chat;
    if (chatRows && chatRows.length > 0) {
      chat = chatRows[0];
    } else {
      // crear chat si no existe
      const { data: created, error: createErr } = await this.supabase.getSupabase()
        .from('chats')
        .insert({ contratacion_id: contratacionId })
        .select()
        .single();

      if (createErr) {
        alert('No se pudo abrir el chat');
        return;
      }
      chat = created;
      // agregar participantes: usuario y asesor (aquí agregamos al usuario de la solicitud y al asesor actual)
      // solicitud.usuario_id existe en tu seed / getSolicitudes select
      await this.supabase.getSupabase()
        .from('chat_participantes')
        .insert([
          { chat_id: chat.id, perfil_id: solicitud.usuario_id },
          { chat_id: chat.id, perfil_id: this.perfilId }
        ]);
    }

    this.chatActivo = chat;
    await this.cargarMensajesDeChat(chat.id);

    // suscribirse a nuevos mensajes
    this.mensajesChannel = this.supabase.subscribeMensajes(chat.id, (payload: any) => {
      // payload.record contiene la fila insertada (según postgres_changes)
      const record = payload?.new ?? payload?.record ?? payload?.payload?.record;
      if (record) {
        this.mensajes.push(record);
        // scroll to bottom (en template usaremos ion-content.scrollToBottom())
      }
    });

    // suscribirse a typing_status
    this.escribiendoUsuarios = {};
    this.typingChannel = this.supabase.subscribeTyping(chat.id, (payload: any) => {
      const record = payload?.new ?? payload?.record ?? payload?.payload?.record;
      if (!record) return;
      const perfilId = record.perfil_id;
      const isTyping = record.is_typing;
      this.escribiendoUsuarios[perfilId] = isTyping;
    });

    this.chatModal.present();
  }

  async cerrarChat() {
    // marcar typing false para este perfil
    if (this.chatActivo && this.perfilId) {
      await this.supabase.setTypingStatus(this.chatActivo.id, this.perfilId, false);
    }

    // unsubscribir canales
    if (this.mensajesChannel) { this.supabase.unsubscribeChannel(this.mensajesChannel); this.mensajesChannel = null; }
    if (this.typingChannel) { this.supabase.unsubscribeChannel(this.typingChannel); this.typingChannel = null; }

    this.chatActivo = null;
    this.mensajes = [];
    this.chatModal.dismiss();
  }

  async cargarMensajesDeChat(chatId: number) {
    const { data } = await this.supabase.getMensajes(chatId);
    this.mensajes = data || [];
  }

  // enviar mensaje (boton)
  async enviar() {
    if (!this.chatActivo || !this.perfilId) return;
    if (!this.nuevoMensaje.trim()) return;

    const contenido = this.nuevoMensaje.trim();
    this.nuevoMensaje = '';

    await this.supabase.enviarMensaje(this.chatActivo.id, this.perfilId, contenido);
    // se añadirá por la suscripción; opcionalmente push ahora mismo:
    // this.mensajes.push({ chat_id: this.chatActivo.id, remitente_id: this.perfilId, contenido, creado_at: new Date().toISOString() });
  }

  // typing handler (bind a tecla)
  async onTyping() {
    if (!this.chatActivo || !this.perfilId) return;
    // set true
    await this.supabase.setTypingStatus(this.chatActivo.id, this.perfilId, true);

    // limpiar timeout previo
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    // si no escribe en 1.2s, marcar false
    this.typingTimeout = setTimeout(async () => {
      if (!this.perfilId) return;
      await this.supabase.setTypingStatus(this.chatActivo.id, this.perfilId, false);

    }, 1200);
  }

  // helper: mostrar si otro usuario está escribiendo (excluye al propio perfil)
  otroEscribiendo(): boolean {
    if (!this.chatActivo) return false;
    return Object.keys(this.escribiendoUsuarios).some(pid => pid !== this.perfilId && !!this.escribiendoUsuarios[pid]);
  }

}
