import { Directive, ElementRef, Input } from '@angular/core';
import { PDV } from '../middle/Pdv';
import { disabledParams, initialConditions, DisabledParamsNames, InitialConditionsNames } from './disabled-conditions';

type Conditionnal = {
  pdv?: PDV;
  conditions?: DisabledParamsNames[];      //evaluated when pdv is touched
  initialConditions?: InitialConditionsNames[]; //evaluated once
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

  get disabled() { return this._disabled; }
  get isFixed() { return !this.pdv || !this.conditions.length; }

  constructor(private ref: ElementRef) {}

  disableElement() {
    this.ref.nativeElement.disabled = true;
    this._disabled = true;
  }

  enableElement() {
    this.ref.nativeElement.disabled = false;
    this._disabled = false;
  }

  private computeInitialState() {
    for ( let condition of this.initialConditions )
      if ( initialConditions[condition]() ) return true;
    return false;
  }

  private computeState(): boolean { //disable / enable / leave
    for(let condition of this.conditions) {
      // console.log("Conditions : ", disabledParams[condition](this.pdv!), "\n Native : ", this.ref.nativeElement)
      if(disabledParams[condition](this.pdv!).val) {
        return true;
      }
    }
    return false;
  }
  
  update() {
    if ( !this.pdv || !this.conditions.length ) return;
    if ( this.computeState()) this.disableElement();
    else this.enableElement();
  }

  @Input() set conditionnal({pdv, conditions, initialConditions}: Conditionnal) {
    // console.log("Set condition : ", this.ref.nativeElement);
    this.pdv = pdv;
    this.conditions = conditions || [];
    this.initialConditions = initialConditions || [];
    this.initiallyDisabled = this.computeInitialState();
    if ( this.initiallyDisabled || this.computeState() ) this.disableElement();
  }
}