import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorowComponent } from './historow.component';

describe('HistorowComponent', () => {
  let component: HistorowComponent;
  let fixture: ComponentFixture<HistorowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HistorowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
