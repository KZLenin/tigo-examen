import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsAsesorPage } from './tabs-asesor.page';

const routes: Routes = [
  {
    path: '',
    component: TabsAsesorPage,
    children: [
      {
        path: 'planes',
        loadChildren: () =>
          import('./planes/planes.module').then(m => m.PlanesPageModule)
      },
      {
        path: 'solicitudes',
        loadChildren: () =>
          import('./solicitudes/solicitudes.module').then(m => m.SolicitudesPageModule)
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
        redirectTo: 'planes',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsAsesorPageRoutingModule {}
