import { Directive, Input, HostListener } from '@angular/core';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';
import { DisableDirective } from './disable-directive.directive';


export const enum Condition {
  noRedistributedFinitions = 'noRedistributedFinitions',
  emptySalesFinitions = 'emptySalesFinitions',
  noSale = 'noSale',
  emptySales = 'emptySales',
};

@Directive({
  selector: '[conditionnalDisabled]'
})
export class ConditionnalDisabledDirective extends DisableDirective {
  @Input() pdv?: PDV;
  @Input() sales?: any[];
  @Input() conditions?: Condition[];
  
  private conditionsParams: {[name in Condition]: {message: string, compute: () => boolean}} = {
    'noRedistributedFinitions': {
      message: 'Le siège a déclaré ce pdv finitions redistribué',
      compute: () => !this.pdv!.attribute('redistributedFinitions')
    },
    'emptySalesFinitions': {
      message: 'Ce pdv finitions répertorie des ventes Salsi et/ou Pregy',
      compute: () => {
                        for(let sale of this.sales!) {
                          if((sale[DataExtractionHelper.SALES_INDUSTRY_ID] === DataExtractionHelper.INDUSTRIE_SALSI_ID && sale[DataExtractionHelper.SALES_VOLUME_ID] > 0) || (sale[DataExtractionHelper.SALES_INDUSTRY_ID] === DataExtractionHelper.INDUSTRIE_PREGY_ID && sale[DataExtractionHelper.SALES_VOLUME_ID] > 0))
                            return false;
                          }
                          return true;
                      }
    },
    'noSale': {
      message: 'Le siège a déclaré ce pdv comme ne vendant pas de plaques',
      compute : () => !this.pdv!.attribute('sale'),
    },
    'emptySales' : {
      message : 'Ce pdv répertorie des ventes de volumes non-nuls pour des enseignes autres que Siniat',
      compute: () => {
                        for(let sale of this.sales!) {
                          if(sale[DataExtractionHelper.SALES_INDUSTRY_ID] != DataExtractionHelper.INDUSTRIE_SINIAT_ID && sale[DataExtractionHelper.SALES_VOLUME_ID] > 0)
                            return false;
                          }
                          return true;
                      }
    }
  }

  @HostListener('click', ['$event.target'])
  onClick() {
    console.log("Clicked")
  }

  computeDisabled(): boolean {
    for(let condition of this.conditions!) {
      if(this.conditionsParams[condition].compute()) {
        console.log(this.conditionsParams[condition].message)
        return true;
      }
    }
  return false;
  }
}