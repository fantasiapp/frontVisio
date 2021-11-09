import {PDV} from "./Pdv";
import {Tree} from "./Node"
import {LocalStorageService} from "../services/local-storage.service";
import {UpdateData} from "../services/data.service";

const mainIndustries = {
  1: "Siniat",
  2: "Placo",
  3: "Knauf",
  4: "Challengers"
}

const enduitIndustry = {
  1: "Salsi", 
  2: "Prégy", 
  3: "Croissance", 
  4: "Conquête"
};

const segmentDnEnduit = {
  1: "Non documenté",
  2: "P2CD + Enduit",
  3: "Enduit hors P2CD",
  4: "Pur prospect"
}

const clientProspect = {
  1: "Non documenté",
  2: "Client",
  3: "Prospect"
}

const clientProspectTarget = {
  1: "Potentiel ciblé",
  2: "Non documenté",
  3: "Client",
  4: "Prospect"
}

const segmentDnEnduitTarget = {
  1: "Non documenté",
  2: "P2CD + Enduit",
  3: "Cible P2CD",
  4: "Enduit hors P2CD",
  5: "Cible Pur Prospect",
  6: "Pur prospect"
}

const enduitIndustryTarget = {
  5: "Cible Croissance",
  6: "Cible Conquête"
};

const industryTarget = {
  1: "Potentiel ciblé",
  2: "Siniat",
  3: "Placo",
  4: "Knauf",
  5: "Challengers"
}

const suiviAD = {
  1: "Terminées",
  2: "Non mises à jour",
  3: "Non renseignées"
}

const weeks = {
  1: "avant",
  2: "s-6",
  3: "s-5",
  4: "s-4",
  5: "s-3",
  6: "s-2",
  7: "s-1",
  8: "s-0",
}

const histoCurve = {
  1: "Nombre de PdV complétés",
  2: "Cumul en pourcentage"
}

const pointFeuFilter = {
  1: 'Non point Feu',
  2: 'Point feu'
}

const visitedFilter = {
  1: 'Visité',
  2: 'Non visité'
}

const ciblage = {
  1: 'Non ciblé',
  2: 'Ciblé'
}

const industriel = {
  1: "Siniat",
  2: "Placo",
  3: "Knauf",
  4: "Autres"
}

const segmentMarketingFilter = {
  1: "Purs Spécialistes",
  2: "Multi Spécialistes",
  3: "Généralistes",
  4: "Non documenté"
}

const segmentDnEnduitTargetVisits = {
  1: "Non documenté",
  2: "Cible P2CD + Enduit",
  3: "P2CD + Enduit",
  4: "Cible Enduit hors P2CD",
  5: "Enduit hors P2CD",
  6: "Cible Pur Prospect",
  7: "Pur prospect",
}

//Proxy Class
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


//Will have to make this non static one day
class DEH{  // for DataExtractionHelper
  // plus tard il faudra créer des objects à la volée, par exemple avec Object.defineProperty(...)
  private static data: any;
  static ID_INDEX: number;
  static LABEL_INDEX: number;
  static PRETTY_INDEX: number;
  static DASHBOARD_INDEX: number;
  static SUBLEVEL_INDEX: number;
  static LAYOUT_TEMPLATE_INDEX: number;
  static DASHBOARD_LAYOUT_INDEX: number;
  static DASHBOARD_WIDGET_INDEX: number;
  static DASHBOARD_NAME_INDEX: number;
  static DASHBOARD_COMMENT_INDEX: number;
  static WIDGETPARAMS_WIDGET_INDEX: number;
  static WIDGETPARAMS_WIDGETCOMPUTE_INDEX: number;
  static INDUSTRIE_SALSI_ID: any;
  static INDUSTRIE_PREGY_ID: any;
  static INDUSTRIE_SINIAT_ID: any;
  static INDUSTRIE_KNAUF_ID: any;
  static INDUSTRIE_PLACO_ID: any;
  static AXISFORGRAHP_LABELS_ID: number;
  static LABELFORGRAPH_LABEL_ID: number;
  static LABELFORGRAPH_COLOR_ID: number;
  static TARGET_DATE_ID: number;
  static TARGET_REDISTRIBUTED_ID: number;
  static TARGET_SALE_ID: number;
  static TARGET_VOLUME_ID: number;
  static TARGET_FINITIONS_ID: number;
  static TARGET_LIGHT_ID: number;
  static TARGET_REDISTRIBUTED_FINITIONS_ID: number;
  static TARGET_COMMENT_ID: number;
  static TARGET_BASSIN_ID: number;
  static TARGET_ID: any;
  static SALES_ID: any;
  static SALES_DATE_ID: any;
  static SALES_INDUSTRY_ID: any;
  static SALES_PRODUCT_ID: any;
  static SALES_VOLUME_ID: any;
  static SALE_ID: any;
  static AGENTFINITION_TARGETVISITS_ID: number;
  static AGENTFINITION_DRV_ID: number;
  static AGENTFINITION_RATIO_ID: number;
  static delayBetweenUpdates: number;
  
