const fields = [
  "code",
  "name",
  "drv",
  "agent",
  "dep",
  "bassin",
  "ville",
  "latitude",
  "longitude",
  "segmentCommercial",
  "segmentMarketing",
  "enseigne",
  "ensemble",
  "sousEnsemble",
  "site",
  "available",
  "sale",
  "redistributed",
  "redistributedEnduit",
  "pointFeu",
  "closedAt",
  "sales"
];

const structure = [
  "levelName",
  "prettyPrint",
  "listDashBoards",
  "subLevel"
];

const tradeStructure = [
  "enseigne",
  "ensemble",
  "sousEnsemble"
];

const dashboards = {
  "8":{
      "name":"DN Enduit"
  },
  "10":{
      "name":"DN Enduit Simulation"
  },
  "7":{
      "name":"DN P2CD"
  },
  "9":{
      "name":"DN P2CD Simulation"
  },
  "2":{
      "name":"March\u00e9 Enduit"
  },
  "20":{
      "name":"March\u00e9 Enduit Enseigne"
  },
  "1":{
      "name":"March\u00e9 P2CD"
  },
  "19":{
      "name":"March\u00e9 P2CD Enseigne"
  },
  "4":{
      "name":"PdM Enduit"
  },
  "22":{
      "name":"PdM Enduit Enseigne"
  },
  "6":{
      "name":"PdM Enduit Simulation"
  },
  "3":{
      "name":"PdM P2CD"
  },
  "21":{
      "name":"PdM P2CD Enseigne"
  },
  "5":{
      "name":"PdM P2CD Simulation"
  },
  "12":{
      "name":"Points de Vente Enduit"
  },
  "11":{
      "name":"Points de Vente P2CD"
  },
  "17":{
      "name":"Suivi AD"
  },
  "18":{
      "name":"Suivi des Visites"
  },
  "14":{
      "name":"Synth\u00e8se Enduit"
  },
  "16":{
      "name":"Synth\u00e8se Enduit Simulation"
  },
  "13":{
      "name":"Synth\u00e8se P2CD"
  },
  "15":{
      "name":"Synth\u00e8se P2CD Simulation"
  }
};


//Will have to make this non static one day
class DataExtractionHelper {  
  static data: any;
  static ID_INDEX: number;
  static LABEL_INDEX: number;
  static PRETTY_INDEX: number;
  static DASHBOARD_INDEX: number;
  static SUBLEVEL_INDEX: number;
  
  //Represent levels as a vertical array rather than a recursive structure
  private static geoLevels: any[] = [];
  private static tradeLevels: any[] = [];

  static geoHeight: number;
  static tradeHeight: number;
  
  static setData(d: any) {
    console.log(d);
    this.data = d;
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    
    //trades have less info that geo
    this.geoLevels = [];
    this.tradeLevels = tradeStructure;
    //compute geoLevels
    let geolevel = this.data['levels'];
    while ( true ) {
      this.geoLevels.push(geolevel.slice(0, 4));
      if ( !(geolevel = geolevel[this.SUBLEVEL_INDEX]) ) break;
    }

    //heights
    this.geoHeight = this.geoLevels.length;
    this.tradeHeight = this.tradeLevels.length;
  }

  static getGeoLevel(height: number) {
    if ( height >= this.geoLevels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.geoLevels[height];
  }

  static getGeoTree(): {} {
    return this.data['geoTree'];
  }

  static getTradeTree(): {} {
    return this.data['tradeTree'];
  }

  static getGeoLevelLabel(height: number): string {
    return this.getGeoLevel(height)[this.PRETTY_INDEX];
  }
  
  static getGeoLevelName(height: number, id: number): string {
    if ( height == 0 ) return 'France';
    let name = this.data[this.getGeoLevel(height)[this.LABEL_INDEX]][id];
    if ( !name ) throw `No level with id=${id}`;
    return name;
  }

  static getTradeLevelLabel(height: number): string {
    return this.tradeLevels[height];
  }

  static getTradeLevelName(height: number, id: number): string {
    if ( height == 0 ) return 'Général';
    let name = this.data[this.getTradeLevelLabel(height)][id];
    if ( name === undefined ) throw `No level with id=${id}`;
    return name;
  }

  static getDashboards(): {[key:string]: {'name': string}} {
    return dashboards;
  }
  
  static getDashboardsAt(height: number): number[] {
    if ( height >= this.geoLevels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.getGeoLevel(height)[this.DASHBOARD_INDEX];
  }

  static getPDVFields() {
    return fields;
  }

  static get(field: string) {
    return this.data[field];
  };
}

export default DataExtractionHelper;