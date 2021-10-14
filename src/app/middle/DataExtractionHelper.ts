import { PDV, SliceDice } from "./Slice&Dice";
import {Node, Tree} from "./Node"
import { LocalStorageService } from "../services/local-storage.service";
import { UpdateData } from "../services/data.service";

const paramsCompute = {
  growthConquestLimit: 0.1,
  theoricalRatioEnduit: 0.360,
  clientProspectLimit: 0.1
};

const enduitIndustrie = {
  1: "Salsi", 
  2: "Pregy", 
  3: "Croissance", 
  4: "Conquête"
};

const segmentDnEnduit = {
  1: "Pur prospect",
  2: "P2CD + Enduit",
  3: "Enduit hors P2CD"
}

const clientProspect = {
  1: "Client",
  2: "Prospect",
  3: "Non documenté"
}

const clientProspectTarget = {
  4: "Potentiel ciblé"
}

const segmentDnEnduitTarget = {
  4: "Cible Pur Prospect",
  5: "Cible P2CD"
}

const enduitIndustrieTarget = {
  5: "Cible Croissance",
  6: "Cible Conquête"
};

const industrieTarget = {
  0: "Potentiel ciblé"
}
const colTableP2cd = {
  1: "brand",
  2: "clientOrProspect",
  3: "markSeg",
  4: "ensemble",
  5: "name",
  6: "siniatSells",
  7: "totalSells"
};

const suiviAD = {
  1: "Terminées",
  2: "Non renseignées",
  3: "Non mises à jour"
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
  1: "Curve",
  2: "Histo"
}

const pointFeuFilter = {
  1: 'Non point Feu',
  2: 'Point feu'
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
  "1": "Purs Spécialistes",
  "2": "Multi Spécialistes",
  "3": "Généralistes",
  "4": "Non documenté"
}

const segmentDnEnduitTargetVisits = {
  1: "P2CD + Enduit",
  2: "Cible P2CD + Enduit",
  3: "Enduit hors P2CD",
  4: "Cible Enduit hors P2CD",
  5: "Pur prospect",
  6: "Cible Pur Prospect"
}


//Will have to make this non static one day
class DataExtractionHelper{  
  static data: any;
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
  static TARGET_FINITION_ID: number;
  static TARGET_LIGHT_ID: number;
  static TARGET_COMMENT_ID: number;
  static SALE_INDUSTRY_ID: number;
  static SALE_PRODUCT_ID: number;
  static SALE_VOLUME_ID: number;  
  static TARGET_ID: any;
  static SALES_ID: any;
  static SALES_DATE_ID: any;
  static SALES_INDUSTRY_ID: any;
  static SALES_PRODUCT_ID: any;
  static SALES_VOLUME_ID: any;
  static SALE_ID: any;


  
  //Represent levels as a vertical array rather than a recursive structure
  private static geoLevels: any[] = [];
  private static tradeLevels: any[] = [];

  static geoHeight: number;
  static tradeHeight: number;


