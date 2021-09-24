import { NavigationCancel } from "@angular/router";

// mocks
const tradeStructure = [
  "enseigne",
  "ensemble",
  "sousEnsemble"
];

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
  0: 'Potentiel'
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

  
  //Represent levels as a vertical array rather than a recursive structure
  private static geoLevels: any[] = [];
  private static tradeLevels: any[] = [];

  static geoHeight: number;
  static tradeHeight: number;
  
  static setData(d: any){
    this.data = d;
    let structure = this.data['structureLevel'];
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    this.LAYOUT_TEMPLATE_INDEX = this.data['structureLayout'].indexOf('template');
    this.DASHBOARD_LAYOUT_INDEX = this.data['structureDashboard'].indexOf('layout');
    this.DASHBOARD_WIDGET_INDEX = this.data['structureDashboard'].indexOf('widgetParams');
    this.DASHBOARD_NAME_INDEX = this.data['structureDashboard'].indexOf('name');
    this.DASHBOARD_COMMENT_INDEX = this.data['structureDashboard'].indexOf('comment');
    this.WIDGETPARAMS_WIDGET_INDEX = this.data['structureWidgetParam'].indexOf('widget');
    this.WIDGETPARAMS_WIDGETCOMPUTE_INDEX = this.data['structureWidgetParam'].indexOf('widgetCompute');
    this.INDUSTRIE_SALSI_ID = this.getKeyByValue(this.data['industrie'], 'Salsi');
    this.INDUSTRIE_PREGY_ID = this.getKeyByValue(this.data['industrie'], 'Pregy');
    this.INDUSTRIE_SINIAT_ID = this.getKeyByValue(this.data['industrie'], 'Siniat');

    
    //trades have less info that geo
    
    this.geoLevels = [];
    this.tradeLevels = tradeStructure;
    //compute geoLevels
    let geolevel = this.data['levelGeo'];
    while (true){
      this.geoLevels.push(geolevel.slice(0, structure.length-1));
      if (!(geolevel = geolevel[this.SUBLEVEL_INDEX])) break;
    }

    this.geoHeight = this.geoLevels.length;
    this.tradeHeight = this.tradeLevels.length;
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
    // if (height == 0) return 'France';
    let name = this.data[this.getGeoLevel(height)[this.LABEL_INDEX]][id];
    if (name === undefined) throw `No level with id=${id}`;
    return name;
  }

  static getTradeLevelLabel(height: number): string{
    return this.tradeLevels[height];
  }

  static getTradeLevelName(height: number, id: number): string{
    if (height == 0) return 'Général';
    let name = this.data[this.getTradeLevelLabel(height)][id];
    if (name === undefined) throw `No level with id=${id}`;
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
  
  static getDashboardsAt(height: number): number[]{
    if (height >= this.geoLevels.length || height < 0)
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.getGeoLevel(height)[this.DASHBOARD_INDEX];
  }

  // a enlever, normalement on peut utiliser le get pour ça
  static getPDVFields(){
    return this.data['structurePdv'];
  }

  static get(field: string){
    // A enlever quand le back sera à jour
    if (field == 'enduitIndustrie') return enduitIndustrie;
    if (field == 'segmentDnEnduit') return segmentDnEnduit;
    if (field == 'paramsCompute') return paramsCompute;
    if (field == 'clientProspect') return clientProspect;
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

  // à terme il vaudrait mieux restructurer ce que renvoie le back
  static findGoodTarget(level:string, id:number){
    if (level = "Région"){
      let indexIdDrv:number = DataExtractionHelper.get("structureTargetLevelDrv").indexOf('drv');
      let targets:{[key:number]: number[]} = DataExtractionHelper.get("targetLevelDrv");
      for (let target of Object.values(targets))
        if (target[indexIdDrv] == id) return target;
    };
    if (level = "Secteur"){
      let indexIdAgent:number = DataExtractionHelper.get("structureTargetAgentP2CD").indexOf('agent');
      let targets:{[key:number]: number[]} = DataExtractionHelper.get("targetLevelAgentP2CD");
      for (let target of Object.values(targets))
        if (target[indexIdAgent] == id) return target;
    };
    return
  }

  static getTarget(level='national', id:number, targetName:string){
    if (level == 'Secteur'){
      let targetId:number = DataExtractionHelper.get("structureTargetAgentP2CD").indexOf(targetName);
      let target = DataExtractionHelper.findGoodTarget(level, id) as number[];
      return target[targetId];
    }
    let targetId:number = DataExtractionHelper.get("structureTargetLevelDrv").indexOf(targetName);
    if (level == 'Région'){
      let target = DataExtractionHelper.findGoodTarget(level, id) as number[];
      return target[targetId];
    }
    let drvTargets: number[][] = Object.values(DataExtractionHelper.get("targetLevelDrv"));
    let target = 0;
    for (let drvTarget of drvTargets)
      target += drvTarget[targetId];
    return target;
  }

  static getListTarget(ids: number[], targetName:string){
    return ids.map((id:number) => DataExtractionHelper.getTarget('Région', id, targetName));
  }
}

export default DataExtractionHelper;