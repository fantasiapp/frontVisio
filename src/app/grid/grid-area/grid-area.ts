import { Directive, HostBinding, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';

//  --------------------------------
// |     #content                   |
// |                                |
//  --------------------------------

//maybe a global css class ?
@Directive()
export abstract class GridArea implements AfterViewInit {
  @HostBinding('style.grid-area')
  public gridArea: string = '';
  
  //maybe this should be declared by children, or make a class that extends this ?
  public properties: {[key:string]: string} = {};
  public ready: Subject<never> | null = null;

  constructor() {
    this.ready = new Subject<never>();
  }

  ngAfterViewInit() {
    this.ready!.next();
    this.ready!.complete();
  }
};