  static setData(d: any){
    this.data = d;
    console.log("[DataExtractionHelper] this.data updated")
    let structure = this.data['structureLevel'];
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    this.LAYOUT_TEMPLATE_INDEX = this.data['structureLayout'].indexOf('template');
    this.DASHBOARD_LAYOUT_INDEX = this.data['structureDashboards'].indexOf('layout');
    this.DASHBOARD_WIDGET_INDEX = this.data['structureDashboards'].indexOf('widgetParams');
    this.DASHBOARD_NAME_INDEX = this.data['structureDashboards'].indexOf('name');
    this.DASHBOARD_COMMENT_INDEX = this.data['structureDashboards'].indexOf('comment');
    this.WIDGETPARAMS_WIDGET_INDEX = this.data['structureWidgetparams'].indexOf('widget');
    this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX = this.data['structureWidgetparams'].indexOf('widgetCompute');
    this.INDUSTRIE_SALSI_ID = this.getKeyByValue(this.data['industrie'], 'Salsi');
    this.INDUSTRIE_PREGY_ID = this.getKeyByValue(this.data['industrie'], 'Pregy');
    this.INDUSTRIE_SINIAT_ID = this.getKeyByValue(this.data['industrie'], 'Siniat');
    this.INDUSTRIE_KNAUF_ID = this.getKeyByValue(this.data['industrie'], 'Knauf');
    this.INDUSTRIE_PLACO_ID = this.getKeyByValue(this.data['industrie'], 'Placo');
    this.AXISFORGRAHP_LABELS_ID = this.data["structureAxisforgraph"].indexOf("labels");
    this.LABELFORGRAPH_LABEL_ID = this.data["structureLabelforgraph"].indexOf('label');
    this.LABELFORGRAPH_COLOR_ID = this.data["structureLabelforgraph"].indexOf('color');
    this.TARGET_ID = this.getKeyByValue(this.data['structurePdvs'], 'target');
    this.TARGET_DATE_ID = this.data["structureTarget"].indexOf("date");
    this.TARGET_REDISTRIBUTED_ID = this.data["structureTarget"].indexOf("redistributed");
    this.TARGET_SALE_ID = this.data["structureTarget"].indexOf("sale");
    this.TARGET_VOLUME_ID = this.data["structureTarget"].indexOf("targetP2CD");
    this.TARGET_FINITION_ID = this.data["structureTarget"].indexOf("targetFinition");
    this.TARGET_LIGHT_ID = this.data["structureTarget"].indexOf("greenLight");
    this.TARGET_COMMENT_ID = this.data["structureTarget"].indexOf("commentTargetP2CD");
    this.SALES_ID = this.getKeyByValue(this.data['structurePdvs'], 'sales');
    this.SALES_DATE_ID = this.data['structureSales'].indexOf('date');
    this.SALES_INDUSTRY_ID = this.data['structureSales'].indexOf('industry');
    this.SALES_PRODUCT_ID = this.data['structureSales'].indexOf('product');
    this.SALES_VOLUME_ID = this.data['structureSales'].indexOf('volume');

    this.SALE_ID = this.getKeyByValue(this.data['structurePdvs'], 'sale');
    this.SALE_INDUSTRY_ID = this.data["structureSales"].indexOf("industry");
    this.SALE_PRODUCT_ID = this.data["structureSales"].indexOf("product");
    this.SALE_VOLUME_ID = this.data["structureSales"].indexOf("volume");
    
    //trades have less info that geo
    
    this.geoLevels = [];
    this.tradeLevels = [];
    //compute geoLevels
    let geolevel = this.data['levelGeo'];
    while (true){
      this.geoLevels.push(geolevel.slice(0, structure.length-1));
      if (!(geolevel = geolevel[this.SUBLEVEL_INDEX])) break;
    }

    let tradeLevel = this.data['levelTrade'];
    while (true){
      this.tradeLevels.push(tradeLevel.slice(0, structure.length-1));
      if (!(tradeLevel = tradeLevel[this.SUBLEVEL_INDEX])) break;
    }

    this.geoHeight = this.geoLevels.length;
    this.tradeHeight = this.tradeLevels.length;

    //initialize other helpers
    NavigationExtractionHelper.data = this.get('geoTree');
    NavigationExtractionHelper.height = this.geoHeight;
    TradeExtrationHelper.data = this.get('tradeTree');
    TradeExtrationHelper.height = this.tradeHeight;
  }

  static updateData(data: UpdateData) {
    // data format : {'targetLevelAgentP2CD': [], 'targetLevelAgentFinition': [], 'targetLevelDrv': [], 'pdvs': []}

    // Check how deletions are managed 
    //update this.pdv
    let idCode : any  = DataExtractionHelper.getKeyByValue(DataExtractionHelper.getPDVFields(), 'code')
    for(let [newPdvId, newPdv] of Object.entries(data.pdvs)) {
          this.data.pdvs[newPdvId] = newPdv;
    }
  //update this.targetLevelAgentP2CD, this.targetLevelAgentFinition, this.targetLevelDrv,
    for(let targetType of ['targetLevelAgentP2CD', 'targetLevelAgentFinition', 'targetLevelDrv']) {
      for(let [newTargetId, newTarget] of Object.entries((data as any)[targetType])) {
            this.data[targetType][newTargetId] = newTarget;
      }
    }      
    //Build trees !!! CUSTOM THIS

    let localStorageService: LocalStorageService = new LocalStorageService();
    localStorageService.set('data', JSON.stringify(this.data))
    DataExtractionHelper.setData(this.data);
    PDV.load(true);
  }

