import DEH from './DataExtractionHelper';
import {Injectable} from '@angular/core';
import {Node} from './Node';
import {DataService, UpdateFields} from '../services/data.service';
import {PDV} from './Pdv';
import {DataWidget} from './DataWidget';


// à mettre dans le back
const enduitAxis = ['enduitIndustry', 'segmentDnEnduit', 'segmentDnEnduitTarget', 'enduitIndustryTarget'],
  nonRegularAxis = ['mainIndustries', 'enduitIndustry', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 
    'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'enduitIndustryTarget', 'industryTarget', 'suiviAD', 'weeks'],
  dnIndicators = ['dn', 'visits', 'targetedVisits', 'avancementAD'];
  
@Injectable()
export class SliceDice{
  geoTree: boolean = true;
  static currentSlice: PDV[] = [];
  static currentNode: Node;
  constructor(private dataService: DataService){}

  getWidgetData(axis1:string, axis2:string, indicator:string, groupsAxis1:(number|string[]), 
      groupsAxis2:(number|string[]), percentIndicator:string, transpose=false, target=false, addConditions:[string, number[]][] = []){
 
    let colors; [colors, groupsAxis1, groupsAxis2] = this.computeColorsWidget(groupsAxis1, groupsAxis2);
    let dataWidget = this.getDataFromPdvs(axis1, axis2, indicator.toLowerCase(), addConditions);
    let km2 = !dnIndicators.includes(indicator) ? true : false, 
      sortLines = percentIndicator !== 'classic' && axis1 != 'suiviAD';
    dataWidget.widgetTreatement(km2, sortLines, (axis1 !== 'histoCurve') ? 'all': 'no', groupsAxis1 as string[], groupsAxis2 as string[]);
    let sum = dataWidget.getSum();
    let targetsStartingPoint = dataWidget.getTargetStartingPoint(axis1); // it is important to collect this piece of information before changing dataWidget in percent
    if (percentIndicator == 'classic') dataWidget.percent(); else if (percentIndicator == 'cols') dataWidget.percent(true);
    let [rodPosition, rodPositionForCiblage, targetLevel] = this.computeTargetElements(axis1, axis2, dataWidget, sum, targetsStartingPoint, target, indicator);    
    if (typeof(sum) !== 'number') sum = 0;
    return {data: dataWidget.formatWidgetForGraph(SliceDice.currentNode, transpose, axis1, SliceDice.currentSlice.length), sum: sum, target: rodPosition, 
      colors: colors, targetLevel: targetLevel, ciblage: rodPositionForCiblage, threshold: this.getThresholdsForGauge(indicator)}    
  }
  
  private computeTargetElements(axis1:string, axis2:string, dataWidget:DataWidget, sum:number|number[], targetsStartingPoint:number|number[], target:boolean, indicator:string){
    let rodPosition = undefined, rodPositionForCiblage = undefined, 
    targetLevel: {[key:string]:any} = {'name' : '', 'ids': [], 'volumeIdentifier' : '', 'structure': ''};
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let dn = indicator == 'dn';   
      if(dataWidget.getDim() == 1){
        let targetValue = DEH.getTarget(SliceDice.currentNode.nature, SliceDice.currentNode.id, dn, finition);
        rodPosition = 360 * Math.min((targetValue + targetsStartingPoint) / +sum, 1);
      } else{
        rodPosition = new Array(dataWidget.columnsTitles.length).fill(0);
        let elemIds = new Array(dataWidget.columnsTitles.length).fill(0);
        for (let [id, j] of Object.entries(dataWidget.idToJ)) if (j !== undefined) elemIds[j] = id; // pour récupérer les ids des tous les éléments de l'axe
        targetLevel['ids'] = elemIds;
        let targetValues = DEH.getListTarget(
          finition ? 'agentFinitions': (SliceDice.currentNode.children[0] as Node).nature, elemIds, dn, finition);;
        for (let i = 0; i < targetValues.length; i++) 
          rodPosition[i] = Math.min((targetValues[i] + (targetsStartingPoint as number[])[i]) / (sum as number[])[i], 1);
        if (SliceDice.currentNode.nature == 'root' && !finition){ // This is to calculate the position of ciblage rods
          let ciblageValues = (SliceDice.currentNode.children as Node[]).map(
            (drvNode:Node) => (drvNode.children as Node[]).reduce(
              (acc:number, agentNode:Node) => acc + DEH.getTarget(agentNode.nature, agentNode.id, dn), 0));
          rodPositionForCiblage = new Array(dataWidget.columnsTitles.length).fill(0);
          for (let i = 0; i < targetValues.length; i++)
            rodPositionForCiblage[i] = Math.min((ciblageValues[i] + (targetsStartingPoint as number[])[i]) / (sum as number[])[i], 1);
        }
      }
      this.completeTargetLevel(targetLevel, dn, finition);
    }
    return [rodPosition, rodPositionForCiblage, targetLevel];
  }
      
  private completeTargetLevel(targetLevel:{[key:string]:any}, dn:boolean, finition:boolean): void{
    targetLevel['volumeIdentifier'] = dn ? 'dn': 'vol';
    if(finition) targetLevel['name'] = 'targetLevelAgentFinitions';
    else if(SliceDice.currentNode.nature == 'root') targetLevel['name'] = 'targetLevelDrv';
    else if(SliceDice.currentNode.nature == 'drv') targetLevel['name'] = 'targetLevelAgentP2CD';
    else targetLevel['name'] = 'targetLevel';
    targetLevel['structure'] = 'structureTargetlevel';
  }

  private getThresholdsForGauge(indicator:string){ // peut-être à mettre dans le DEH
    switch(indicator){
      case 'visits': return [50, 99.99, 100];
      case 'targetedVisits': {
        let thresholdForGreen = 100 * PDV.computeTargetVisits(SliceDice.currentNode, true);
        return [thresholdForGreen / 2, thresholdForGreen, 100];
      };
      case 'avancementAD': return [33, 66, 100];
      default: return undefined;
    }
  }

  private computeColorsWidget(groupsAxis1: number|string[], groupsAxis2: number|string[]){
    if (![typeof(groupsAxis1), typeof(groupsAxis2)].includes('number')) return [undefined, groupsAxis1, groupsAxis2];
    let groupsAxis = (typeof(groupsAxis1) == 'number') ? groupsAxis1: groupsAxis2;
    let labelsIds = DEH.get('axisForGraph')[+groupsAxis][DEH.getPositionOfAttr('structureAxisforgraph',  'labels')];
    groupsAxis = labelsIds.map(
      (labelId:number) => DEH.get('labelForGraph')[labelId][DEH.getPositionOfAttr('structureLabelforgraph',  'label')]);
    let colors = labelsIds.map((labelId:number) => DEH.get('labelForGraph')[labelId][DEH.getPositionOfAttr('structureLabelforgraph',  'color')]);
    if (typeof(groupsAxis1) == 'number') groupsAxis1 = groupsAxis; else groupsAxis2 = groupsAxis;
    return [colors, groupsAxis1, groupsAxis2];
  }

  updateCurrentNode(node:Node){
    SliceDice.currentNode = node;
    SliceDice.currentSlice = PDV.slice(node);
  }
  
  private fillUpWidget(dataWidget: DataWidget, axis1:string, axis2:string, indicator:string, 
      addConditions:[string, number[]][]): void{
    let newPdvs = (addConditions.length == 0) ? SliceDice.currentSlice: PDV.reSlice(SliceDice.currentSlice, addConditions);
    let irregular: string = 'no';
    if (nonRegularAxis.includes(axis1)) irregular = 'line';
    else if (nonRegularAxis.includes(axis2)) irregular = 'col';
    for (let pdv of newPdvs){
      if (irregular == 'no') 
        dataWidget.addOnCase(
          pdv[axis1 as keyof PDV], pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1) as number);
      else if (irregular == 'line') 
        dataWidget.addOnColumn(
          pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1) as number[]);
      else if (irregular == 'col') 
        dataWidget.addOnRow(
          pdv[axis1 as keyof PDV], pdv.getValue(indicator, axis2) as number[]);
    }
  }

  private ComputeAxisName(axis:string){
    if (axis == 'lgp-1') return PDV.geoTree.attributes['natures'][1];
    if (['lg-1', 'lt-1'].includes(axis)){
      let childNature = SliceDice.currentNode.children[0] instanceof PDV ? 'site': (SliceDice.currentNode.children[0] as Node).nature;
      return childNature;
    }
    return axis
  }

  private computeAxis(axis:string){
    axis = this.ComputeAxisName(axis);
    let dataAxis = DEH.get(axis, true), titles = Object.values(dataAxis),
      idToX:any = {};
    Object.keys(dataAxis).forEach((id, index) => idToX[parseInt(id)] = index);
    return [axis, titles, idToX];
  }

  private getDataFromPdvs(axis1: string, axis2: string, indicator: string,
      addConditions:[string, number[]][]): DataWidget{
    let [newAxis1, rowsTitles, idToI] = this.computeAxis(axis1),
        [newAxis2, columnsTitles, idToJ] = this.computeAxis(axis2);
    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpWidget(dataWidget, newAxis1, newAxis2, indicator, addConditions);
    return dataWidget;
  }

  rubiksCubeCheck(indicator: string, percent:string){
    let sortLines = percent !== 'classic';
    let dataWidget = this.getDataFromPdvs('enseigne', 'segmentMarketing', indicator.toLowerCase(), []);
    dataWidget.widgetTreatement(false, sortLines, 'justLines');
    return dataWidget.numberToBool()
  }

  updateTargetLevel(newValue: number, targetLevelName: string, targetLevelId: string, 
      volumeid: number, targetLevelStructure: string){
    let newTargetLevel: number[] = DEH.get(targetLevelName)[targetLevelId]
    newTargetLevel[+DEH.get(targetLevelStructure).indexOf(volumeid)] = +newValue;
    this.dataService.updateTargetLevel(newTargetLevel, targetLevelName as UpdateFields, +targetLevelId);
  }
};