  //Represent levels as a vertical array rather than a recursive structure
  static geoLevels: any[] = [];
  static tradeLevels: any[] = [];

  static geoHeight: number;
  static tradeHeight: number;
  static currentYear = true;
  private static fieldsToSwitchWithyear: string[] = [];


  static setData(d: any){
    console.log('[DataExtractionHelper] setData:', d);
    this.data = d;
    // à mettre dans le back
    let singleFields = ['dashboards', 'layout', 'widget', 'widgetParams', 'widgetCompute', 'params', 'labelForGraph', 'axisForGraph', 'product', 'industry', 'ville', 'timestamp', 'root', 'industry'];
    for (let field of Object.keys(this.data)) if (!field.startsWith('structure') && !field.startsWith('indexes') && !field.endsWith('_ly') && !singleFields.includes(field)) this.fieldsToSwitchWithyear.push(field);
    console.log("[DataExtractionHelper] this.data updated")
    let structure = this.get('structureLevel');
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashboards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    this.LAYOUT_TEMPLATE_INDEX = this.get('structureLayout').indexOf('template');
    this.DASHBOARD_LAYOUT_INDEX = this.get('structureDashboards').indexOf('layout');
    this.DASHBOARD_WIDGET_INDEX = this.get('structureDashboards').indexOf('widgetParams');
    this.DASHBOARD_NAME_INDEX = this.get('structureDashboards').indexOf('name');
    this.DASHBOARD_COMMENT_INDEX = this.get('structureDashboards').indexOf('comment');
    this.WIDGETPARAMS_WIDGET_INDEX = this.get('structureWidgetparams').indexOf('widget');
    this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX = this.get('structureWidgetparams').indexOf('widgetCompute');
    this.INDUSTRIE_SALSI_ID = this.getKeyByValue(this.get('industry'), 'Salsi');
    this.INDUSTRIE_PREGY_ID = this.getKeyByValue(this.get('industry'), 'Prégy');
    this.INDUSTRIE_SINIAT_ID = this.getKeyByValue(this.get('industry'), 'Siniat');
    this.INDUSTRIE_KNAUF_ID = this.getKeyByValue(this.get('industry'), 'Knauf');
    this.INDUSTRIE_PLACO_ID = this.getKeyByValue(this.get('industry'), 'Placo');
    this.AXISFORGRAHP_LABELS_ID = this.get('structureAxisforgraph').indexOf('labels');
    this.LABELFORGRAPH_LABEL_ID = this.get('structureLabelforgraph').indexOf('label');
    this.LABELFORGRAPH_COLOR_ID = this.get('structureLabelforgraph').indexOf('color');
    this.TARGET_ID = this.getKeyByValue(this.get('structurePdvs'), 'target');
    this.TARGET_DATE_ID = this.get('structureTarget').indexOf('date');
    this.TARGET_REDISTRIBUTED_ID = this.get('structureTarget').indexOf('redistributed');
    this.TARGET_SALE_ID = this.get('structureTarget').indexOf('sale');
    this.TARGET_VOLUME_ID = this.get('structureTarget').indexOf('targetP2CD');
    this.TARGET_FINITIONS_ID = this.get('structureTarget').indexOf('targetFinitions');
    this.TARGET_LIGHT_ID = this.get('structureTarget').indexOf('greenLight');
    this.TARGET_COMMENT_ID = this.get('structureTarget').indexOf('commentTargetP2CD');
    this.TARGET_REDISTRIBUTED_FINITIONS_ID = this.get('structureTarget').indexOf('redistributedFinitions');
    this.TARGET_BASSIN_ID = this.get('structureTarget').indexOf('bassin');
    this.SALES_ID = this.getKeyByValue(this.get('structurePdvs'), 'sales');
    this.SALES_DATE_ID = this.get('structureSales').indexOf('date');
    this.SALES_INDUSTRY_ID = this.get('structureSales').indexOf('industry');
    this.SALES_PRODUCT_ID = this.get('structureSales').indexOf('product');
    this.SALES_VOLUME_ID = this.get('structureSales').indexOf('volume');
    this.SALE_ID = this.getKeyByValue(this.get('structurePdvs'), 'sale');
    this.AGENTFINITION_TARGETVISITS_ID = this.get('structureAgentfinitions').indexOf('TargetedNbVisit');
    this.AGENTFINITION_DRV_ID = this.get('structureAgentfinitions').indexOf('drv');
    this.AGENTFINITION_RATIO_ID = this.get('structureAgentfinitions').indexOf('ratioTargetedVisit');
    this.delayBetweenUpdates = this.getParam('delayBetweenUpdates');
    //trades have less info that geo
    
    this.geoLevels = [];
    this.tradeLevels = [];
    //compute geoLevels
    let geolevel = this.get('levelGeo');
    while (true){
      this.geoLevels.push(geolevel.slice(0, structure.length-1));
      if (!(geolevel = geolevel[this.SUBLEVEL_INDEX])) break;
    }

    let tradeLevel = this.get('levelTrade');
    while (true){
      this.tradeLevels.push(tradeLevel.slice(0, structure.length-1));
      if (!(tradeLevel = tradeLevel[this.SUBLEVEL_INDEX])) break;
    }

    this.geoHeight = this.geoLevels.length;
    this.tradeHeight = this.tradeLevels.length;
  }

