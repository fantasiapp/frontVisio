class DataExtractionHelper {  
  static data: any;
  static ID_INDEX: number;
  static LABEL_INDEX: number;
  static PRETTY_INDEX: number;
  static DASHBOARD_INDEX: number;
  static SUBLEVEL_INDEX: number;
  
  //Represent levels as a vertical array rather than a recursive structure
  private static levels: any[] = [];
  
  static setData(d: any) {
    let structure = d['structure'];
    this.data = d;
    this.ID_INDEX = structure.indexOf('id');
    this.LABEL_INDEX = structure.indexOf('levelName');
    this.PRETTY_INDEX = structure.indexOf('prettyPrint');
    this.DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    this.SUBLEVEL_INDEX = structure.indexOf('subLevel');
    
    let level = this.data['levels'];
    while ( true ) {
      this.levels.push(level.slice(0, 4));
      if ( !(level = level[this.SUBLEVEL_INDEX]) ) break;
    }
  }

  static height() {
    return this.levels.length;
  };

  static getLevel(height: number) {
    if ( height >= this.levels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.levels.length}`;
    return this.levels[height];
  }

  static getLevelTree(): {} {
    return this.data['geoTree'];
  }

  static getLevelLabel(height: number): string {
    return this.getLevel(height)[this.PRETTY_INDEX];
  }
  
  static getLevelName(height: number, id: number): string {
    let name = this.data[this.getLevel(height)[this.LABEL_INDEX]][id];
    if ( name === undefined ) throw `No level with id=${id}`;
    return name;
  }

  static getDashboards(): {[key:string]: {'name': string}} {
    return this.data['dashboards'];
  }
  
  static getDashboardsAt(height: number): number[] {
    if ( height >= this.levels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${this.levels.length}`;
    return this.getLevel(height)[this.DASHBOARD_INDEX];
  }
}

export default DataExtractionHelper;