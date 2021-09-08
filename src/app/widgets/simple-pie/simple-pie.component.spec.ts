import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplePieComponent } from './simple-pie.component';

describe('SimplePieComponent', () => {
  let component: SimplePieComponent;
  let fixture: ComponentFixture<SimplePieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimplePieComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimplePieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