  static getPDVFields() {
    return DataExtractionHelper.get('structurePdv');
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
    let name = this.data[this.getGeoLevel(height)[this.LABEL_INDEX]][id];
    if (name === undefined) throw `No geo level with id=${id} at height ${height}`;
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
    if ( height == 0 ) return '';
    let name = this.data[this.getTradeLevel(height)[this.LABEL_INDEX]][id];
    if (name === undefined) throw `No trade level with id=${id} at height=${height}`;
    return name;
  }

  static getCompleteWidgetParams(id: number){
    let widgetParams = this.data['widgetParams'][id].slice();  
    let widgetId = widgetParams[this.WIDGETPARAMS_WIDGET_INDEX];
    let widget = this.data["widget"][widgetId];
    widgetParams[this.WIDGETPARAMS_WIDGET_INDEX] = widget;
    let widgetComputeId = widgetParams[this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX]; //might not always be an index
    let widgetCompute = this.data["widgetCompute"][widgetComputeId];
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
    return DataExtractionHelper.get(field)[id];
  }

  static get(field: string){
    //redirections:
    if (field == 'structurePdv') field = 'structurePdvs';
    if (field == 'indexesPdv') field = 'indexesPdvs';
    if (field == 'structureWidgetParam') field = 'structureWidgetparams';
    if (field == 'indexesWidgetParam') field = 'indexesWidgetparams';
    if (field == 'structureDashboard') field = 'structureDashboards';
    if (field == 'indexesDashboard') field = 'indexesDashboards';
    // A enlever quand le back sera à jour
    if (field == 'enduitIndustrie') return enduitIndustrie;
    if (field == 'segmentDnEnduit') return segmentDnEnduit;
    if (field == 'paramsCompute') return paramsCompute;
    if (field == 'clientProspect') return clientProspect;
    if (field == "suiviAD") return suiviAD;
    if (field == "weeks") return weeks;
    if (field == "histo&curve") return histoCurve;    
    if (field == 'ciblage') return ciblage;
    if (field == 'pointFeuFilter') return pointFeuFilter;
    if (field == 'industriel') return industriel;
    if (field == 'segmentDnEnduitTargetVisits') return segmentDnEnduitTargetVisits;
    if (field == 'segmentMarketingFilter') return segmentMarketingFilter;
    if (field == 'clientProspectTarget')
      return Object.assign({}, clientProspect, clientProspectTarget);
    if (field == 'segmentDnEnduitTarget') 
      return Object.assign({}, segmentDnEnduit, segmentDnEnduitTarget);
    if (field == 'enduitIndustrieTarget') 
      return Object.assign({}, enduitIndustrie, enduitIndustrieTarget);
    if (field == 'industrieTarget')
      return Object.assign({}, this.data['industrie'], industrieTarget); 
    return this.data[field];
  }

  static getKeyByValue(object:any, value:any) {
    return Object.keys(object).find(key => object[key] === value);
  }                          

