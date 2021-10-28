import DataExtractionHelper from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Slice&Dice';

export const disabledParams: {[name: string]: (pdv: PDV, sales: any[]) => {message: string, val : boolean}} = {
  'noRedistributedFinitions': (pdv: PDV, sales: any[]) => {
    let val = !pdv.attribute('redistributedFinitions');
    return { message: val ? 'Le siège a déclaré ce pdv finitions redistribué\n' : '', val : val}
  },
  'noEmptySalesFinitions': (pdv: PDV, sales: any[]) => {
      let val = pdv!.displayIndustrieSaleVolumes(true)['Salsi']>0 || pdv!.displayIndustrieSaleVolumes(true)['Prégy']>0
      return { message: val ? 'Ce pdv finitions répertorie des ventes Salsi et/ou Prégy\n' : '', val : val}
  },
  'noSale': (pdv: PDV, sales: any[]) => {
    let val = !pdv!.attribute('sale')
    return { message: val ? 'Le siège a déclaré ce pdv comme ne vendant pas de plaques\n' : '', val : val}
  },
  'noEmptySales' : (pdv: PDV, sales: any[]) => {
    let val = false;
    for(let sale of sales!) {
      if(sale[DataExtractionHelper.SALES_INDUSTRY_ID] != DataExtractionHelper.INDUSTRIE_SINIAT_ID && sale[DataExtractionHelper.SALES_VOLUME_ID] > 0) {
        val = true;
      }
    }
    return { message : val ? 'Ce pdv répertorie des ventes de volumes non-nuls pour des enseignes autres que Siniat\n' : '', val: val}
  },
  'noRedistributed' : (pdv: PDV, sales: any[]) => {
    let val = !pdv!.attribute('redistributed');
    return { message : val ? 'Le siège a déclaré ce pdv comme ne "tant redistribué\n' : '', val : val}
  }
}