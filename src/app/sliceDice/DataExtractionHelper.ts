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
    let structure = d['structure'];
    this.data = d;
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    
    //trades have less info that geo
    this.tradeLevels = this.data['tradeTreeStructure'];
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
    if ( height == 0 ) return "France";
    let name = this.data[this.getGeoLevel(height)[this.LABEL_INDEX]][id];
    if ( !name ) throw `No level with id=${id}`;
    return name;
  }

  static getTradeLevelLabel(height: number): string {
    return this.tradeLevels[height];
  }

  static getTradeLevelName(height: number, id: number): string {
    if ( height == 0 ) return "Général";
    let name = this.data[this.getTradeLevelLabel(height)][id];
    if ( !name ) throw `No level with id=${id}`;

    return name;
  }

  static getDashboards(): {[key:string]: {'name': string}} {
    return this.data['dashboards'];
  }
  
  static getDashboardsAt(height: number): number[] {
    if ( height >= this.geoLevels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.geoLevels.length}`;
    return this.getGeoLevel(height)[this.DASHBOARD_INDEX];
  }

  static getPDVFields() {
    return this.data['pdv']['fields'];
  }

  static get(field: string) {
    return this.data[field];
  };
}

export default DataExtractionHelper;