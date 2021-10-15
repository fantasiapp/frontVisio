import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[agentOnly]',
})
export class AgentOnlyDirective implements AfterViewInit {

  constructor(private el: ElementRef) { }
  private _allowed?: boolean = false;

  public get allowed(): boolean {
    return this._allowed ? true : false;
  }

  ngAfterViewInit() {
    this._allowed = PDV.geoTree.root.label === 'Secteur';
    this.el.nativeElement.disabled = !this._allowed; 
  }
}