  static getTarget(level='national', id:number, targetType:string){
    if (level == 'Secteur'){
      if (targetType == 'volFinition'){
        let targetTypeId:number = DataExtractionHelper.get("structureTargetLevelAgentFinition").indexOf(targetType);
        return DataExtractionHelper.get("targetLevelAgentFinition")[id][targetTypeId];
      }
      let targetTypeId:number = DataExtractionHelper.get("structureTargetLevelAgentP2CD").indexOf(targetType);
      return DataExtractionHelper.get("targetLevelAgentP2CD")[id][targetTypeId];
    }
    let targetTypeId:number = DataExtractionHelper.get("structureTargetLevelDrv").indexOf(targetType);
    if (level == 'Région') return DataExtractionHelper.get("targetLevelDrv")[id][targetTypeId];
    if (level == 'nationalByAgent'){
      let agentTargets: number[][] = Object.values(DataExtractionHelper.get("targetLevelAgentP2CD")); //mettre la version enduit après
      let target = 0;
      for (let agentTarget of agentTargets)
      target += agentTarget[targetTypeId];
    return target;
    }
    let drvTargets: number[][] = Object.values(DataExtractionHelper.get("targetLevelDrv"));
    let target = 0;
    for (let drvTarget of drvTargets)
      target += drvTarget[targetTypeId];
    return target;
  }

  static getListTarget(level:string, ids: number[], targetName:string){
    return ids.map((id:number) => DataExtractionHelper.getTarget(level, id, targetName));
  }

  // Il faudrait peut-être mettre tout ce que qui traite de la description dans un autre fichier
  static computeDescription(slice:any, description:string[]){
    let descriptionCopy = description.slice();    
    let relevantNode:Node = DataExtractionHelper.followSlice(slice);
    if (descriptionCopy.length == 1) return descriptionCopy[0];
    for (let i = 0; i < descriptionCopy.length; i++){
      if (descriptionCopy[i] == '') continue;
      if (descriptionCopy[i][0] == '@') descriptionCopy[i] = DataExtractionHelper.treatDescIndicator(relevantNode, descriptionCopy[i]) as string;
    }
    return descriptionCopy.reduce((str:string, acc: string) => str + acc, "");
  }

  private static treatDescIndicator(node:any, str:string):string{
    if (str == "@ciblageP2CD") return DataExtractionHelper.getCiblage(node);
    if (str == "@ciblageP2CDdn") return DataExtractionHelper.getCiblage(node, false, true);
    if (str == "@ciblageEnduit") return DataExtractionHelper.getCiblage(node, true);
    if (str == '@DRV') return DataExtractionHelper.getObjectifDrv(node);
    if (str == '@DRVdn') return DataExtractionHelper.getObjectifDrv(node, true);
    if (str == "@objectifP2CD") return DataExtractionHelper.getObjectif(node);
    if (str == "@objectifP2CDdn") return DataExtractionHelper.getObjectif(node, false, true);
    if (str == "@objectifEnduit") return DataExtractionHelper.getObjectif(node, true);
    if (str == "@objectifSiege") return DataExtractionHelper.getObjectifSiege(node);
    if (str == "@objectifSiegeDn") return DataExtractionHelper.getObjectifSiege(node, true);
    return "";
  }

