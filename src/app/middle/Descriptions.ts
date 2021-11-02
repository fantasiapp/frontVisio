import DEH from "./DataExtractionHelper";
import {PDV} from "./Slice&Dice";

export class CD{ //For ComputeDescription
  static computeDescription(slice:any, description:string[]){
    let descriptionCopy = description.slice();    
    let relevantNode:any = DEH.followSlice(slice);
    if (descriptionCopy.length == 1) return descriptionCopy[0];
    for (let i = 0; i < descriptionCopy.length; i++){
      if (descriptionCopy[i] == '') continue;
      if (descriptionCopy[i][0] == '@') descriptionCopy[i] = this.treatDescIndicator(relevantNode, descriptionCopy[i]) as string;
    }
    return descriptionCopy.reduce((str:string, acc: string) => str + acc, "");
  }

  private static treatDescIndicator(node:any, str:string):string{
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

  private static getCompleteCiblageFinitions(node:any){
    if (!['France', 'Région', 'Agent Finition'].includes(node.label)) return "";
    let ciblageDn = PDV.computeCiblage(node, true, true),
        ciblageFinitions = PDV.computeCiblage(node, true),
        objective = DEH.getTarget(node.label, node.id, false, true);
    let percent = (objective == 0) ? 0: 0.1 * ciblageFinitions/objective,
      appropriatePresentation = (percent <= 100) ? Math.round(percent).toString().concat(" %"): "plus de 100 %";
    return "Ciblage: ".concat(ciblageDn.toString(), " PdV, pour un total de ", Math.round(ciblageFinitions/1000).toString(), " T (soit ", appropriatePresentation, " de l'objectif).");
  }

  private static getCiblage(node:any, enduit=false, dn=false){
    let ciblage:number = +PDV.computeCiblage(node, enduit, dn);
    if (enduit) return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " T.");
    else if (dn) return "Ciblage: ".concat(ciblage.toString(), " PdV.");
    else return "Ciblage: ".concat(Math.round(ciblage/1000).toString(), " km²."); // les ciblages c'est les seuls à être en m² et pas en km²
  }

  private static getObjectif(node:any, finition=false, dn=false){    
    if ((finition && !['France', 'Région', 'Agent Finition'].includes(node.label)) || (!finition && node.label !== 'Secteur')) return "";
    let objective = DEH.getTarget(node.label, node.id, dn, finition);
    if (finition) return "Objectif: ".concat(Math.round(objective).toString(), " T, ");
    return (dn) ? "Objectif: ".concat(objective.toString(), " PdV, "): "Objectif: ".concat((Math.round(objective)).toString(), " km², ");
  }

  private static getObjectifDrv(node:any, dn=false){
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetDrv:number;
    if (node.label == 'France') targetDrv = DEH.getTarget('nationalByAgent', 0, dn);
    if (node.label == 'Région') targetDrv = node.children.map((agentNode:any) => DEH.getTarget('Secteur', agentNode.id, dn)).reduce((acc:number, value:number) => acc + value, 0);
    return (dn) ? "DRV: ".concat(targetDrv!.toString(), " PdV, "): "DRV: ".concat((Math.round(targetDrv!)).toString(), " km², ");
  }

  private static getObjectifSiege(node:any, dn=false):string{
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetSiege =  DEH.getTarget(node.label, node.id, dn);
    return (dn) ? "Objectif Siège: ".concat(targetSiege.toString(), " PdV, "): "Objectif Siège: ".concat((Math.round(targetSiege)).toString(), " km², ");
  }

  static computeDescriptionWidget(slice:any): [number, number, number][]{
    let relevantNode:any = DEH.followSlice(slice),
      ciblage = PDV.computeCiblage(relevantNode);
    let objectiveWidget: [number, number, number] = [
      (relevantNode.children as any[]).map(subLevelNode => DEH.getTarget(subLevelNode.label, subLevelNode.id)).reduce((acc, value) => acc + value, 0),
      (relevantNode.children as any[]).map(subLevelNode => DEH.getTarget(subLevelNode.label, subLevelNode.id, true)).reduce((acc, value) => acc + value, 0),
      0],
      ciblageWidget: [number, number, number] = [0, 0, 0];
    objectiveWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / objectiveWidget[0]; // on divise par 10 car on fait *100 pour mettre en % et /1000 pour tout mettre en km2
    if (relevantNode.label == 'France'){
      let agentNodes = (relevantNode.children as any[]).map(drvNode => drvNode.children as any[]).reduce((acc: any[], list: any[]) => acc.concat(list), []);
      ciblageWidget = [
      agentNodes.map(agentNode => DEH.getTarget('Secteur', agentNode.id)).reduce((acc, value) => acc + value, 0),
      agentNodes.map(agentNode => DEH.getTarget('Secteur', agentNode.id, true)).reduce((acc, value) => acc + value, 0),
      0]
      ciblageWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / ciblageWidget[0]; 
    } else ciblageWidget = [
      ciblage / 1000,
      PDV.computeCiblage(relevantNode, false, true),
      100];
    return [objectiveWidget, ciblageWidget];
  }
}