import { Directive } from '@angular/core';
import { Params } from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Pdv';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[agentOnly]',
})
export class AgentOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    console.log("on est ", Params.rootNature)
    return Params.rootNature !== 'agent';
  }

}