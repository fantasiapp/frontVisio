import { Directive, HostBinding, AfterViewInit, Input } from '@angular/core';
import { Subject } from 'rxjs';


@Directive()
export abstract class GridArea implements AfterViewInit {
  @HostBinding('style.grid-area')
  public gridArea: string = '';
  
  public properties: {[key:string]: any} = {};
  public ready: Subject<never> | null = null;

  constructor() {
    this.ready = new Subject<never>();
  }

  ngAfterViewInit() {
    this.ready!.next();
    this.ready!.complete();
  }
};