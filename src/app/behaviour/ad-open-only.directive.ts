import { Directive } from '@angular/core';
import DEH from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[adOpenOnly]'
})
export class AdOpenOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return !DEH.get('params')['isAdOpen'];

  }
}