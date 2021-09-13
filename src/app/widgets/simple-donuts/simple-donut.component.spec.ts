import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleDonutComponent } from './simple-donuts.component';

describe('SimpleDonutsComponent', () => {
  let component: SimpleDonutComponent;
  let fixture: ComponentFixture<SimpleDonutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimpleDonutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleDonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
