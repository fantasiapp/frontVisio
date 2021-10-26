import { Directive } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[adOpenOnly]'
})
export class AdOpenOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return !DataExtractionHelper.get('params')['isAdOpen'];

  }
}