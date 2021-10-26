import { Directive } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[currentYearOnly]'
})
export class CurrentYearOnlyDirective extends DisableDirective {

  computeDisabled(): boolean {
    return !DataExtractionHelper.currentYear;
  }
}