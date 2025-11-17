import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanesPage } from './planes.page';

describe('PlanesPage', () => {
  let component: PlanesPage;
  let fixture: ComponentFixture<PlanesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
