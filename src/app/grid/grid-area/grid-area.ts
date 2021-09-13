import { Directive, HostBinding, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';

//  --------------------------------
// |     #content                   |
// |                                |
//  --------------------------------
@Directive()
export abstract class GridArea implements AfterViewInit {
  @HostBinding('style.display')
  private display: string = 'block';
  @HostBinding('style.grid-area')
  public gridArea: string = '';

  protected ready: Subject<never> | null = null;

  constructor() {
    this.ready = new Subject<never>();
  }

  ngAfterViewInit() {
    this.ready!.next();
    this.ready!.complete();
  }
};