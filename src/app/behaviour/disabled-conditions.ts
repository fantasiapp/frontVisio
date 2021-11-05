import DEH from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Pdv';

export const disabledParams: {[name: string]: (pdv: PDV ) => {message: string, val : boolean}} = {
  'noRedistributedFinitions': (pdv: PDV ) => {
    let val = !pdv.redistributedFinitions;
    return { message: val ? 'Le siège a déclaré ce pdv finitions redistribué\n' : '', val : val}
  },
  'noEmptySalesFinitions': (pdv: PDV ) => {
      let val = pdv!.displayIndustrieSaleVolumes(true)['Salsi']>0 || pdv!.displayIndustrieSaleVolumes(true)['Prégy']>0
      return { message: val ? 'Ce pdv finitions répertorie des ventes Salsi et/ou Prégy\n' : '', val : val}
  },
  'noSale': (pdv: PDV ) => {
    let val = !pdv!.sale
    return { message: val ? 'Le siège a déclaré ce pdv comme ne vendant pas de plaques\n' : '', val : val}
  },
  'noEmptySales' : (pdv: PDV ) => {
    let val = false;
    for(let sale of pdv.sales!) {
      if(sale[DEH.SALES_INDUSTRY_ID] != DEH.INDUSTRIE_SINIAT_ID && sale[DEH.SALES_VOLUME_ID] > 0) {
        val = true;
      }
    }
    return { message : val ? 'Ce pdv répertorie des ventes de volumes non-nuls pour des enseignes autres que Siniat\n' : '', val: val}
  },
  'noRedistributed' : (pdv: PDV ) => {
    let val = !pdv!.redistributed;
    return { message : val ? 'Le siège a déclaré ce pdv comme étant redistribué\n' : '', val : val}
  }
}