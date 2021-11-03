import { Directive } from '@angular/core';
import { Params } from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[agentOnly]',
})
export class AgentOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return Params.rootName !== 'agent';
  }

}