import { Node } from "./Node";
import DEH from "./DataExtractionHelper";
import {PDV} from "./Slice&Dice";

export class CD{ //For ComputeDescription
  static computeDescription(slice:any, description:string[]){
    let descriptionCopy = description.slice();    
    let relevantNode: Node = DEH.followSlice(slice);
    if (descriptionCopy.length == 1) return descriptionCopy[0];
    for (let i = 0; i < descriptionCopy.length; i++){
      if (descriptionCopy[i] == '') continue;
      if (descriptionCopy[i][0] == '@') descriptionCopy[i] = this.treatDescIndicator(relevantNode, descriptionCopy[i]) as string;
    }
    return descriptionCopy.reduce((str:string, acc: string) => str + acc, "");
  }

  private static treatDescIndicator(node: Node, str:string):string{
    if (!DEH.currentYear) return "";
    switch (str){
      case '@ciblageP2CD': return this.getCiblage(node);
      case '@ciblageP2CDdn': return this.getCiblage(node, false, true);
      case '@ciblageEnduit': return this.getCiblage(node, true);
      case '@ciblageEnduitComplet': return this.getCompleteCiblageFinitions(node);
      case '@DRV': return this.getObjectifDrv(node);
      case '@DRVdn': return this.getObjectifDrv(node, true);
      case '@objectifP2CD': return this.getObjectif(node);
      case '@objectifP2CDdn': return this.getObjectif(node, false, true);
      case '@objectifEnduit': return this.getObjectif(node, true);
      case '@objectifSiege': return this.getObjectifSiege(node);
      case '@objectifSiegeDn': return this.getObjectifSiege(node, true);
      default: return "";
    }
  }

  private static getCompleteCiblageFinitions(node: Node){
    if (!['root', 'drv', 'agentFinitions'].includes(node.nature)) return "";
    let ciblageDn = PDV.computeCiblage(node, true, true),
        ciblageFinitions = PDV.computeCiblage(node, true),
        objective = DEH.getTarget(node.nature, node.id, false, true);
    let percent = (objective == 0) ? 0: 0.1 * ciblageFinitions/objective,
      appropriatePresentation = (percent <= 100) ? Math.round(percent).toString().concat(" %"): "plus de 100 %";
    return "Ciblage: ".concat(ciblageDn.toString(), " PdV, pour un total de ", Math.round(ciblageFinitions/1000).toString(), " T (soit ", appropriatePresentation, " de l'objectif).");
  }

  private static getCiblage(node: Node, enduit=false, dn=false){
    let ciblage:number = +PDV.computeCiblage(node, enduit, dn);
    if (enduit) return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " T.");
    else if (dn) return "Ciblage: ".concat(ciblage.toString(), " PdV.");
    else return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " km²."); // les ciblages c'est les seuls à être en m² et pas en km²
  }

  private static getObjectif(node: Node, finition=false, dn=false){    
    if ((finition && !['root', 'drv', 'agentFinitions'].includes(node.nature)) || (!finition && node.nature !== 'agent')) return "";
    let objective = DEH.getTarget(node.nature, node.id, dn, finition);
    if (finition) return "Objectif: ".concat(Math.round(objective).toString(), " T, ");
    return (dn) ? "Objectif: ".concat(objective.toString(), " PdV, "): "Objectif: ".concat((Math.round(objective)).toString(), " km², ");
  }

  private static getObjectifDrv(node:Node, dn=false){
    if (!(node.nature == 'root' || node.nature == 'drv')) return "";
    let targetDrv:number;
    if (node.nature == 'root') targetDrv = DEH.getTarget('nationalByAgent', 0, dn);
    if (node.nature == 'drv') targetDrv = (node.children as Node[]).reduce((acc:number, agentNode:Node) => acc + DEH.getTarget('agent', agentNode.id, dn), 0);
    return (dn) ? "DRV: ".concat(targetDrv!.toString(), " PdV, "): "DRV: ".concat((Math.round(targetDrv!)).toString(), " km², ");
  }

  private static getObjectifSiege(node: Node, dn=false):string{
    if (!(node.nature == 'root' || node.nature == 'drv')) return "";
    let targetSiege =  DEH.getTarget(node.nature, node.id, dn);
    return (dn) ? "Objectif Siège: ".concat(targetSiege.toString(), " PdV, "): "Objectif Siège: ".concat((Math.round(targetSiege)).toString(), " km², ");
  }

  static computeDescriptionWidget(slice:any): [number, number, number][]{
    let relevantNode: Node = DEH.followSlice(slice),
      ciblage = PDV.computeCiblage(relevantNode);
    let objectiveWidget: [number, number, number] = [
      (relevantNode.children as Node[]).map(subLevelNode => DEH.getTarget(subLevelNode.nature, subLevelNode.id)).reduce((acc, value) => acc + value, 0),
      (relevantNode.children as Node[]).map(subLevelNode => DEH.getTarget(subLevelNode.nature, subLevelNode.id, true)).reduce((acc, value) => acc + value, 0),
      0],
      ciblageWidget: [number, number, number] = [0, 0, 0];
    objectiveWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / objectiveWidget[0]; // on divise par 10 car on fait *100 pour mettre en % et /1000 pour tout mettre en km2
    if (relevantNode.nature == 'root'){
      let agentNodes = (relevantNode.children as Node[]).map(drvNode => drvNode.children as Node[]).reduce((acc: Node[], list: Node[]) => acc.concat(list), []);
      ciblageWidget = [
      agentNodes.map(agentNode => DEH.getTarget('agent', agentNode.id)).reduce((acc, value) => acc + value, 0),
      agentNodes.map(agentNode => DEH.getTarget('agent', agentNode.id, true)).reduce((acc, value) => acc + value, 0),
      0]
      ciblageWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / ciblageWidget[0]; 
    } else ciblageWidget = [
      ciblage / 1000,
      PDV.computeCiblage(relevantNode, false, true),
      100];
    return [objectiveWidget, ciblageWidget];
  }
}