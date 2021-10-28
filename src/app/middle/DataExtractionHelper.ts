import {PDV} from "./Slice&Dice";
import {Node, Tree} from "./Node"
import {LocalStorageService} from "../services/local-storage.service";
import {UpdateData} from "../services/data.service";

const enduitIndustrie = {
  1: "Salsi", 
  2: "Prégy", 
  3: "Croissance", 
  4: "Conquête"
};

const segmentDnEnduit = {
  1: "Pur prospect",
  2: "P2CD + Enduit",
  3: "Enduit hors P2CD",
  4: "Non documenté"
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
  5: "Cible Pur Prospect",
  6: "Cible P2CD"
}

const enduitIndustrieTarget = {
  5: "Cible Croissance",
  6: "Cible Conquête"
};

const industrieTarget = {
  0: "Potentiel ciblé"
}

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
    this.AXISFORGRAHP_LABELS_ID = this.get("structureAxisforgraph").indexOf("labels");
    this.LABELFORGRAPH_LABEL_ID = this.get("structureLabelforgraph").indexOf('label');
    this.LABELFORGRAPH_COLOR_ID = this.get("structureLabelforgraph").indexOf('color');
    this.TARGET_ID = this.getKeyByValue(this.get('structurePdvs'), 'target');
    this.TARGET_DATE_ID = this.get("structureTarget").indexOf("date");
    this.TARGET_REDISTRIBUTED_ID = this.get("structureTarget").indexOf("redistributed");
    this.TARGET_SALE_ID = this.get("structureTarget").indexOf("sale");
    this.TARGET_VOLUME_ID = this.get("structureTarget").indexOf("targetP2CD");
    this.TARGET_FINITIONS_ID = this.get("structureTarget").indexOf("targetFinitions");
    this.TARGET_LIGHT_ID = this.get("structureTarget").indexOf("greenLight");
    this.TARGET_COMMENT_ID = this.get("structureTarget").indexOf("commentTargetP2CD");
    this.TARGET_REDISTRIBUTED_FINITIONS_ID = this.get("structureTarget").indexOf("redistributedFinitions");
    this.TARGET_BASSIN_ID = this.get("structureTarget").indexOf("bassin");
    this.SALES_ID = this.getKeyByValue(this.get('structurePdvs'), 'sales');
    this.SALES_DATE_ID = this.get('structureSales').indexOf('date');
    this.SALES_INDUSTRY_ID = this.get('structureSales').indexOf('industry');
    this.SALES_PRODUCT_ID = this.get('structureSales').indexOf('product');
    this.SALES_VOLUME_ID = this.get('structureSales').indexOf('volume');
    this.SALE_ID = this.getKeyByValue(this.get('structurePdvs'), 'sale');
    this.SALE_INDUSTRY_ID = this.get("structureSales").indexOf("industry");
    this.SALE_PRODUCT_ID = this.get("structureSales").indexOf("product");
    this.SALE_VOLUME_ID = this.get("structureSales").indexOf("volume");
    this.AGENTFINITION_TARGETVISITS_ID = this.get("structureAgentfinitions").indexOf("TargetedNbVisit");
    this.AGENTFINITION_DRV_ID = this.get("structureAgentfinitions").indexOf("drv");
    this.AGENTFINITION_RATIO_ID = this.get("structureAgentfinitions").indexOf("ratioTargetedVisit");
    this.delayBetweenUpdates = this.get("params")['delayBetweenUpdates']
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
    //update this.pdv
    let idCode : any  = this.getKeyByValue(this.getPDVFields(), 'code')
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
    DataExtractionHelper.setData(this.data);
    PDV.load(true);
  }

  static getPDVFields() {
    return this.get('structurePdv');
  }

  static getGeoLevel(height: number){
    if (height >= this.geoLevels.length || height < 0)
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.geoLevels[height];
  }

  static getGeoLevelLabel(height: number): string{
    return this.getGeoLevel(height)[this.PRETTY_INDEX];
  }

  static getParam(param:string){
    return this.get('params')[param];
  }
  
  static getGeoLevelName(height: number, id: number): string{
    let name = this.get(this.getGeoLevel(height)[this.LABEL_INDEX])[id];
    if (name === undefined) throw `No geo level with id=${id} at height ${height}`;
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
    if (name === undefined) throw `No trade level with id=${id} at height=${height}`;
    return name;
  }

  static getCompleteWidgetParams(id: number){
    let widgetParams = this.get('widgetParams')[id].slice();  
    let widgetId = widgetParams[this.WIDGETPARAMS_WIDGET_INDEX];
    let widget = this.get("widget")[widgetId];
    widgetParams[this.WIDGETPARAMS_WIDGET_INDEX] = widget;
    let widgetComputeId = widgetParams[this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX]; //might not always be an index
    let widgetCompute = this.get("widgetCompute")[widgetComputeId];
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

  static get(field: string, justNames=false, changeYear=true):any{
    let fieldName = field;
    //redirections: (à enlever quand on rendra le code plus propre)
    if (field == 'produit') fieldName = 'product';
    if (field == 'industrie') fieldName = 'industry';
    if (field == 'structurePdv') fieldName = 'structurePdvs';
    if (field == 'indexesPdv') fieldName = 'indexesPdvs';
    if (field == 'structureWidgetParam') fieldName = 'structureWidgetparams';
    if (field == 'indexesWidgetParam') fieldName = 'indexesWidgetparams';
    if (field == 'structureDashboard') fieldName = 'structureDashboards';
    if (field == 'indexesDashboard') fieldName = 'indexesDashboards';
    // to switch year
    if (changeYear && !this.currentYear && this.fieldsToSwitchWithyear.includes(fieldName)) fieldName = field + '_ly';
    // A enlever quand le back sera à jour
    switch(fieldName){
      case 'enduitIndustrie': return enduitIndustrie;
      case 'segmentDnEnduit': return segmentDnEnduit;
      case 'clientProspect': return clientProspect;
      case "suiviAD": return suiviAD;
      case "weeks": return weeks;
      case "histo&curve": return histoCurve;    
      case 'ciblage': return ciblage;
      case 'pointFeuFilter': return pointFeuFilter;
      case 'industriel': return industriel;
      case 'segmentDnEnduitTargetVisits': return segmentDnEnduitTargetVisits;
      case 'segmentMarketingFilter': return segmentMarketingFilter;
      case 'visited': return visitedFilter;
      case 'typology': return segmentDnEnduit;
      case 'clientProspectTarget':
        return Object.assign({}, clientProspect, clientProspectTarget);
      case 'segmentDnEnduitTarget': 
        return Object.assign({}, segmentDnEnduit, segmentDnEnduitTarget);
      case 'enduitIndustrieTarget': 
        return Object.assign({}, enduitIndustrie, enduitIndustrieTarget);
      case 'industrieTarget':
        return Object.assign({}, this.get('industry'), industrieTarget); 
      default: {
        let data = this.data[fieldName];
        if (!justNames || Object.values(data).length == 0 || typeof(Object.values(data)[0]) == 'string' ) return data;
        let names: any = {},
          nameIndex = this.get("structure" + field[0].toUpperCase() + field.slice(1).toLowerCase()).indexOf('name');
        for (let [id, list] of Object.entries<any[]>(data)) names[id] = list[nameIndex];
        return names
      }
    }
  }

  static getKeyByValue(object:any, value:any) {
    return Object.keys(object).find(key => object[key] === value);
  }                          

  static getTarget(level='national', id:number, dn=false, finition=false){
    let targetType = dn ? "dn": "vol";
    let targetTypeId:number = this.get("structureTargetlevel").indexOf(targetType);
    if (level == 'Agent Finition') return this.get("targetLevelAgentFinitions")[id][targetTypeId];
    if (finition && level == 'Région'){
      let finitionAgentsids = this.findFinitionAgentsOfDrv(id, true),
        targetsAgentFinition = this.get("targetLevelAgentFinitions");
      return finitionAgentsids.reduce((acc:number, id:number) => acc + targetsAgentFinition[id][targetTypeId], 0);
    }
    if (finition){
      let targetsAgentFinition = Object.values(this.get("targetLevelAgentFinitions"));
      return targetsAgentFinition.reduce((acc, target:any) => acc + target[targetTypeId], 0);
    }
    if (level == 'Secteur') return this.get("targetLevelAgentP2CD")[id][targetTypeId];
    if (level == 'Région') return this.get("targetLevelDrv")[id][targetTypeId];
    if (level == 'nationalByAgent'){
      let agentTargets: number[][] = Object.values(this.get("targetLevelAgentP2CD")); //mettre la version enduit après
      let target = 0;
      for (let agentTarget of agentTargets) target += agentTarget[targetTypeId];
    return target;
    }
    let drvTargets: number[][] = Object.values(this.get("targetLevelDrv"));
    let target = 0;
    for (let drvTarget of drvTargets) target += drvTarget[targetTypeId];
    return target;
  }

  static getListTarget(level:string, ids: number[], dn: boolean, finition: boolean){
    return ids.map((id:number) => this.getTarget(level, id, dn, finition));
  }

  // Il faudrait peut-être mettre tout ce que qui traite de la description dans un autre fichier
  static computeDescription(slice:any, description:string[]){
    let descriptionCopy = description.slice();    
    let relevantNode:Node = this.followSlice(slice);
    if (descriptionCopy.length == 1) return descriptionCopy[0];
    for (let i = 0; i < descriptionCopy.length; i++){
      if (descriptionCopy[i] == '') continue;
      if (descriptionCopy[i][0] == '@') descriptionCopy[i] = this.treatDescIndicator(relevantNode, descriptionCopy[i]) as string;
    }
    return descriptionCopy.reduce((str:string, acc: string) => str + acc, "");
  }

  private static treatDescIndicator(node:any, str:string):string{
    if (!this.currentYear) return "";
    switch (str){
      case "@ciblageP2CD": return this.getCiblage(node);
      case "@ciblageP2CDdn": return this.getCiblage(node, false, true);
      case "@ciblageEnduit": return this.getCiblage(node, true);
      case "@ciblageEnduitComplet": return this.getCompleteCiblageFinitions(node);
      case "@DRV": return this.getObjectifDrv(node);
      case "@DRVdn": return this.getObjectifDrv(node, true);
      case "@objectifP2CD": return this.getObjectif(node);
      case "@objectifP2CDdn": return this.getObjectif(node, false, true);
      case "@objectifEnduit": return this.getObjectif(node, true);
      case "@objectifSiege": return this.getObjectifSiege(node);
      case "@objectifSiegeDn": return this.getObjectifSiege(node, true);
      default: return "";
    }
  }

  private static getCompleteCiblageFinitions(node:any){
    if (!['France', 'Région', 'Agent Finition'].includes(node.label)) return "";
    let ciblageDn = PDV.computeCiblage(node, true, true),
      ciblageFinitions = PDV.computeCiblage(node, true),
      objective = this.getTarget(node.label, node.id, false, true);
    let percent = (objective == 0) ? 0: 0.1 * ciblageFinitions/objective;
    return 'Ciblage: '.concat(ciblageDn.toString(), ' PdV, pour un total de ', Math.round(ciblageFinitions/1000).toString(), ' T (soit ', Math.round(percent).toString(), " % de l'objectif).");
  }

  private static getCiblage(node:any, enduit=false, dn=false){
    let ciblage:number = +PDV.computeCiblage(node, enduit, dn);
    if (enduit) return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' T.');
    else if (dn) return 'Ciblage: '.concat(ciblage.toString(), ' PdV.');
    else return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' km².'); // les ciblages c'est les seuls à être en m² et pas en km²
  }

  private static getObjectif(node:any, finition=false, dn=false){    
    if ((finition && !['France', 'Région', 'Agent Finition'].includes(node.label)) || (!finition && node.label !== 'Secteur')) return "";
    let objective = this.getTarget(node.label, node.id, dn, finition);
    if (finition) return 'Objectif: '.concat(Math.round(objective).toString(), ' T, ');
    return (dn) ? 'Objectif: '.concat(objective.toString(), ' PdV, '): 'Objectif: '.concat((Math.round(objective)).toString(), ' km², ');
  }

  private static getObjectifDrv(node:any, dn=false){
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetDrv:number;
    if (node.label == 'France') targetDrv = this.getTarget('nationalByAgent', 0, dn);
    if (node.label == 'Région') targetDrv = node.children.map((agentNode:Node) => this.getTarget('Secteur', agentNode.id, dn)).reduce((acc:number, value:number) => acc + value, 0);
    return (dn) ? 'DRV: '.concat(targetDrv!.toString(), ' PdV, '): 'DRV: '.concat((Math.round(targetDrv!)).toString(), ' km², ');
  }

  private static getObjectifSiege(node:any, dn=false):string{
    if (!(node.label == 'France' || node.label == 'Région')) return "";
    let targetSiege =  this.getTarget(node.label, node.id, dn);
    return (dn) ? 'Objectif Siège: '.concat(targetSiege.toString(), ' PdV, '): 'Objectif Siège: '.concat((Math.round(targetSiege)).toString(), ' km², ');
  }

  static computeDescriptionWidget(slice:any): [number, number, number][]{
    let relevantNode:Node = this.followSlice(slice) as Node,
      ciblage = PDV.computeCiblage(relevantNode);
    let objectiveWidget: [number, number, number] = [
      (relevantNode.children as Node[]).map(subLevelNode => this.getTarget(subLevelNode.label, subLevelNode.id)).reduce((acc, value) => acc + value, 0),
      (relevantNode.children as Node[]).map(subLevelNode => this.getTarget(subLevelNode.label, subLevelNode.id, true)).reduce((acc, value) => acc + value, 0),
      0],
      ciblageWidget: [number, number, number] = [0, 0, 0];
    objectiveWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / objectiveWidget[0]; // on divise par 10 car on fait *100 pour mettre en % et /1000 pour tout mettre en km2
    if (relevantNode.label == 'France'){
      let agentNodes = (relevantNode.children as Node[]).map(drvNode => drvNode.children as Node[]).reduce((acc: Node[], list: Node[]) => acc.concat(list), []);
      ciblageWidget = [
        agentNodes.map(agentNode => this.getTarget("Secteur", agentNode.id)).reduce((acc, value) => acc + value, 0),
        agentNodes.map(agentNode => this.getTarget("Secteur", agentNode.id, true)).reduce((acc, value) => acc + value, 0),
        0]
        ciblageWidget[2] = (objectiveWidget[0] == 0) ? 100 : 0.1 * ciblage / ciblageWidget[0]; 
    } else ciblageWidget = [
        ciblage / 1000,
        PDV.computeCiblage(relevantNode, false, true),
        100];
    return [objectiveWidget, ciblageWidget];
  }

  static findFinitionAgentsOfDrv(drvId: number, ids=false){
    let finitionAgents: {[key:number]: (number|string)[]} = this.get("agentFinitions"),
      finitionAgentsOfDrv:any[] = [];
    for (let [id, agent] of Object.entries(finitionAgents))
      if (agent[this.AGENTFINITION_DRV_ID] == drvId){
        if (ids) finitionAgentsOfDrv.push(id);
        else finitionAgentsOfDrv.push(agent);
      }
    return finitionAgentsOfDrv;
  }

  static followSlice(slice: any, tree: Tree = PDV.geoTree): Node {
    let keys = Object.keys(slice).sort((u, v) => PDV.heightOf(tree, u) - PDV.heightOf(tree, v));
    let values = keys.map(key => slice[key]),
      node = tree.root;
    for ( let id of values )
      node = node.goChild(id);
    return node;
  }

  static getOtherYearDashboards(tree: Tree, height: number = 0) {
    let name = tree.type == NavigationExtractionHelper ? 'levelGeo' : 'levelTrade';
    let level = this.currentYear ? this.get(name + '_ly', false, false) : this.get(name, false, false);
    while ( height-- )
      level = level[this.SUBLEVEL_INDEX];
    return level[this.DASHBOARD_INDEX];
  }
};

