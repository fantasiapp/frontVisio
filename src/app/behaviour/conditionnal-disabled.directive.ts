import { Directive, Input } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[conditionnalDisabled]'
})
export class ConditionnalDisabledDirective extends DisableDirective {
  @Input() pdv?: PDV;
  @Input() flag?: string;

  computeDisabled(): boolean {
    return true;
  }
}