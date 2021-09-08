import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleDonutsComponent } from './simple-donuts.component';

describe('SimpleDonutsComponent', () => {
  let component: SimpleDonutsComponent;
  let fixture: ComponentFixture<SimpleDonutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleDonutsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleDonutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
