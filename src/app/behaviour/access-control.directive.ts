import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { Navigation } from '../middle/Navigation';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[accessControl]',
})
export class AccessControlDirective implements AfterViewInit {

  constructor(private el: ElementRef, private navigation: Navigation) { }


  ngAfterViewInit() {
    let accountLabel = PDV.geoTree.root.label;
    console.log(accountLabel)
    if ( accountLabel !== 'Secteur' )
      this.el.nativeElement.disabled = true; 
  }
}
