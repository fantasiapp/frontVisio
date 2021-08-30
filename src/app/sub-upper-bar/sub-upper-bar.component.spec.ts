import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubUpperBarComponent } from './sub-upper-bar.component';

describe('SubUpperBarComponent', () => {
  let component: SubUpperBarComponent;
  let fixture: ComponentFixture<SubUpperBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubUpperBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubUpperBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