  static resetData(){
    this.currentYear = true;
  }

  static updateData(data: UpdateData) {
    // data format : {'targetLevelAgentP2CD': [], 'targetLevelAgentFinitions': [], 'targetLevelDrv': [], 'pdvs': []}
    
    // Check how deletions are managed 
    for(let [newPdvId, newPdv] of Object.entries(data.pdvs)) {
          this.data.pdvs[newPdvId] = newPdv;
    }
  //update this.targetLevelAgentP2CD, this.targetLevelAgentFinitions, this.targetLevelDrv,
    for(let targetType of ['targetLevelAgentP2CD', 'targetLevelAgentFinitions', 'targetLevelDrv']) {
      for(let [newTargetId, newTarget] of Object.entries((data as any)[targetType])) {
            this.get(targetType)[newTargetId] = newTarget;
      }
    }

    //Build trees !!! CUSTOM THIS
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
    return this.getGeoLevel(height)[this.PRETTY_INDEX];
  }

  
  static getGeoLevelName(height: number, id: number): string{
    let name = this.get(this.getGeoLevel(height)[this.LABEL_INDEX])[id];
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
    return this.getTradeLevel(height)[this.PRETTY_INDEX];
  }
  
  static getTradeLevelName(height: number, id: number): string {
    // HARDCODE
    if (height == 0) return '';
    let name = this.get(this.getTradeLevel(height)[this.LABEL_INDEX])[id];
    if (name == undefined) throw `No trade level with id=${id} at height=${height}`;
    return name;
  }
  
  static getCompleteWidgetParams(id: number){
    let widgetParams = this.get('widgetParams')[id].slice();  
    let widgetId = widgetParams[this.WIDGETPARAMS_WIDGET_INDEX];
    let widget = this.get('widget')[widgetId];
    widgetParams[this.WIDGETPARAMS_WIDGET_INDEX] = widget;
    let widgetComputeId = widgetParams[this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX]; //might not always be an index
    let widgetCompute = this.get('widgetCompute')[widgetComputeId];
    widgetParams[this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX] = widgetCompute;
    return widgetParams;
  }
  
  static getGeoDashboardsAt(height: number): number[]{
    if (height >= this.geoLevels.length || height < 0)
    throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.getGeoLevel(height)[this.DASHBOARD_INDEX];
  }
  
