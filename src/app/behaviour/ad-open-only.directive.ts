import { Directive } from '@angular/core';
import { Params } from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[adOpenOnly]'
})
export class AdOpenOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return !Params.isAdOpen;
  }
}