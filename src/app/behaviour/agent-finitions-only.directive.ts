import { Directive } from '@angular/core';
import { PDV } from '../middle/Slice&Dice';
import { DisableDirective } from './disable-directive.directive';

@Directive({
  selector: '[agentFinitionsOnly]'
})
export class AgentFinitionsOnlyDirective extends DisableDirective {
  computeDisabled(): boolean {
    throw PDV.geoTree.root.label !== 'Agent Finitions';

  }

}