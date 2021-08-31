//GENERAL NOTES
//`geoTreeStructure` is expected to match the recursive level structure
//if it isn't, I'll have a harder time generating the Level object
//If the server can send it this way all the time, then this field is useless

namespace Pipes {  
  export let data ;
  export let ID_INDEX;
  export let LABEL_INDEX;
  export let PRETTY_INDEX;
  export let DASHBOARD_INDEX;
  export let SUBLEVEL_INDEX;
  
  //Represent levels as a vertical array rather than a recursive structure -- report to JLW
  let levels = [];

  //Used for adding `Département` before departement number
  let departementIdx;
  
  //Sets the data that will be transformed to Level & Dashboard
  export function setData(d: any) {
    let structure = d['structure'];
    data = d;
    ID_INDEX = structure.indexOf('id');
    LABEL_INDEX = structure.indexOf('levelName');
    PRETTY_INDEX = structure.indexOf('prettyPrint');
    DASHBOARD_INDEX = structure.indexOf('listDashBoards');
    SUBLEVEL_INDEX = structure.indexOf('subLevel');
    
    let level = data['levels'];
    while ( true ) {
      levels.push(level.slice(0, 4));
      if ( !(level = nextLevel(level)) ) break;
    }

    departementIdx = levels.findIndex(x => x[LABEL_INDEX] == 'dep');
  }

  function nextLevel(level: any) {
    if ( level.length > SUBLEVEL_INDEX )
      return level[SUBLEVEL_INDEX];
    
    return null;
  }

  export function height() {
    return levels.length;
  };

  export function getLevel(height: number) {
    if ( height >= levels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${levels.length}`;
    return levels[height];
  }

  export function getLevelTree(): {} {
    return data['geoTree'];
  }

  //for label on the json
  function $getLevelLabel(height: number): string {
    return getLevel(height)[LABEL_INDEX];
  }

  //for prettified label, which is actually used
  export function getLevelLabel(height: number): string {
    return getLevel(height)[PRETTY_INDEX];
  }
  
  export function getLevelName(height: number, id: number): string {
    if ( height == 0 ) return "National";
    let name = data[$getLevelLabel(height)][id];
    if ( !name ) throw `No level with id=${id}`;
    
    if ( height == departementIdx )
      name = 'Département ' + name;
    return name;
  }

  export function getDashboards(): {[key:string]: {'name': string}} {
    return data['dashboards'];
  }
  
  export function getDashboardsAt(height: number): number[] {
    if ( height >= levels.length || height < 0 )
      throw `Incorrect height=${height}. Constraint: 0 <= height <= ${levels.length}`;
    return getLevel(height)[DASHBOARD_INDEX];
  }
}

export default Pipes;