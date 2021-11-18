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

  updateCurrentNode(node:Node){
    SliceDice.currentNode = node;
    SliceDice.currentSlice = PDV.slice(node);
  }

  getWidgetData(axisName1:string, axisName2:string, indicator:string, groupsAxis1:(number|string[]), 
      groupsAxis2:(number|string[]), percentIndicator:string, transpose=false, 
      target=false, addConditions:[string, number[]][] = []){
 
    let colors1, colors2, axis1, axis2;
    [colors1, axis1, groupsAxis1] = this.extractInfoFromGroupAxis(groupsAxis1);
    [colors2, axis2, groupsAxis2] = this.extractInfoFromGroupAxis(groupsAxis2);
    let colors = colors1 ? colors1: (colors2 ? colors2: undefined);
    let dataWidget = this.getDataFromPdvs(
      axisName1, axisName2, indicator.toLowerCase(), addConditions, axis1, axis2);
    let km2 = !dnIndicators.includes(indicator) ? true : false, 
      sortLines = (percentIndicator !== 'classic') && (axisName1 != 'suiviAD');
    dataWidget.widgetTreatement(km2, sortLines, (axisName1 !== 'histoCurve') ? 'all': 'no', 
      groupsAxis1 as string[], groupsAxis2 as string[]);
    let sum = dataWidget.getSum();
    // it is important to collect the piece of information below before changing dataWidget in percent
    let targetsStartingPoint = dataWidget.getTargetStartingPoint(axisName1); 
    if (percentIndicator == 'classic') dataWidget.percent(); 
    else if (percentIndicator == 'cols') dataWidget.percent(true);
    let [rodPosition, rodPositionForCiblage, targetLevel] = this.computeTargetElements(
      axisName1, axisName2, dataWidget, sum, targetsStartingPoint, target, indicator);    
    if (typeof(sum) !== 'number') sum = 0;
    return {
      data: dataWidget.formatWidgetForGraph(
        SliceDice.currentNode, transpose, axisName1, SliceDice.currentSlice.length), 
      sum: sum, target: rodPosition, colors: colors, targetLevel: targetLevel, ciblage: rodPositionForCiblage, 
      threshold: this.getThresholdsForGauge(indicator)
    }    
  }

  rubiksCubeCheck(indicator: string, percent:string){
    let sortLines = percent !== 'classic';
    let dataWidget = this.getDataFromPdvs(
      'enseigne', 'segmentMarketing', indicator.toLowerCase(), []);
    dataWidget.widgetTreatement(false, sortLines, 'justLines');
    return dataWidget.numberToBool()
  }

  updateTargetLevel(newValue: number, targetLevelName: string, targetLevelId: string, 
      volumeid: number, targetLevelStructure: string){
    let newTargetLevel: number[] = DEH.get(targetLevelName)[targetLevelId]
    newTargetLevel[+DEH.get(targetLevelStructure).indexOf(volumeid)] = +newValue;
    this.dataService.updateTargetLevel(
      newTargetLevel, targetLevelName as UpdateFields, +targetLevelId);
  }
  
  private computeTargetElements(axis1:string, axis2:string, dataWidget:DataWidget, sum:number|number[], 
      targetsStartingPoint:number|number[], target:boolean, indicator:string){

    let rodPosition = undefined, rodPositionForCiblage = undefined, 
    targetLevel: {[key:string]:any} = {'name' : '', 'ids': [], 'volumeIdentifier' : '', 'structure': ''};
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let dn = indicator == 'dn';   
      if(dataWidget.getDim() == 1){
        let targetValue = DEH.getTarget(
          SliceDice.currentNode.nature, SliceDice.currentNode.id, dn, finition);
        rodPosition = 360 * Math.min((targetValue + targetsStartingPoint) / +sum, 1);
      } else{
        let elemIds = dataWidget.getColumnIds();
        targetLevel['ids'] = elemIds;
        let targetValues = DEH.getListTarget(finition ? 'agentFinitions': 
          (SliceDice.currentNode.children[0] as Node).nature, elemIds, dn, finition);
        rodPosition = this.rodValuesToRodPositions(
          targetValues, targetsStartingPoint as number[], sum as number[]);
        if (SliceDice.currentNode.nature == 'root' && !finition){ //if we need ciblage rods
          let ciblageValues = (SliceDice.currentNode.children as Node[]).map(
            (drvNode:Node) => (drvNode.children as Node[]).reduce(
              (acc:number, agentNode:Node) => acc + DEH.getTarget(
                agentNode.nature, agentNode.id, dn), 0));
          rodPositionForCiblage = this.rodValuesToRodPositions(
            ciblageValues, targetsStartingPoint as number[], sum as number[]);
        }
      }
      this.completeTargetLevel(targetLevel, dn, finition);
    }
    return [rodPosition, rodPositionForCiblage, targetLevel];
    }

  private rodValuesToRodPositions(rodValues: number[], targetsStartingPoint:number[], sum: number[]){
    let rodPositions = new Array(rodValues.length).fill(0);
    for (let i = 0; i < rodValues.length; i++)
      rodPositions[i] = Math.min((rodValues[i] + (targetsStartingPoint as number[])[i]) / sum[i], 1);
    return rodPositions;
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
        let thresholdForGreen = 100 * DEH.computeTargetVisits(SliceDice.currentNode, true);
        return [thresholdForGreen / 2, thresholdForGreen, 100];
      };
      case 'avancementAD': return [33, 66, 100];
      default: return undefined;
    }
  }

  private extractInfoFromGroupAxis(groupsAxis: number|string[]){

    if (typeof(groupsAxis) !== 'number') return [undefined, undefined, groupsAxis];
    let labelsIds = DEH.get('axisForGraph')[+groupsAxis]
      [DEH.getPositionOfAttr('structureAxisforgraph', 'labels')];
    groupsAxis = labelsIds.map(
      (labelId:number) => DEH.get('labelForGraph')
        [labelId][DEH.getPositionOfAttr('structureLabelforgraph', 'label')]) as string[];
    let colors = labelsIds.map(
      (labelId:number) => DEH.get('labelForGraph')
        [labelId][DEH.getPositionOfAttr('structureLabelforgraph', 'color')]);
    let orderForCompute = labelsIds.map(
      (labelId:number) => DEH.get('labelForGraph')
        [labelId][DEH.getPositionOfAttr('structureLabelforgraph', 'orderForCompute')]);
    let axis = new Array(orderForCompute.length).fill("");
    for (let i = 0; i < axis.length; i++) axis[orderForCompute[i]] = groupsAxis[i];
    return [colors, axis, groupsAxis];
  }
  
  private fillUpWidget(dataWidget: DataWidget, axisName1:string, axisName2:string, 
    indicator:string, addConditions:[string, number[]][], axis1?:string[], axis2?:string[]): void{

    let newPdvs = (addConditions.length == 0) ? SliceDice.currentSlice: 
      PDV.reSlice(SliceDice.currentSlice, addConditions);
    let irregular: 'no'|'line'|'col' = 'no';
    if (nonRegularAxis.includes(axisName1)) irregular = 'line';
    else if (nonRegularAxis.includes(axisName2)) irregular = 'col';
    for (let pdv of newPdvs){
      if (irregular == 'no') 
        dataWidget.addOnCase(
          pdv[axisName1 as keyof PDV], pdv[axisName2 as keyof PDV], pdv.getValue(indicator, axisName1) as number);
      else if (irregular == 'line') 
        dataWidget.addOnColumn(
          pdv[axisName2 as keyof PDV], pdv.getValue(indicator, axisName1, axis1) as number[]);
      else if (irregular == 'col') 
        dataWidget.addOnRow(
          pdv[axisName1 as keyof PDV], pdv.getValue(indicator, axisName2, axis2) as number[]);
    }
  }

  private ComputeAxisName(axis:string){
    switch(axis){
      case 'lgp-1': return PDV.geoTree.attributes['natures'][1];
      case 'lg-1': case 'lt-1':{
        let childNature = SliceDice.currentNode.children[0] instanceof PDV ? 'site': 
        (SliceDice.currentNode.children[0] as Node).nature;
        return childNature;
      }
      default: return axis
    }
  }

  private computeElementFromAxis(axisName:string, axis?:string[]){
    axisName = this.ComputeAxisName(axisName);
    let dataAxis: any , titles:string[],
      idToX:any = {};
    if (!DEH.isRegularAxis(axisName)){
      titles = axis!;
      dataAxis = axis;
    } else{
      dataAxis = DEH.get(axisName, true);
      titles = Object.values(dataAxis);
    }
    Object.keys(dataAxis).forEach((id, index) => idToX[parseInt(id)] = index);
    return [axisName, titles, idToX];
  }

  // private computeElementFromAxis(axisName:string, axis?:string[]){
  //   axisName = this.ComputeAxisName(axisName);
  //   if (!DEH.isRegularAxis(axisName)) return [axisName, axis, {}];
  //   let dataAxis = DEH.get(axisName, true), titles = Object.values(dataAxis),
  //     idToX:any = {};
  //   Object.keys(dataAxis).forEach((id, index) => idToX[parseInt(id)] = index);
  //   return [axisName, titles, idToX];
  // }

  private getDataFromPdvs(axisName1: string, axisName2: string, indicator: string, addConditions:[string, number[]][],
      axis1?:string[], axis2?:string[]): DataWidget{

    let [newAxis1, rowsTitles, idToI] = this.computeElementFromAxis(axisName1, axis1),
        [newAxis2, columnsTitles, idToJ] = this.computeElementFromAxis(axisName2, axis2);
    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpWidget(dataWidget, newAxis1, newAxis2, indicator, addConditions, axis1, axis2);
    return dataWidget;
  }  
};