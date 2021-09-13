class Dashboard {
  name: string;
  grid: [number, number];
  template: string;
  areas: {[name:string]: number};
  constructor(readonly id: number, data: any, layout: any) { 
    this.name = data.name;
    let layoutTemplate = layout.template;
    this.grid = [layoutTemplate.length, layoutTemplate[0].length]
    this.template = layoutTemplate.map((charList:string[]) => charList.join(' ')).join('\n')
    this.areas  = {};
    let widgetsIds: number[] = data.widgets;
    let i = 0;
    for (let char of layoutTemplate.reduce((acc: string[], listChar: string[]) => acc.concat(listChar), [])) {
      if (!(char in this.areas)) this.areas[char] = widgetsIds[i++];
    }
  }
};

export default Dashboard;