import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TabsAsesorPageRoutingModule } from './tabs-asesor-routing.module';

import { TabsAsesorPage } from './tabs-asesor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabsAsesorPageRoutingModule
  ],
  declarations: [TabsAsesorPage]
})
export class TabsAsesorPageModule {}
