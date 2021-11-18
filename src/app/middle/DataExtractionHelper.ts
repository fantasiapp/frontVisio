import {PDV} from "./Pdv";
import {Node, Tree} from "./Node"
import {LocalStorageService} from "../services/local-storage.service";
import {UpdateData} from "../services/data.service";

// // à démocker
// //axisForGraph
// const mainIndustries = {
//   1: "Siniat",
//   2: "Placo",
//   3: "Knauf",
//   4: "Challengers"
// }

// //axisForGraph
// const enduitIndustry = {
//   1: "Salsi", 
//   2: "Prégy", 
//   3: "Croissance", 
//   4: "Conquête"
// };

// //axisForGraph
// const segmentDnEnduit = {
//   1: "Non documenté",
//   2: "P2CD + Enduit",
//   3: "Enduit hors P2CD",
//   4: "Pur prospect"
// }

// //axisForGraph
// const clientProspect = {
//   1: "Non documenté",
//   2: "Client",
//   3: "Prospect"
// }

// //axisForGraph
// const clientProspectTarget = {
//   1: "Potentiel ciblé",
//   2: "Non documenté",
//   3: "Client",
//   4: "Prospect"
// }

// //axisForGraph
// const segmentDnEnduitTarget = {
//   1: "Non documenté",
//   2: "P2CD + Enduit",
//   3: "Cible P2CD",
//   4: "Enduit hors P2CD",
//   5: "Cible Pur Prospect",
//   6: "Pur prospect"
// }

// //axisForGraph
// const enduitIndustryTarget = {
//   1: "Salsi", 
//   2: "Prégy", 
//   3: "Croissance", 
//   4: "Conquête",
//   5: "Cible Croissance",
//   6: "Cible Conquête"
// };

// //axisForGraph
// const industryTarget = {
//   1: "Potentiel ciblé",
//   2: "Siniat",
//   3: "Placo",
//   4: "Knauf",
//   5: "Challengers"
// }

// //axisForGraph
// const suiviAD = {
//   1: "Terminées",
//   2: "Non mises à jour",
//   3: "Non renseignées"
// }

// //axisForGraph
// const weeks = {
//   1: "avant",
//   2: "s-6",
//   3: "s-5",
//   4: "s-4",
//   5: "s-3",
//   6: "s-2",
//   7: "s-1",
//   8: "s-0",
// }

// //axisForGraph
// const histoCurve = {
//   1: "Nombre de PdV complétés",
//   2: "Cumul en pourcentage"
// }

// //filter
// const pointFeuFilter = {
//   1: 'Non point Feu',
//   2: 'Point feu'
// }

// //filter
// const visitedFilter = {
//   1: 'Visité',
//   2: 'Non visité'
// }

// //filter
// const ciblage = {
//   1: 'Non ciblé',
//   2: 'Ciblé'
// }

// //filter
// const industriel = {
//   1: "Siniat",
//   2: "Placo",
//   3: "Knauf",
//   4: "Autres"
// }

// //filter
// const segmentMarketingFilter = {
//   1: "Purs Spécialistes",
//   2: "Multi Spécialistes",
//   3: "Généralistes",
//   4: "Non documenté"
// }

// //axisForGraph
// const segmentDnEnduitTargetVisits = {
//   1: "Non documenté",
//   2: "Cible P2CD + Enduit",
//   3: "P2CD + Enduit",
//   4: "Cible Enduit hors P2CD",
//   5: "Enduit hors P2CD",
//   6: "Cible Pur Prospect",
//   7: "Pur prospect",
// }

// //axisForGraph
// const avancementAD = {0:""}

// //axisForGraph
// const visits = {0:""}

// //axisForGraph
// const targetedVisits = {0:""}

export class Params {
  static get coeffGreenLight() {
    return DEH.get('params')['coeffGreenLight'];
  }

  static get currentYear() {
    return DEH.get('params')['currentYear'];
  }

