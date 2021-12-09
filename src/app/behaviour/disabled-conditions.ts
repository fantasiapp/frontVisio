import DEH, { Params } from '../middle/DataExtractionHelper';
import { PDV } from '../middle/Pdv';

type DisableCondition = (pdv: PDV) => {
  message: string;
  val: boolean;
};

type InitialCondition = () => {
  message: string;
  val: boolean;
};

export type DisabledParamsNames =
  'noRedistributedFinitions' | 'noEmptySalesFinitions' | 'noSale' | 'noEmptySales' | 'noRedistributed' | 'onlySiniat';

export const disabledParams:{[key in DisabledParamsNames]: DisableCondition} = {
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
  },
  'onlySiniat' : (pdv: PDV ) => {
    let val = !pdv!.onlySiniat;
    return { message : val ? 'Ce point de vente a été déclaré 100% Siniat\n' : '', val : val}
  }
};

//help the type system so the programmer produces less errors
export type InitialConditionsNames =
  'adOpenOnly' | 'agentFinitionsOnly' | 'agentOnly'| 'currentYearOnly'

export const initialConditions: {[key in InitialConditionsNames]: InitialCondition} = {
  adOpenOnly: () => {return {message : !Params.isAdOpen ? "La saisie de l'AD est fermée.\n" : "", val: !Params.isAdOpen}},
  agentFinitionsOnly: () => {return {message : Params.rootNature !== 'agentFinitions' ? "Seul un Agent Finitions peut modifier ceci.\n" : "", val: Params.rootNature !== 'agentFinitions'}},
  agentOnly: () => {return {message : Params.rootNature !== 'agent' ? "Seul un Agent peut modifier ceci.\n" : "", val: Params.rootNature !== 'agent'}},
  currentYearOnly: () => {return {message : !DEH.currentYear ? "Impossible de modifier ce champ hors de l'année courante.\n" : "", val: !DEH.currentYear}},
};