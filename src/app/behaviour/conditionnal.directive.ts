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
  private previousState!: boolean;

  computeDisabled(): boolean {
    this.previousState = this.el.nativeElement.disabled;
    for(let condition of this.conditions) {
      if(disabledParams[condition](this.pdv)) {
        console.log("Disable because of ", condition)
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