import { Directive, ElementRef, Input, HostListener } from '@angular/core';
import { PDV } from '../middle/Pdv';
import { disabledParams, initialConditions, DisabledParamsNames, InitialConditionsNames } from './disabled-conditions';

type Conditionnal = {
  pdv?: PDV;
  conditions?: DisabledParamsNames[];      //evaluated when pdv is touched
  initialConditions?: InitialConditionsNames[]; //evaluated once
  showDescription?: boolean; //
};


@Directive({
  selector: '[conditionnal]'
})
export class ConditionnalDirective {
  private pdv?: PDV;
  private conditions!: DisabledParamsNames[];
  private initialConditions!: InitialConditionsNames[];
  private initiallyDisabled: boolean = false;
  private _disabled: boolean = false;
  private description: HTMLDivElement;

  get disabled() { return this._disabled; }
  get isFixed() { return !this.pdv || !this.conditions.length; }

  
  mouseX: number = 0;
  mouseY : number = 0;
  showDescription: boolean = false;
  @HostListener('mouseover')
  onMouseOver() {
    if(this.description.getElementsByTagName('p').length && this.showDescription)
      this.description.style.display = 'block';
  }
  @HostListener('mouseout')
  onMouseOut() {
    this.description.style.display = 'none';
  }
  @HostListener('mousemove')
  onMouseMove() {
    this.getMouseCoordinnates();
    this.description.style.top = this.mouseY-(50*this.description.getElementsByTagName('p').length) + 'px';
    this.description.style.left = this.mouseX-180 + 'px';
  }

  constructor(private ref: ElementRef) {
    this.description = document.createElement('div');
    this.ref.nativeElement.insertAdjacentElement('afterend', this.description);
  }

  disableFirstInput() {
    let elt = this.ref.nativeElement as HTMLElement;
    if(elt instanceof HTMLInputElement || elt instanceof HTMLButtonElement || elt instanceof HTMLTextAreaElement) elt.disabled = true;
    else {
      if(elt.getElementsByTagName('input').length > 0) {
        elt = elt.getElementsByTagName('input')[0] as HTMLInputElement;
        (elt as HTMLInputElement).disabled = true;
      } else if(elt.getElementsByTagName('button').length > 0) {
        elt = elt.getElementsByTagName('button')[0] as HTMLButtonElement;
        (elt as HTMLButtonElement).disabled = true;
      } else if(elt.getElementsByTagName('textarea').length > 0) {
        elt = elt.getElementsByTagName('textarea')[0] as HTMLTextAreaElement;
        (elt as HTMLTextAreaElement).disabled = true;
      }
    }
    this._disabled = true;
    
    this.ref.nativeElement.style.cursor = 'not-allowed';
    elt.style.cursor = 'not-allowed';
    this.description.style.opacity = '1';
  }

  enableFirstInput() {
    let elt = this.ref.nativeElement as HTMLElement;
    if(elt instanceof HTMLInputElement || elt instanceof HTMLButtonElement || elt instanceof HTMLTextAreaElement) elt.disabled = false;
    else {
      if(elt.getElementsByTagName('input').length > 0) {
        elt = elt.getElementsByTagName('input')[0] as HTMLInputElement;
        (elt as HTMLInputElement).disabled = false;
      } else if(elt.getElementsByTagName('button').length > 0) {
        elt = elt.getElementsByTagName('button')[0] as HTMLButtonElement;
        (elt as HTMLButtonElement).disabled = false;
      } else if(elt.getElementsByTagName('textarea').length > 0) {
        elt = elt.getElementsByTagName('textarea')[0] as HTMLTextAreaElement;
        (elt as HTMLTextAreaElement).disabled = false;
      }
    }
    
    this._disabled = false;

    this.ref.nativeElement.style.cursor = 'pointer';
    elt.style.cursor = 'pointer';
    this.description.style.opacity = '0';
  }

  private computeInitialState() {
    for ( let condition of this.initialConditions )
      if ( initialConditions[condition]().val) return true;
    return false;
  }

  private computeState(): boolean { //disable / enable / leave
    for(let condition of this.conditions)
      if(disabledParams[condition](this.pdv!).val)
        return true;
    return false;
  }

  getMouseCoordinnates() {
    let e = window.event as any;
    this.mouseX = e.pageX;
    this.mouseY = e.pageY;
  }

  private computeDescription() {
    for(let child of Array.from(this.description.getElementsByTagName('p'))) this.description.removeChild(child)
    for ( let condition of this.initialConditions ) {
      let res = initialConditions[condition]();
      if (res.val) {
        let spanElt = document.createElement('p');
        spanElt.style.color = 'white';
        spanElt.textContent = res.message;
        this.description.insertAdjacentElement('beforeend', spanElt);
      }
    }
    for ( let condition of this.conditions ) {
      let res = disabledParams[condition](this.pdv!);
      if (res.val) {
        let spanElt = document.createElement('p');
        spanElt.style.color = 'white';
        spanElt.textContent = res.message;
        this.description.insertAdjacentElement('beforeend', spanElt);
      }
    }

    this.description.style.pointerEvents = 'none';
    this.description.style.display = 'none';
    this.description.style.position = 'fixed';
    this.description.style.fontSize = '0.8em';
    this.description.style.backgroundColor = '#333';
    this.description.style.maxWidth = '10em';
    this.description.style.width = 'fit-content';
    this.description.style.height = 'fit-content';
    this.description.style.zIndex = '99999999';
    this.description.style.padding = '0.5em';
    this.description.style.borderRadius = '0.5em';
  }
  
  update() {
    this.computeDescription();
    if ( !this.pdv || !this.conditions.length ) return;
    if ( this.computeState()) this.disableFirstInput();
    else this.enableFirstInput();
  }

  @Input() set conditionnal({pdv, conditions, initialConditions, showDescription}: Conditionnal) {
    this.enableFirstInput();
    this.pdv = pdv;
    this.conditions = conditions || [];
    this.initialConditions = initialConditions || [];
    this.showDescription = showDescription || false;
    this.computeDescription();
    this.initiallyDisabled = this.computeInitialState();
    if ( this.initiallyDisabled || this.computeState() ) this.disableFirstInput();
  }
}