  private static getCiblage(node:any, enduit=false, dn=false){
    let ciblage:number = +PDV.computeCiblage(node, enduit, dn);
    if (enduit) return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' T.');
    else if (dn) return 'Ciblage: '.concat(ciblage.toString(), ' PdVs.');
    else return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' km².'); // les ciblages c'est les seuls à être en m² et pas en km²
  }

  private static getObjectif(node:any, enduit=false, dn=false){
    if (enduit) return 'Objectif: '.concat(Math.round(DataExtractionHelper.getTarget(node.label, node.id, 'volFinition')/1000).toString(), ' T, ');
    if (node.label !== 'Secteur') return "";
    let targetName = dn ? 'dnP2CD': 'volP2CD';
    let objective = DataExtractionHelper.getTarget(node.label, node.id, targetName);
    return (dn) ? 'Objectif: '.concat(objective.toString(), ' PdVs, '): 'Objectif: '.concat((Math.round(objective)).toString(), ' km², ');
  }

  private static getObjectifDrv(node:any, dn=false){
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetName = dn ? "dnP2CD": 'volP2CD', targetDrv:number;
    if (node.label == 'France') targetDrv = DataExtractionHelper.getTarget('nationalByAgent', 0, targetName);
    if (node.label == 'Région') targetDrv = node.children.map((agentNode:Node) => DataExtractionHelper.getTarget('Secteur', agentNode.id, targetName)).reduce((acc:number, value:number) => acc + value, 0);
    return (dn) ? 'DRV: '.concat(targetDrv!.toString(), ' PdVs, '): 'DRV: '.concat((Math.round(targetDrv!)).toString(), ' km², ');
  }

  private static getObjectifSiege(node:any, dn=false):string{
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetName = dn ? "dnP2CD": 'volP2CD';
    let targetSiege =  DataExtractionHelper.getTarget(node.label, node.id, targetName);
    return (dn) ? 'Objectif Siège: '.concat(targetSiege.toString(), ' PdVs, '): 'Objectif Siège: '.concat((Math.round(targetSiege)).toString(), ' km², ');
  }

  static computeDescriptionWidget(slice:any): [number, number, number][]{
    let relevantNode:Node = DataExtractionHelper.followSlice(slice) as Node,
      ciblage = PDV.computeCiblage(relevantNode);
    let objectiveWidget: [number, number, number] = [
      (relevantNode.children as Node[]).map(subLevelNode => DataExtractionHelper.getTarget(subLevelNode.label, subLevelNode.id, "volP2CD")).reduce((acc, value) => acc + value, 0),
      (relevantNode.children as Node[]).map(subLevelNode => DataExtractionHelper.getTarget(subLevelNode.label, subLevelNode.id, "dnP2CD")).reduce((acc, value) => acc + value, 0),
      0],
      ciblageWidget: [number, number, number] = [0, 0, 0];
    objectiveWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / objectiveWidget[0]; // on divise par 10 car on fait *100 pour mettre en % et /1000 pour tout mettre en km2
    if (relevantNode.label == 'France'){
      let agentNodes = (relevantNode.children as Node[]).map(drvNode => drvNode.children as Node[]).reduce((acc: Node[], list: Node[]) => acc.concat(list), []);
      ciblageWidget = [
        agentNodes.map(agentNode => DataExtractionHelper.getTarget("Secteur", agentNode.id, "volP2CD")).reduce((acc, value) => acc + value, 0),
        agentNodes.map(agentNode => DataExtractionHelper.getTarget("Secteur", agentNode.id, "dnP2CD")).reduce((acc, value) => acc + value, 0),
        0]
        ciblageWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / ciblageWidget[0]; 
    } else ciblageWidget = [
        ciblage / 1000,
        PDV.computeCiblage(relevantNode, false, true),
        100];
    return [objectiveWidget, ciblageWidget];
  }

  static followSlice(slice: any, tree: Tree = PDV.geoTree): Node {
    let keys = Object.keys(slice).sort((u, v) => PDV.heightOf(tree, u) - PDV.heightOf(tree, v));
    let values = keys.map(key => slice[key]),
      node = tree.root;
    for ( let id of values )
      node = node.goChild(id);
    return node;
  }
};

export type DataTree = [number, [DataTree]] | number;

export interface TreeExtractionHelper {
  data: DataTree;
  height: number;
  getName: (height: number, id: number) => string;
  getLevelLabel: (height: number) => string;
  getDashboardsAt: (height: number) => number[];
};

export const NavigationExtractionHelper: TreeExtractionHelper = {
  data: 0,
  height: DataExtractionHelper.geoHeight,
  getName(height: number, id: number) {
    return DataExtractionHelper.getGeoLevelName(height, id);
  },
  getLevelLabel(height: number) {
    return DataExtractionHelper.getGeoLevelLabel(height)
  },
  getDashboardsAt(height: number){
    return DataExtractionHelper.getGeoDashboardsAt(height)
  }
};

export const TradeExtrationHelper: TreeExtractionHelper = {
  data: 0,
  height: DataExtractionHelper.tradeHeight,
  getName(height: number, id: number) {
    return DataExtractionHelper.getTradeLevelName(height, id);
  },
  getLevelLabel(height: number) {
    return DataExtractionHelper.getTradeLevelLabel(height);
  },
  getDashboardsAt(height: number){
    return DataExtractionHelper.getTradeDashboardsAt(height)
  }
};

export default DataExtractionHelper;

