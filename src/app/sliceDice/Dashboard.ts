import DataExtractionHelper from "./DataExtractionHelper";

class Dashboard {
  // Ligne à enlever quand jlw aura modifié la requête
  static char = 'abcdefghijklmnopqrstuvwxyz';

  name: string;
  grid: [number, number];
  template: string;
  areas: {[name:string]: number};

  constructor(readonly id: number, data: any, layoutTemplate: string[][]) { 
    this.name = data[DataExtractionHelper.DASHBOARD_NAME_INDEX];
    // Ligne à enlever quand jlw aura modifié la requête
    let template = layoutTemplate.map((list: string[]) => list.map((num: string) => Dashboard.char[+num]));
    this.grid = [template.length, template[0].length]
    this.template = template.map((charList:string[]) => charList.join(' ')).join('\n')
    this.areas  = {};
    let widgetsIds: number[] = data[DataExtractionHelper.DASHBOARD_WIDGET_INDEX];
    let i = 0;
    for (let char of template.reduce((acc: string[], listChar: string[]) => acc.concat(listChar), [])) {
      if (!(char in this.areas)) this.areas[char] = widgetsIds[i++];
    }
  }
};

export default Dashboard;