import DataExtractionHelper from "./DataExtractionHelper";
class Dashboard {
  name: string;
  description: string | any[];
  grid: [number, number];
  template: string;
  areas: {[name:string]: number};
  constructor(readonly id: number, data: any, template: string[][]){ 
    this.name = data[DataExtractionHelper.DASHBOARD_NAME_INDEX];
    this.description = data[DataExtractionHelper.DASHBOARD_COMMENT_INDEX];
    this.grid = [template.length, template[0].length];
    this.template = template.map((charList:string[]) => '"'.concat(charList.join(' '), '"')).join('\n');
    this.areas  = {};
    let widgetsParams: {[name: string]: number} = data[DataExtractionHelper.DASHBOARD_WIDGET_INDEX];
    for (let [charLayout, widgetId] of Object.entries(widgetsParams))
      this.areas[charLayout] = DataExtractionHelper.getCompleteWidgetParams(widgetId);
  }
};

export default Dashboard;