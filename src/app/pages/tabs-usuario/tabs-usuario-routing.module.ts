import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsUsuarioPage } from './tabs-usuario.page';

const routes: Routes = [
  {
    path: '',
    component: TabsUsuarioPage,
    children: [
      {
        path: 'inicio',
        loadChildren: () =>
          import('./inicio/inicio.module').then(m => m.InicioPageModule)
      },
      {
        path: 'mis-planes',
        loadChildren: () =>
          import('./mis-planes/mis-planes.module').then(m => m.MisPlanesPageModule)
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./chat/chat.module').then(m => m.ChatPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () =>
          import('./perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsUsuarioPageRoutingModule {}
