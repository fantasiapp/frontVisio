import DEH from './DataExtractionHelper';
import {Injectable} from '@angular/core';
import {Node} from './Node';
import {DataService, UpdateFields} from '../services/data.service';
import {PDV} from './Pdv'


// à mettre dans le back
const enduitAxis = ['enduitIndustry', 'segmentDnEnduit', 'segmentDnEnduitTarget', 'enduitIndustryTarget'],
  gaugesAxis = ['visits', 'targetedVisits', 'avancementAD'];
  
@Injectable({providedIn: 'root'})
export class SliceDice{
  geoTree: boolean = true;
  private updateTargetName?: string;
  constructor(private dataService: DataService){console.log('[SliceDice]: on');}

  getWidgetData(slice:any, axis1:string, axis2:string, indicator:string, groupsAxis1:(number|string[]), 
      groupsAxis2:(number|string[]), percentIndicator:string, transpose=false, target=false, addConditions:[string, number[]][] = []){
      
    if (gaugesAxis.includes(axis1)){
      let jauge = PDV.computeJauge(slice, axis1);
      return {data: jauge[0], sum: 0, target: undefined, colors: undefined, targetLevel: {}, threshold: jauge[1]};
    }
    let colors; [colors, groupsAxis1, groupsAxis2] = this.computeColorsWidget(groupsAxis1, groupsAxis2);
    let dataWidget = PDV.getData(slice, axis1, axis2, indicator.toLowerCase(), this.geoTree, addConditions);
    let km2 = !['dn', 'visits'].includes(indicator) ? true : false, sortLines = percentIndicator !== 'classic' && axis1 != 'suiviAD';
    dataWidget.widgetTreatement(km2, sortLines, false, percentIndicator, groupsAxis1 as string[], groupsAxis2 as string[]);
    let sum = dataWidget.getSum();
    let targetsStartingPoint = dataWidget.getTargetStartingPoint(axis1);
    let rodPosition = undefined, rodPositionForCiblage = undefined,
      targetLevel: {'name' : string, 'ids': any[], 'volumeIdentifier' : string, 'structure': string} = 
        {'name' : "", 'ids': [], 'volumeIdentifier' : "", 'structure': ''};
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let dn = indicator == 'dn';
      let node = DEH.followSlice(slice);      
      if(typeof(sum) == 'number'){
        let targetValue = DEH.getTarget(node.nature, node.id, dn, finition);      
        rodPosition = 360 * Math.min((targetValue + targetsStartingPoint) / sum, 1);
      } else{
        rodPosition = new Array(dataWidget.columnsTitles.length).fill(0);
        let elemIds = new Array(dataWidget.columnsTitles.length).fill(0);
        for (let [id, j] of Object.entries(dataWidget.idToJ)) if (j !== undefined) elemIds[j] = id; // pour récupérer les ids des tous les éléments de l'axe
        targetLevel['ids'] = elemIds;
        let targetValues = 
          DEH.getListTarget(finition ? 'agentFinitions': (node.children[0] as Node).nature, elemIds, dn, finition);;
        for (let i = 0; i < targetValues.length; i++) 
          rodPosition[i] = Math.min((targetValues[i] + targetsStartingPoint[i]) / sum[i], 1);
        if (node.nature == 'root' && !finition){ // This is to calculate the position of the ciblage rods
          let drvNodes: Node[] = node.children as Node[];
          let agentNodesMatrix: Node[][] = drvNodes.map((drvNode:Node) => drvNode.children as Node[]);
          let ciblageValues = agentNodesMatrix.map(
            (agentNodesOfADrv: Node[]) => agentNodesOfADrv.map((agentNode: Node) => DEH.getTarget('Secteur', agentNode.id, dn))
              .reduce((acc:number, value:number) => acc + value, 0));
          rodPositionForCiblage = new Array(dataWidget.columnsTitles.length).fill(0);
          for (let i = 0; i < targetValues.length; i++) 
            rodPositionForCiblage[i] = Math.min((ciblageValues[i] + targetsStartingPoint[i]) / sum[i], 1);
        }
      }
      targetLevel['volumeIdentifier'] = dn ? 'dn': 'vol';
      if(finition) targetLevel['name'] = 'targetLevelAgentFinitions';
      else if(node.nature == 'root') targetLevel['name'] = 'targetLevelDrv';
      else if(node.nature == 'drv') targetLevel['name'] = 'targetLevelAgentP2CD';
      else targetLevel['name'] = 'targetLevel'
      targetLevel['structure'] = 'structureTargetlevel';
    }
    if (typeof(sum) !== 'number') sum = 0;
    return {data: dataWidget.formatWidget(transpose), sum: sum, target: rodPosition, 
      colors: colors, targetLevel: targetLevel, ciblage: rodPositionForCiblage}    
  }

  private computeColorsWidget(groupsAxis1: number|string[], groupsAxis2: number|string[]){
    let groupsAxis = (typeof(groupsAxis1) == 'number') ? groupsAxis1: groupsAxis2;
    let labelsIds = DEH.get('axisForGraph')[+groupsAxis][DEH.AXISFORGRAHP_LABELS_ID];
    groupsAxis = labelsIds.map(
      (labelId:number) => DEH.get('labelForGraph')[labelId][DEH.LABELFORGRAPH_LABEL_ID]);
    let colors = labelsIds.map((labelId:number) => DEH.get('labelForGraph')[labelId][DEH.LABELFORGRAPH_COLOR_ID]);
    if (typeof(groupsAxis1) == 'number') groupsAxis1 = groupsAxis; else groupsAxis2 = groupsAxis;
    return [colors, groupsAxis1, groupsAxis2];
  }

  rubiksCubeCheck(slice:any, indicator: string, percent:string){
    let sortLines = percent !== 'classic';
    let dataWidget = PDV.getData(slice, 'enseigne', 'segmentMarketing', indicator.toLowerCase(), this.geoTree, []);
    dataWidget.widgetTreatement(false, sortLines, true);
    return dataWidget.numberToBool()
  }

  getIndustriesReverseDict(){
    let industriesReverseDict:{[key:string]:string} = {};
    for (let [industrieId, industrieName] of Object.entries(DEH.get('industry')))
      industriesReverseDict[industrieName as string] = industrieId;
    return industriesReverseDict;
  }

  updateTargetLevel(newValue: number, targetLevelName: string, targetLevelId: string, 
      volumeid: number, targetLevelStructure: string) {
    let newTargetLevel: number[] = DEH.get(targetLevelName)[targetLevelId]
    newTargetLevel[+DEH.get(targetLevelStructure).indexOf(volumeid)] = +newValue;
    this.dataService.updateTargetLevel(newTargetLevel, targetLevelName as UpdateFields, +targetLevelId);
  }
};