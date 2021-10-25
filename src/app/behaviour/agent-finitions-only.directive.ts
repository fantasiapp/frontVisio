import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { PDV } from '../middle/Slice&Dice';

@Directive({
  selector: '[agentFinitionsOnly]'
})
export class AgentFinitionsOnlyDirective implements AfterViewInit {

  constructor(private el: ElementRef) { }
  private _allowed?: boolean = false;

  public get allowed(): boolean {
    return this._allowed ? true : false;
  }

  ngAfterViewInit() {
    this._allowed = PDV.geoTree.root.label === 'Agent Finitions';
    if(!this.el.nativeElement.disabled)
      this.el.nativeElement.disabled = !this._allowed; 
  }
}