  static get currentMonth() {
    return DEH.get('params')['currentMonth'];
  }

  static get delayBetweenUpdates() {
    return DEH.get('params')['delayBetweenUpdates'];
  }

  static get isAdOpen() {
    return DEH.get('params')['isAdOpen'];
  }

  static get pseudo() {
    return DEH.get('params')['pseudo'];
  }

  static get ratioCustomerProspect() {
    return DEH.get('params')['ratioCustomerProspect'];
  }

  static get ratioPlaqueFinition() {
    return DEH.get('params')['ratioPlaqueFinition'];
  }

  static get referentielVersion() {
    return DEH.get('params')['referentielVersion'];
  }

  static get softwareVersion() {
    return DEH.get('params')['softwareVersion'];
  }

  static get rootName() {
    return PDV.geoTree.root.name;
  }

  static get rootNature() {
    return PDV.geoTree.root.nature;
  }

  static get rootLabel() {
    return PDV.geoTree.root.label;
  }
}


class DEH{  // for DataExtractionHelper
  private static data: any;
  private static industriesReverseDict: any;
  private static structuresDict: {[key:string]:{[key:string]:number}}
  static delayBetweenUpdates: number;
  
  static geoLevels: any[] = [];
  static tradeLevels: any[] = [];

  static geoHeight: number;
  static tradeHeight: number;
  static currentYear = true;
  private static fieldsToSwitchWithyear: string[] = [];


  static setData(d: any){
    console.log('[DataExtractionHelper] setData:', d);
    this.data = d;
    for (let field of Object.keys(this.data)) 
      if (!field.startsWith('structure') && !field.startsWith('indexes') && !field.endsWith('_ly') && field.concat('_ly') in this.data) 
        this.fieldsToSwitchWithyear.push(field);
    console.log("[DataExtractionHelper] this.data updated")
    this.industriesReverseDict = {};
    for (let [industrieId, industrieName] of Object.entries(DEH.get('industry')))
      this.industriesReverseDict[industrieName as string] = industrieId;
    this.structuresDict = {};
    for (let field of Object.keys(this.data))
      if (field.startsWith('structure')){
        let structure = this.get(field),
          structureDict:{[key:string]:number} = {};
        for (let i = 0; i < structure.length; i++)
          structureDict[structure[i]] = i;
        this.structuresDict[field] = structureDict;
      }    
    let structure = this.get('structureLevel');
    this.delayBetweenUpdates = this.getParam('delayBetweenUpdates');    
    this.geoLevels = [];
    this.tradeLevels = [];
    let geolevel = this.get('levelGeo');
    while (true){
      this.geoLevels.push(geolevel.slice(0, structure.length-1));
      if (!(geolevel = geolevel[this.getPositionOfAttr('structureLevel', 'subLevel')])) break;
    }
    let tradeLevel = this.get('levelTrade');
    while (true){
      this.tradeLevels.push(tradeLevel.slice(0, structure.length-1));
      if (!(tradeLevel = tradeLevel[this.getPositionOfAttr('structureLevel', 'subLevel')])) break;
    }
    this.geoHeight = this.geoLevels.length;
    this.tradeHeight = this.tradeLevels.length;
  }
  
  static resetData(){
    this.currentYear = true;
  }

  static updateData(data: UpdateData) {    
    // Check how deletions are managed 
    for(let [newPdvId, newPdv] of Object.entries(data.pdvs))
      this.data.pdvs[newPdvId] = newPdv;
    for(let targetType of ['targetLevelAgentP2CD', 'targetLevelAgentFinitions', 'targetLevelDrv'])
      for(let [newTargetId, newTarget] of Object.entries((data as any)[targetType]))
        this.get(targetType)[newTargetId] = newTarget;
    let localStorageService: LocalStorageService = new LocalStorageService();
    localStorageService.saveData(this.data)
    DEH.setData(this.data);
    PDV.load(true);
  }