  static getTradeDashboardsAt(height: number): number[]{
    if (height >= this.tradeLevels.length || height < 0)
    throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.tradeLevels.length}`;
    return this.getTradeLevel(height)[this.DASHBOARD_INDEX];
  }
  
  static getNameOfRegularObject(field:string, id:number){
    return this.get(field)[id];
  }
  
  // Ca ne marche pas encore pour les exceptions
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
    switch(fieldName){
      case "mainIndustries": return mainIndustries;
      case 'enduitIndustry': return enduitIndustry;
      case 'segmentDnEnduit': return segmentDnEnduit;
      case 'clientProspect': return clientProspect;
      case 'suiviAD': return suiviAD;
      case 'weeks': return weeks;
      case 'histoCurve': return histoCurve;    
      case 'ciblage': return ciblage;
      case 'pointFeuFilter': return pointFeuFilter;
      case 'industriel': return industriel;
      case 'segmentDnEnduitTargetVisits': return segmentDnEnduitTargetVisits;
      case 'segmentMarketingFilter': return segmentMarketingFilter;
      case 'visited': return visitedFilter;
      case 'typology': return segmentDnEnduit;
      case 'clientProspectTarget': return clientProspectTarget;
      case 'segmentDnEnduitTarget': return segmentDnEnduitTarget;
      case 'enduitIndustryTarget': 
        return Object.assign({}, enduitIndustry, enduitIndustryTarget);
      case 'industryTarget': return industryTarget; 
      default: {
        let data = this.data[fieldName];
        if (!justNames || Object.values(data).length == 0 || typeof(Object.values(data)[0]) == 'string' ) return data;
        let names: any = {},
          nameIndex = this.getStructure(field).indexOf('name');
        for (let [id, list] of Object.entries<any[]>(data)) names[id] = list[nameIndex];
        return names
      }
    }
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

  static getListTarget(level:string, ids: number[], dn: boolean, finition: boolean){
    return ids.map((id:number) => this.getTarget(level, id, dn, finition));
  }

  static findFinitionAgentsOfDrv(drvId: number, ids=false){
    let finitionAgents: {[key:number]: (number|string)[]} = this.get('agentFinitions'),
      finitionAgentsOfDrv:any[] = [];
    for (let [id, agent] of Object.entries(finitionAgents))
      if (agent[this.AGENTFINITION_DRV_ID] == drvId){
        if (ids) finitionAgentsOfDrv.push(id);
        else finitionAgentsOfDrv.push(agent);
      }
    return finitionAgentsOfDrv;
  }

  static getOtherYearDashboards(tree: Tree, height: number = 0) {
    let name = tree.hasTypeOf(GeoExtractionHelper) ? 'levelGeo' : 'levelTrade';
    let level = this.currentYear ? this.get(name + '_ly', false, false) : this.get(name, false, false);
    while ( height-- > 0 )
      level = level[this.SUBLEVEL_INDEX];
      return level[this.DASHBOARD_INDEX] || [];
  }
};

export type DataTree = [number, [DataTree]] | number;
export abstract class TreeExtractionHelper {
  abstract data: {levels: string; tree: string};
  levels: any[] = [];
  height: number = 0;

  loadData() {
    let structure = DEH.get('structureLevel'),
      level = DEH.get(this.data.levels);
    
    this.levels.length = 0;
    while (true){
      this.levels.push(level.slice(0, structure.length-1));
      if (!(level = level[DEH.SUBLEVEL_INDEX])) break;
    }

    this.height = this.levels.length;
    return DEH.get(this.data.tree);
  }

  getName(height: number, id: number) {
    let name = DEH.get(this.levels[height][DEH.LABEL_INDEX])[id];
    if (name == undefined) throw `No ${this.data.levels} with id=${id} at height ${height}`;
    if (Array.isArray(name))
      return name[DEH.get('structureAgentfinitions').indexOf('name')];
    return name;
  }

  getLevelLabel(height: number) {
    return this.levels[height][DEH.PRETTY_INDEX];
  }

  getLevelNature(height: number) {
    return this.levels[height][DEH.LABEL_INDEX];
  } 

  getDashboardsAtHeight(height: number) {
    return this.levels[height][DEH.DASHBOARD_INDEX];
  }
}
export const GeoExtractionHelper = new class extends TreeExtractionHelper {
  data = {tree: 'geoTree', levels: 'levelGeo'};
};

export const TradeExtrationHelper = new class extends TreeExtractionHelper {
  data = {tree: 'tradeTree', levels: 'levelTrade'}
};

export default DEH;