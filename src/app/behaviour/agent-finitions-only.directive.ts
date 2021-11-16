import { Directive } from '@angular/core';
import { Params } from '../middle/DataExtractionHelper';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[agentFinitionsOnly]'
})
export class AgentFinitionsOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return Params.rootNature !== 'agentFinitions';
  }

}