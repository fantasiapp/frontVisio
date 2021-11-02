import { Directive } from '@angular/core';
import DEH from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[currentYearOnly]'
})
export class CurrentYearOnlyDirective extends DisableDirective {

  computeDisabled(): boolean {
    return !DEH.currentYear;
  }
}