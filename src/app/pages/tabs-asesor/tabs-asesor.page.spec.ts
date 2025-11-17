import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabsAsesorPage } from './tabs-asesor.page';

describe('TabsAsesorPage', () => {
  let component: TabsAsesorPage;
  let fixture: ComponentFixture<TabsAsesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TabsAsesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