  static getGeoLevel(height: number){
    if (height >= this.geoLevels.length || height < 0)
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.geoLevels[height];
  }

  static getGeoLevelLabel(height: number): string{
    return this.getGeoLevel(height)[this.getPositionOfAttr('structureLevel', 'prettyPrint')];
  }
  
  static getGeoLevelName(height: number, id: number): string{
    let name = this.get(this.getGeoLevel(height)[this.getPositionOfAttr('structureLevel', 'levelName')])[id];
    if (name == undefined) throw `No geo level with id=${id} at height ${height}`;
    if (Array.isArray(name))
    return name[this.get('structureAgentfinitions').indexOf('name')];
    return name;
  }
  
  static getTradeLevel(height: number){
    if (height >= this.tradeLevels.length || height < 0)
    throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.tradeLevels.length}`;
    return this.tradeLevels[height];
  }
  
  static getTradeLevelLabel(height: number): string{
    return this.getTradeLevel(height)[this.getPositionOfAttr('structureLevel', 'prettyPrint')];
  }
  
  static getTradeLevelName(height: number, id: number): string {
    if (height == 0) return '';
    let name = this.get(this.getTradeLevel(height)[this.getPositionOfAttr('structureLevel', 'levelName')])[id];
    if (name == undefined) throw `No trade level with id=${id} at height=${height}`;
    return name;
  }
  
  static getCompleteWidgetParams(id: number){
    let widgetParams = this.get('widgetParams')[id].slice();  
    let widgetId = widgetParams[this.getPositionOfAttr('structureWidgetparams', 'widget')];
    let widget = this.get('widget')[widgetId];
    widgetParams[this.getPositionOfAttr('structureWidgetparams', 'widget')] = widget;
    let widgetComputeId = widgetParams[this.getPositionOfAttr('structureWidgetparams', 'widgetCompute')];
    let widgetCompute = this.get('widgetCompute')[widgetComputeId];
    widgetParams[this.getPositionOfAttr('structureWidgetparams', 'widgetCompute')] = widgetCompute;
    return widgetParams;
  }
  
  static getGeoDashboardsAt(height: number): number[]{
    if (height >= this.geoLevels.length || height < 0)
    throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.getGeoLevel(height)[this.getPositionOfAttr('structureLevel', 'listDashboards')];
  }
  
  static getTradeDashboardsAt(height: number): number[]{
    if (height >= this.tradeLevels.length || height < 0)
    throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.tradeLevels.length}`;
    return this.getTradeLevel(height)[this.getPositionOfAttr('structureLevel', 'listDashboards')];
  }
  
  static getNameOfRegularObject(field:string, id:number){
    return this.get(field)[id];
  }

  static getPositionOfAttr(structureName:string, argName:string){
    return this.structuresDict[structureName][argName];
  }

  static getIndustryId(industryName:string){
    return this.industriesReverseDict[industryName];
  }
  
  // It works only on regular cases
  static getStructure(field:string){
    return this.get("structure" + field[0].toUpperCase() + field.slice(1).toLowerCase());
  }
  
  static getParam(param:string){
    return this.get('params')[param];
  }

  static getAttribute(field:string, id:number, attribute:string){
    let structureField = this.getStructure(field),
      idAttribute = structureField.indexOf(attribute);
    return this.get(field)[id][idAttribute];
  }

  static get(field: string, justNames=false, changeYear=true):any{
    let fieldName = field;
    // to switch year
    if (changeYear && !this.currentYear && this.fieldsToSwitchWithyear.includes(fieldName)) fieldName = field + '_ly';
    // A enlever quand le back sera à jour
    // switch(fieldName){
    //   case "mainIndustries": return mainIndustries;
    //   case 'enduitIndustry': return enduitIndustry;
    //   case 'segmentDnEnduit': return segmentDnEnduit;
    //   case 'clientProspect': return clientProspect;
    //   case 'suiviAD': return suiviAD;
    //   case 'weeks': return weeks;
    //   case 'histoCurve': return histoCurve;    
    //   case 'ciblage': return ciblage;
    //   case 'pointFeuFilter': return pointFeuFilter;
    //   case 'industriel': return industriel;
    //   case 'segmentDnEnduitTargetVisits': return segmentDnEnduitTargetVisits;
    //   case 'segmentMarketingFilter': return segmentMarketingFilter;
    //   case 'visited': return visitedFilter;
    //   case 'typology': return segmentDnEnduit;
    //   case 'clientProspectTarget': return clientProspectTarget;
    //   case 'segmentDnEnduitTarget': return segmentDnEnduitTarget;
    //   case 'enduitIndustryTarget': return enduitIndustryTarget;
    //   case 'industryTarget': return industryTarget; 
    //   case 'avancementAD': return avancementAD;
    //   case 'visits': return visits;
    //   case 'targetedVisits': return targetedVisits;
    //   default: {
    let data = this.data[fieldName];
    if ( !data ) {
      console.warn(fieldName, 'retrieval failed, trying get with axis for graph.');
      console.warn('setting the value of', fieldName, 'to', data = this.getFilter(fieldName) || {});
    }
    if (!justNames || Object.values(data).length == 0 || typeof(Object.values(data)[0]) == 'string' ) return data; 
    let names: any = {},
      nameIndex = this.getStructure(field).indexOf('name');
    for (let [id, list] of Object.entries<any[]>(data)) names[id] = list[nameIndex];
    return names
      // }
    // }
  }

  static getFilter(filterName: string){
    if (filterName in this.data) return this.get(filterName)
    let labelsIds:number[] = this.getAxisForGraph(filterName)[this.getPositionOfAttr('structureAxisforgraph', 'labels')] as number[],
      labelsForGraph = labelsIds.map((labelId:number) => this.get('labelForGraph')[labelId]),
      dictFilter: {[key:number]:string} = {};
    for (let labelForGraph of labelsForGraph) 
      dictFilter[labelForGraph[this.getPositionOfAttr('structureLabelforgraph', 'orderForCompute')] as number] = labelForGraph[this.getPositionOfAttr('structureLabelforgraph', 'label')] as string;
    return dictFilter;
  }

  static getAxisForGraph(axisName:string): [string, number[]]{
    let allAxisForGraph = Object.values(this.get('axisForGraph'));
    for (let axisForGraph of allAxisForGraph)
      if ((axisForGraph as [string,number[]])[this.getPositionOfAttr('structureAxisforgraph', 'name')] == axisName) 
        return axisForGraph as [string,number[]];
    return ["",[]];
  }

  static getKeyByValue(object:any, value:any) {
    return Object.keys(object).find(key => object[key] == value);
  }                          

  static getTarget(level='national', id:number, dn=false, finition=false){
    let targetType = dn ? 'dn': 'vol';
    let targetTypeId:number = this.get('structureTargetlevel').indexOf(targetType);
    if (level == 'agentFinitions') return this.get('targetLevelAgentFinitions')[id][targetTypeId];
    if (finition && level == 'drv'){
      let finitionAgentsids = this.findFinitionAgentsOfDrv(id, true),
        targetsAgentFinition = this.get('targetLevelAgentFinitions');
      return finitionAgentsids.reduce((acc:number, id:number) => acc + targetsAgentFinition[id][targetTypeId], 0);
    }
    if (finition){
      let targetsAgentFinition = Object.values(this.get('targetLevelAgentFinitions'));
      return targetsAgentFinition.reduce((acc, target:any) => acc + target[targetTypeId], 0);
    }
    if (level == 'agent') return this.get('targetLevelAgentP2CD')[id][targetTypeId];
    if (level == 'drv') return this.get('targetLevelDrv')[id][targetTypeId];
    if (level == 'nationalByAgent'){
      let agentTargets: number[][] = Object.values(this.get('targetLevelAgentP2CD'));
      return agentTargets.reduce((acc, agentTarget) => acc + agentTarget[targetTypeId], 0)
    }
    let drvTargets: number[][] = Object.values(this.get('targetLevelDrv'));
    return drvTargets.reduce((acc, drvTarget) => acc + drvTarget[targetTypeId], 0);
  }

  static computeTargetVisits(node:Node, threshold=false){
    let finitionAgents:any[] = (node.nature == 'root') ? Object.values(DEH.get('agentFinitions')): 
      ((node.nature == 'drv') ? DEH.findFinitionAgentsOfDrv(node.id): [DEH.get('agentFinitions')[node.id]]);
    let sumOfTargets = finitionAgents.reduce((acc, agent) => acc + agent[DEH.getPositionOfAttr(
      'structureAgentfinitions', threshold ?'ratioTargetedVisit': 'TargetedNbVisit')], 0);
    return threshold ? (1 / finitionAgents.length) * sumOfTargets: sumOfTargets;
  }

  static getListTarget(level:string, ids: number[], dn: boolean, finition: boolean){
    return ids.map((id:number) => this.getTarget(level, id, dn, finition));
  }

  static findFinitionAgentsOfDrv(drvId: number, ids=false){
    let finitionAgents: {[key:number]: (number|string)[]} = this.get('agentFinitions'),
      finitionAgentsOfDrv:any[] = [];
    for (let [id, agent] of Object.entries(finitionAgents))
      if (agent[this.getPositionOfAttr('structureAgentfinitions', 'drv')] == drvId){
        if (ids) finitionAgentsOfDrv.push(id);
        else finitionAgentsOfDrv.push(agent);
      }
    return finitionAgentsOfDrv;
  }

  static getLastYearDashboards(tree: Tree, height: number = 0) {
    let name = tree.hasTypeOf(GeoExtractionHelper) ? 'levelGeo' : 'levelTrade';
    let level = this.get(name + '_ly', false, false);
    while ( height-- > 0 )
      level = level[this.getPositionOfAttr('structureLevel', 'subLevel')];
      return level[this.getPositionOfAttr('structureLevel', 'listDashboards')] || [];
  }
};

