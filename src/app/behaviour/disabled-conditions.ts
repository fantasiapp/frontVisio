import { PDV } from '../middle/Pdv';

export const disabledParams: {[name: string]: (pdv: PDV ) => {message: string, val : boolean}} = {
  'noRedistributedFinitions': (pdv: PDV ) => {
    let val = !pdv.redistributedFinitions;
    return { message: val ? 'Le siège a déclaré ce pdv finitions redistribué\n' : '', val : val}
  },
  'noEmptySalesFinitions': (pdv: PDV ) => {
      let enduitRaw: any = pdv.displayIndustrieSaleVolumes(true);
      let val = enduitRaw['Salsi']>0 || enduitRaw['Prégy']>0;
      // val = true;
      return { message: val ? 'Ce pdv finitions répertorie des ventes Salsi et/ou Prégy\n' : '', val : val}
  },
  'noSale': (pdv: PDV ) => {
    let val = !pdv!.sale
    return { message: val ? 'Le siège a déclaré ce pdv comme ne vendant pas de plaques\n' : '', val : val}
  },
  'noEmptySales' : (pdv: PDV ) => {
    let val = false;
    for(let sale of Object.entries(pdv!.displayIndustrieSaleVolumes())) {
      if(sale[0] != 'Siniat' && sale[1]>0) {
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