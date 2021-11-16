import { Directive, Input, ElementRef, ViewContainerRef } from '@angular/core';
import { PDV } from '../middle/Pdv';
import { DisableDirective } from './disable-directive.directive';
import { disabledParams } from './disabled-conditions';

@Directive({
  selector: '[conditionnal]'
})
export class ConditionnalDirective extends DisableDirective{

  private pdv!: PDV;
  private conditions!: string[];

  computeDisabled(): boolean {
    for(let condition of this.conditions) {
      console.log("DISABLED")
      if(disabledParams[condition](this.pdv)) {
        return true;
      }
    }
    return false;
  }

  @Input() set conditionnal(data: {pdv: PDV, conditions: string[]}) {
    this.pdv = data.pdv;
    this.conditions = data.conditions;
  }
}