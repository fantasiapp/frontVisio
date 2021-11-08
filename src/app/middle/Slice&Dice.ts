import DEH from './DataExtractionHelper';
import {Injectable} from '@angular/core';
import {Node} from './Node';
import {DataService, UpdateFields} from '../services/data.service';
import {PDV} from './Pdv';
import {DataWidget} from './DataWidget';


// à mettre dans le back
const enduitAxis = ['enduitIndustry', 'segmentDnEnduit', 'segmentDnEnduitTarget', 'enduitIndustryTarget'],
  gaugesAxis = ['visits', 'targetedVisits', 'avancementAD'],
  nonRegularAxis = ['mainIndustries', 'enduitIndustry', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 
    'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'enduitIndustryTarget', 'industryTarget', 'suiviAD', 'weeks'],
  visitAxis = ['segmentDnEnduitTargetVisits'];
  
@Injectable()
export class SliceDice{
  geoTree: boolean = true; // on peut le supprimer maintenant je pense
  static currentSlice: PDV[] = [];
  constructor(private dataService: DataService){
    //console.log('[SliceDice]: on');
  }

  getWidgetData(node:Node, axis1:string, axis2:string, indicator:string, groupsAxis1:(number|string[]), 
      groupsAxis2:(number|string[]), percentIndicator:string, transpose=false, target=false, addConditions:[string, number[]][] = []){
 
    if (gaugesAxis.includes(axis1)){
      let jauge = this.computeJauge(node, axis1);
      return {data: jauge[0], sum: 0, target: undefined, colors: undefined, targetLevel: {}, threshold: jauge[1]};
    }
    let colors; [colors, groupsAxis1, groupsAxis2] = this.computeColorsWidget(groupsAxis1, groupsAxis2);
    let dataWidget = this.getDataFromPdvs(node, axis1, axis2, indicator.toLowerCase(), addConditions);
    let km2 = !['dn', 'visits'].includes(indicator) ? true : false, sortLines = percentIndicator !== 'classic' && axis1 != 'suiviAD';
    dataWidget.widgetTreatement(km2, sortLines, (axis1 !== 'histoCurve') ? 'all': 'no', groupsAxis1 as string[], groupsAxis2 as string[]);
    let sum = dataWidget.getSum();
    let targetsStartingPoint = dataWidget.getTargetStartingPoint(axis1);
    if (percentIndicator == 'classic') dataWidget.percent(); else if (percentIndicator == 'cols') dataWidget.percent(true);
    let rodPosition = undefined, rodPositionForCiblage = undefined,
    targetLevel: {'name' : string, 'ids': any[], 'volumeIdentifier' : string, 'structure': string} = 
    {'name' : "", 'ids': [], 'volumeIdentifier' : "", 'structure': ''};
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let dn = indicator == 'dn';   
      if(dataWidget.getDim() == 1){
        let targetValue = DEH.getTarget(node.nature, node.id, dn, finition);
        rodPosition = 360 * Math.min((targetValue + targetsStartingPoint) / +sum, 1);
      } else{
        rodPosition = new Array(dataWidget.columnsTitles.length).fill(0);
        let elemIds = new Array(dataWidget.columnsTitles.length).fill(0);
        for (let [id, j] of Object.entries(dataWidget.idToJ)) if (j !== undefined) elemIds[j] = id; // pour récupérer les ids des tous les éléments de l'axe
        targetLevel['ids'] = elemIds;
        let targetValues = 
          DEH.getListTarget(finition ? 'agentFinitions': (node.children[0] as Node).nature, elemIds, dn, finition);;
        for (let i = 0; i < targetValues.length; i++) 
          rodPosition[i] = Math.min((targetValues[i] + targetsStartingPoint[i]) / (sum as number[])[i], 1);
        if (node.nature == 'root' && !finition){ // This is to calculate the position of the ciblage rods
          let ciblageValues = (node.children as Node[]).map(
            (drvNode:Node) => (drvNode.children as Node[]).reduce(
              (acc:number, agentNode:Node) => acc + DEH.getTarget(agentNode.nature, agentNode.id, dn), 0));
          rodPositionForCiblage = new Array(dataWidget.columnsTitles.length).fill(0);
          for (let i = 0; i < targetValues.length; i++)
            rodPositionForCiblage[i] = Math.min((ciblageValues[i] + targetsStartingPoint[i]) / (sum as number[])[i], 1);
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
    return {data: dataWidget.formatWidget(transpose, axis1 == 'histoCurve', SliceDice.currentSlice.length), sum: sum, target: rodPosition, 
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

  updateCurrentSlice(node:Node){
    SliceDice.currentSlice = PDV.slice(node);
  }

  private computeJauge(node:Node, indicator:string): [[string, number][], number[]]{
    switch(indicator){
      case 'visits': {
        let totalVisits: number= 0,
          cibleVisits:number = PDV.computeTargetVisits(node) as number,
          threshold = [50, 99.99, 100];
        for (let pdv of SliceDice.currentSlice) totalVisits += pdv.nbVisits;
        let adaptedVersion = (totalVisits >= 2) ? ' visites': ' visite';
        return [[[totalVisits.toString().concat(adaptedVersion, ' sur un objectif de ', cibleVisits.toString()), 100 * Math.min(totalVisits / cibleVisits, 1)]], threshold];
      };
      case 'targetedVisits': {
        let totalVisits = 0, totalCibleVisits = 0, thresholdForGreen = 100 * PDV.computeTargetVisits(node, true),
          threshold = [thresholdForGreen / 2, thresholdForGreen, 100];
        for (let pdv of SliceDice.currentSlice){
          totalVisits += pdv.nbVisits;
          if (pdv.targetFinition) totalCibleVisits += pdv.nbVisits;
        }
        let adaptedVersion = (totalCibleVisits >= 2) ? ' visites ciblées': ' visite ciblée';
        return [[[totalCibleVisits.toString().concat(adaptedVersion, ' sur un total de ', totalVisits.toString()), 100 * totalCibleVisits / totalVisits]], threshold];
      };
      case 'avancementAD': {
        let nbCompletedPdv = SliceDice.currentSlice.reduce((acc: number, pdv:PDV) => pdv.adCompleted() ? acc + 1: acc, 0),
          ratio = nbCompletedPdv / SliceDice.currentSlice.length,
          adaptedVersion = (nbCompletedPdv >= 2) ? ' PdV complétés':  'PdV complété';
        return [[[nbCompletedPdv.toString().concat(adaptedVersion, ' sur un total de ', SliceDice.currentSlice.length.toString()), 100 * ratio]], [33, 66, 100]];
       }
      default: return [[['  ', 100 * Math.random()]], [33, 66, 100]];
    }
  }
  
  private fillUpWidget(dataWidget: DataWidget, axis1:string, axis2:string, indicator:string, 
      addConditions:[string, number[]][]): void{
    let newPdvs = (addConditions.length == 0) ? SliceDice.currentSlice: PDV.reSlice(SliceDice.currentSlice, addConditions);
    let irregular: string = 'no';
    if (nonRegularAxis.includes(axis1)) irregular = 'line';
    else if (nonRegularAxis.includes(axis2)) irregular = 'col';
    let visit = visitAxis.includes(axis1) || visitAxis.includes(axis2);
    for (let pdv of newPdvs){
      if (irregular == 'no') 
        dataWidget.addOnCase(
          pdv[axis1 as keyof PDV], pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1, visit) as number);
      else if (irregular == 'line') 
        dataWidget.addOnColumn(
          pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1, visit) as number[]);
      else if (irregular == 'col') 
        dataWidget.addOnRow(
          pdv[axis1 as keyof PDV], pdv.getValue(indicator, axis2, visit) as number[]);
    }
  }

  private ComputeAxisName(node:Node, axis:string){
    if (axis == 'lgp-1') return PDV.geoTree.attributes['natures'][1];
    if (['lg-1', 'lt-1'].includes(axis)){
      let childNature = node.children[0] instanceof PDV ? 'site': (node.children[0] as Node).nature;
      return childNature;
    }
    return axis
  }

  private computeAxis(node:Node, axis:string){
    axis = this.ComputeAxisName(node, axis);
    let dataAxis = DEH.get(axis, true), titles = Object.values(dataAxis),
      idToX:any = {};
    Object.keys(dataAxis).forEach((id, index) => idToX[parseInt(id)] = index);
    return [axis, titles, idToX];
  }

  private getDataFromPdvs(node: Node, axis1: string, axis2: string, indicator: string,
      addConditions:[string, number[]][]): DataWidget{
    let [newAxis1, rowsTitles, idToI] = this.computeAxis(node, axis1),
        [newAxis2, columnsTitles, idToJ] = this.computeAxis(node, axis2);
    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpWidget(dataWidget, newAxis1, newAxis2, indicator, addConditions);
    return dataWidget;
  }

  rubiksCubeCheck(node:any, indicator: string, percent:string){
    let sortLines = percent !== 'classic';
    let dataWidget = this.getDataFromPdvs(node, 'enseigne', 'segmentMarketing', indicator.toLowerCase(), []);
    dataWidget.widgetTreatement(false, sortLines, 'justLines');
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