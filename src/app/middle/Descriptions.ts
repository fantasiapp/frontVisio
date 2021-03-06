import {Node} from "./Node";
import DEH from "./DataExtractionHelper";
import {SliceDice} from "./Slice&Dice";

export class CD{ //For ComputeDescription
  static computeDescription(description:string[]){
    let node = SliceDice.currentNode;
    let descriptionCopy = description.slice();
    if (descriptionCopy.length == 1) return descriptionCopy[0];
    for (let i = 0; i < descriptionCopy.length; i++){
      if (descriptionCopy[i] == '') continue;
      if (descriptionCopy[i][0] == '@') descriptionCopy[i] = this.treatDescIndicator(node, descriptionCopy[i]) as string;
    }
    return descriptionCopy.reduce((str:string, acc: string) => str + acc, "");
  }

  private static treatDescIndicator(node: Node, str:string):string{
    if (!DEH.currentYear) return "";
    switch (str){
      case '@ciblageP2CD': return this.getCiblage();
      case '@ciblageP2CDdn': return this.getCiblage(false, true);
      case '@ciblageEnduit': return this.getCiblage(true);
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
    let ciblageDn = this.computeCiblage(true, true),
        ciblageFinitions = this.computeCiblage(true),
        objective = DEH.getTarget(node.nature, node.id, false, true);
    let percent = (objective == 0) ? 0: 0.1 * ciblageFinitions/objective,
      appropriatePresentation = (percent <= 100) ? Math.round(percent).toString().concat(" %"): "plus de 100 %";
    return "Ciblage: ".concat(ciblageDn.toString(), " PdV, pour un total de ", Math.round(ciblageFinitions/1000).toString(), " T (soit ", appropriatePresentation, " de l'objectif).");
  }

  private static getCiblage(enduit=false, dn=false){
    let ciblage:number = +this.computeCiblage(enduit, dn);
    if (enduit) return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " T.");
    else if (dn) return "Ciblage: ".concat(ciblage.toString(), " PdV.");
    else return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " km??."); // the "/1000" is due to the fact that ciblage are in m??, not in km??
  }

  private static getObjectif(node: Node, finition=false, dn=false){    
    if ((finition && !['root', 'drv', 'agentFinitions'].includes(node.nature)) || (!finition && node.nature !== 'agent')) return "";
    let objective = DEH.getTarget(node.nature, node.id, dn, finition);
    if (finition) return "Objectif: ".concat(Math.round(objective).toString(), " T, ");
    return (dn) ? "Objectif: ".concat(objective.toString(), " PdV, "): "Objectif: ".concat((Math.round(objective)).toString(), " km??, ");
  }

  private static getObjectifDrv(node:Node, dn=false){
    if (!['root', 'drv'].includes(node.nature)) return "";
    let targetDrv = (node.nature == 'root') ? DEH.getTarget('nationalByAgent', 0, dn):
      (node.children as Node[]).reduce((acc:number, agentNode:Node) => acc + DEH.getTarget('agent', agentNode.id, dn), 0);
    return (dn) ? "DRV: ".concat(targetDrv!.toString(), " PdV, "): "DRV: ".concat((Math.round(targetDrv!)).toString(), " km??, ");
  }

  private static getObjectifSiege(node: Node, dn=false):string{
    if (!['root', 'drv'].includes(node.nature)) return "";
    let targetSiege =  DEH.getTarget(node.nature, node.id, dn);
    return (dn) ? "Objectif Si??ge: ".concat(targetSiege.toString(), " PdV, "): "Objectif Si??ge: ".concat((Math.round(targetSiege)).toString(), " km??, ");
  }

  static computeDescriptionWidget(node:Node): [number, number, number][]{
    let ciblage = this.computeCiblage();
    let objectiveWidget: [number, number, number] = [
      (node.children as Node[]).map(subLevelNode => DEH.getTarget(subLevelNode.nature, subLevelNode.id)).reduce((acc, value) => acc + value, 0),
      (node.children as Node[]).map(subLevelNode => DEH.getTarget(subLevelNode.nature, subLevelNode.id, true)).reduce((acc, value) => acc + value, 0),
      0],
      ciblageWidget: [number, number, number] = [0, 0, 0];
    objectiveWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / objectiveWidget[0]; // divided by 10 because *100 to be in % and /1000 to be in km2
    if (node.nature == 'root'){
      let agentNodes = (node.children as Node[]).map(drvNode => drvNode.children as Node[]).reduce((acc: Node[], list: Node[]) => acc.concat(list), []);
      ciblageWidget = [
      agentNodes.map(agentNode => DEH.getTarget('agent', agentNode.id)).reduce((acc, value) => acc + value, 0),
      agentNodes.map(agentNode => DEH.getTarget('agent', agentNode.id, true)).reduce((acc, value) => acc + value, 0),
      0]
      ciblageWidget[2] = (ciblageWidget[0] == 0) ? 100 : 0.1 * ciblage / ciblageWidget[0]; 
    } else ciblageWidget = [
      ciblage / 1000,
      this.computeCiblage(false, true),
      100];
    return [objectiveWidget, ciblageWidget];
  }

  static computeCiblage(enduit=false, dn=false){
    return SliceDice.currentSlice.reduce((acc, pdv) => acc + pdv.getCiblage(enduit, dn), 0);
  }
}