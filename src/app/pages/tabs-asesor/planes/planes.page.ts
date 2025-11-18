import { Component, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { SupabaseService } from '../../../services/supabase';

@Component({
  selector: 'app-planes',
  templateUrl: './planes.page.html',
  styleUrls: ['./planes.page.scss'],
  standalone: false
})
export class PlanesPage implements OnInit {

  @ViewChild('planModal') planModal!: IonModal;

  planes: any[] = [];
  rol = localStorage.getItem('rol');
  cargando = true;

  // Modal
  editando = false;
  planEditId: number | null = null;

  // Imagen
  imagenFile: File | null = null;
  vistaPrevia: any = null;

  form: any = {
    nombre_comercial: '',
    precio: null,
    segmento: '',
    publico_objetivo: '',
    descripcion: '',
    caracteristicas: '' // JSON
  };

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarPlanes();
  }

  async cargarPlanes() {
    this.cargando = true;
    const { data } = await this.supabase.getPlanesConImagen();
    this.planes = data || [];
    this.cargando = false;
  }

  // ==============================
  // MODAL
  // ==============================
  abrirModalCrear() {
    this.editando = false;
    this.planEditId = null;
    this.form = {
      nombre_comercial: '',
      precio: null,
      segmento: '',
      publico_objetivo: '',
      descripcion: '',
      caracteristicas: ''
    };
    this.imagenFile = null;
    this.vistaPrevia = null;
    this.planModal.present();
  }

  abrirModalEditar(plan: any) {
    this.editando = true;
    this.planEditId = plan.id;

    this.form = {
      nombre_comercial: plan.nombre_comercial,
      precio: plan.precio,
      segmento: plan.segmento,
      publico_objetivo: plan.publico_objetivo,
      descripcion: plan.descripcion,
      caracteristicas: JSON.stringify(plan.caracteristicas, null, 2)
    };

    this.vistaPrevia = plan.imagen_url || null;
    this.planModal.present();
  }

  cerrarModal() {
    this.planModal.dismiss();
  }

  // ==============================
  // IMAGEN
  // ==============================
  seleccionarImagen(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.imagenFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.vistaPrevia = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // ==============================
  // GUARDAR (CREATE / UPDATE)
  // ==============================
  async guardarPlan() {
    if (!this.form.nombre_comercial || !this.form.precio) {
      alert('Completa los campos obligatorios');
      return;
    }

    const caracteristicasJSON = (() => {
      try { return JSON.parse(this.form.caracteristicas); }
      catch { alert('Características no es un JSON válido'); return null; }
    })();

    if (!caracteristicasJSON) return;

    let imagen_path = null;

    // 1. SUBIR IMAGEN SI EXISTE
    if (this.imagenFile) {
      const filePath = `plan_${Date.now()}.jpg`;

      let { error: errUpload } = await this.supabase.getSupabase()
        .storage
        .from('planes-imagenes')
        .upload(filePath, this.imagenFile, { upsert: true });

      if (errUpload) {
        alert('Error al subir imagen');
        return;
      }

      imagen_path = filePath;
    }

    // 2. INSERTAR O ACTUALIZAR
    if (!this.editando) {
      // CREAR
      const { error } = await this.supabase.getSupabase()
        .from('planes_moviles')
        .insert({
          nombre_comercial: this.form.nombre_comercial,
          precio: this.form.precio,
          segmento: this.form.segmento,
          publico_objetivo: this.form.publico_objetivo,
          descripcion: this.form.descripcion,
          caracteristicas: caracteristicasJSON,
          imagen_path
        });

      if (error) alert(error.message);

    } else {
      // EDITAR
      const { error } = await this.supabase.getSupabase()
        .from('planes_moviles')
        .update({
          nombre_comercial: this.form.nombre_comercial,
          precio: this.form.precio,
          segmento: this.form.segmento,
          publico_objetivo: this.form.publico_objetivo,
          descripcion: this.form.descripcion,
          caracteristicas: caracteristicasJSON,
          imagen_path: imagen_path ?? undefined
        })
        .eq('id', this.planEditId);

      if (error) alert(error.message);
    }

    this.cerrarModal();
    this.cargarPlanes();
  }

  // ==============================
  // ELIMINAR
  // ==============================
  async eliminarPlan() {
    if (!confirm('¿Seguro que deseas eliminar este plan?')) return;

    const { error } = await this.supabase.getSupabase()
      .from('planes_moviles')
      .delete()
      .eq('id', this.planEditId);

    if (error) alert(error.message);

    this.cerrarModal();
    this.cargarPlanes();
  }
}