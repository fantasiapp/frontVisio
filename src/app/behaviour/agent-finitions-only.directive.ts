import { Directive } from '@angular/core';
import { Params } from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[agentFinitionsOnly]'
})
export class AgentFinitionsOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    return Params.rootLabel == 'agentFinitions';
  }

}