export type DataTree = [number, [DataTree]] | number;

export interface TreeExtractionHelper {
  levels: any[];
  data: {levels: string; tree: string;};
  height: number;
  loadData: () => void;
  getName: (height: number, id: number) => string;
  getLevelLabel: (height: number) => string;
  getDashboardsAt: (height: number) => number[];
};

export const NavigationExtractionHelper: TreeExtractionHelper = {
  levels: [],
  data: {tree: 'geoTree', levels: 'levelGeo'},
  height: 0,
  loadData() {
    let structure = DataExtractionHelper.get('structureLevel'),
      level = DataExtractionHelper.get(this.data.levels);
    
    this.levels.length = 0;
    while (true){
      this.levels.push(level.slice(0, structure.length-1));
      if (!(level = level[DataExtractionHelper.SUBLEVEL_INDEX])) break;
    }

    this.height = this.levels.length;
    return DataExtractionHelper.get(this.data.tree);
  },
  getName(height: number, id: number) {
    let name = DataExtractionHelper.get(this.levels[height][DataExtractionHelper.LABEL_INDEX])[id];
    if (name === undefined) throw `No geo level with id=${id} at height ${height}`;
    if (Array.isArray(name))
      return name[DataExtractionHelper.get('structureAgentfinitions').indexOf('name')];
    return name;
  },
  getLevelLabel(height: number) {
    return this.levels[height][DataExtractionHelper.PRETTY_INDEX];
  },
  getDashboardsAt(height: number){
    return this.levels[height][DataExtractionHelper.DASHBOARD_INDEX];
  }
};

export const TradeExtrationHelper: TreeExtractionHelper = {
  levels: [],
  data: {tree: 'tradeTree', levels: 'levelTrade'},
  height: 0,
  loadData() {
    return NavigationExtractionHelper.loadData.call(this);
  },
  getName(height: number, id: number) {
    if (height == 0) return '';
    let name = DataExtractionHelper.get(this.levels[height][DataExtractionHelper.LABEL_INDEX])[id];
    if (name === undefined) {
      throw `No trade level with id=${id} at height=${height}`;
    }
    return name;
  },
  getLevelLabel(height: number) {
    return this.levels[height][DataExtractionHelper.PRETTY_INDEX];

  },
  getDashboardsAt(height: number){
    return this.levels[height][DataExtractionHelper.DASHBOARD_INDEX];
  }
};

export default DataExtractionHelper;