import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsUsuarioPage } from './tabs-usuario.page';

describe('TabsUsuarioPage', () => {
  let component: TabsUsuarioPage;
  let fixture: ComponentFixture<TabsUsuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsUsuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
