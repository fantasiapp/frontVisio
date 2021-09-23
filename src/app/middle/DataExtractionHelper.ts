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

<<<<<<< Updated upstream
=======
const clientProspectTarget = {
  1: "Client",
  2: "Prospect",
  3: "Non documenté",
  4: "Potentiel ciblé"
}

const segmentDnEnduitTarget = {
  1: "Pur prospect",
  2: "P2CD + Enduit",
  3: "Enduit hors P2CD",
  4: "Cible Pur Prospect",
  5: "Cible P2CD"
}

const enduitIndustrieTarget = {
  1: "Salsi", 
  2: "Pregy", 
  3: "Croissance", 
  4: "Conquête",
  5: "Cible Croissance",
  6: "Cible Conquête"
};

const colTableP2cd = {
  1: "brand",
  2: "clientOrProspect",
  3: "markSeg",
  4: "ensemble",
  5: "name",
  6: "siniatSells",
  7: "totalSells"
}

>>>>>>> Stashed changes
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
    console.log("[DataExtractionHelper] this.data : ", this.data)
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

  // a enlever, normalement on peut utiliser le get pour ça
  static getGeoTree(): {}{
    return this.data['geoTree'];
  }

  // a enlever, normalement on peut utiliser le get pour ça
  static getTradeTree(): {}{
    return this.data['tradeTree'];
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

  // a enlever, normalement on peut utiliser le get pour ça
  static getDashboards(): any{
    return this.data['dashboards'];
  }

  // a enlever, normalement on peut utiliser le get pour ça
  static getLayouts(): any{
    return this.data['layout']
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
<<<<<<< Updated upstream
=======
    if (field == 'clientProspectTarget') return clientProspectTarget;
    if (field == 'segmentDnEnduitTarget') return segmentDnEnduitTarget;
    if (field == 'enduitIndustrieTarget') return enduitIndustrieTarget;
    if (field == 'colTableP2cd') return colTableP2cd;
    if (field == 'industrieTarget'){
      let industries = this.data[field];
      industries.set('0', 'Potentiel');
      return industries
    }    
>>>>>>> Stashed changes
    return this.data[field];
  }

  static getKeyByValue(object:any, value:any) {
    return Object.keys(object).find(key => object[key] === value);
  }
}

export default DataExtractionHelper;