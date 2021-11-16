import DEH from "./DataExtractionHelper";
class Dashboard {
  name: string;
  description: string | any[];
  grid: [number, number];
  template: string;
  areas: {[name:string]: number};
  constructor(readonly id: number, data: any, template: string[][]){ 
    this.name = data[DEH.getPositionOfAttr('structureDashboards', 'name')];
    this.description = data[DEH.getPositionOfAttr('structureDashboards', 'comment')];
    this.grid = [template.length, template[0].length];
    this.template = template.map((charList:string[]) => '"'.concat(charList.join(' '), '"')).join('\n');
    this.areas  = {};
    let widgetsParams: {[name: string]: number} = data[DEH.getPositionOfAttr('structureDashboards', 'widgetParams')];
    for (let [charLayout, widgetId] of Object.entries(widgetsParams))
      this.areas[charLayout] = DEH.getCompleteWidgetParams(widgetId);
  }
};

export default Dashboard;