export type DataTree = [number, [DataTree]] | number;
export abstract class TreeExtractionHelper {
  abstract data: {levels: string; tree: string};
  levels: any[] = [];
  height: number = 0;

  loadData(){
    let structure = DEH.get('structureLevel'),
      level = DEH.get(this.data.levels);    
    this.levels.length = 0;
    while (true){
      this.levels.push(level.slice(0, structure.length-1));
      if (!(level = level[DEH.getPositionOfAttr('structureLevel',  'subLevel')])) break;
    }
    this.height = this.levels.length;
    return DEH.get(this.data.tree);
  }

  getName(height: number, id: number) {
    let name = DEH.get(this.levels[height][DEH.getPositionOfAttr('structureLevel',  'levelName')])[id];
    if (name == undefined) throw `No ${this.data.levels} with id=${id} at height ${height}`;
    if (Array.isArray(name))
      return name[DEH.get('structureAgentfinitions').indexOf('name')];
    return name;
  }

  getLevelLabel(height: number) {
    return this.levels[height][DEH.getPositionOfAttr('structureLevel',  'prettyPrint')];
  }

  getLevelNature(height: number) {
    return this.levels[height][DEH.getPositionOfAttr('structureLevel',  'levelName')];
  } 

  getDashboardsAtHeight(height: number) {
    return this.levels[height][DEH.getPositionOfAttr('structureLevel',  'listDashboards')];
  }
}
export const GeoExtractionHelper = new class extends TreeExtractionHelper {
  data = {tree: 'geoTree', levels: 'levelGeo'};
};

export const TradeExtrationHelper = new class extends TreeExtractionHelper {
  data = {tree: 'tradeTree', levels: 'levelTrade'}
};

export default DEH;