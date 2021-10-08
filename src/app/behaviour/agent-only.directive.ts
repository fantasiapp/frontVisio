import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[agentOnly]',
})
export class AgentOnlyDirective implements AfterViewInit {

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    let accountLabel = PDV.geoTree.root.label;
    if ( accountLabel !== 'Secteur' )
      this.el.nativeElement.disabled = true; 
  }
}