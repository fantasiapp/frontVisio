import DataExtractionHelper from "./DataExtractionHelper";
class Dashboard {
  name: string;
  grid: [number, number];
  template: string;
  areas: {[name:string]: number};
  constructor(readonly id: number, data: any, template: string[][]){ 
    this.name = data[DataExtractionHelper.DASHBOARD_NAME_INDEX];
    this.grid = [template.length, template[0].length];
    this.template = template.map((charList:string[]) => '"'.concat(charList.join(' '), '"')).join('\n');
    this.areas  = {};
    let widgetsIds: number[] = data[DataExtractionHelper.DASHBOARD_WIDGET_INDEX];
    let i = 0;
    for (let char of template.flat())
      if (!(char in this.areas)) this.areas[char] = DataExtractionHelper.getCompleteWidgetParams(widgetsIds[i++]);
  }
};

export default Dashboard;