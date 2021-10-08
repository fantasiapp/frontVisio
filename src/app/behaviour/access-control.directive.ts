import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { Navigation } from '../middle/Navigation';

@Directive({
  selector: '[accessControl]',
})
export class AccessControlDirective implements AfterViewInit {

  constructor(private el: ElementRef, private navigation: Navigation) { }


  ngAfterViewInit() {
    let accountLabel = this.navigation.tree!.root.label;
    if ( accountLabel !== 'Secteur' )
      this.el.nativeElement.disabled = true; 
  }
}
