import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TabsUsuarioPageRoutingModule } from './tabs-usuario-routing.module';

import { TabsUsuarioPage } from './tabs-usuario.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabsUsuarioPageRoutingModule
  ],
  declarations: [TabsUsuarioPage]
})
export class TabsUsuarioPageModule {}
