import DEH from "../middle/DataExtractionHelper";
import DataExtractionHelper, { Params } from "../middle/DataExtractionHelper";
import { PDV } from "../middle/Pdv";

//static class that builds icons
export class MapIconBuilder {
  private defaultValues: any;
  private categories: any[];
  private categoriesNames: string[];
  readonly icons: any;

  //the constructor is only used to reset values -- perhaps a bad idea ?
  constructor(defaultValues: any) {
    MapIconBuilder.instance = this;
    this.defaultValues = defaultValues;
    this.categories = [];
    this.categoriesNames = [];
    this.icons = {'data': {}};
  }

  createIcon(values: any) {
    let width = this.getPropertyOf(values, 'width'),
      height = this.getPropertyOf(values, 'height'),
      stroke = this.getPropertyOf(values, 'stroke'),
      strokeWidth = this.getPropertyOf(values, 'strokeWidth'),
      fill = this.getPropertyOf(values, 'fill');
    
    return {
      url: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width='${width}' height='${height}' version='1.1' xmlns='http://www.w3.org/2000/svg'>
          ${values.head ? values.head(this, values) : `<circle cy='10' cx='15' r='8' stroke='${stroke}' stroke-width='1' fill='${fill}'></circle>`}
          ${values.body ? values.body(this, values) : `<line x1='15' y1='18' x2='15' y2='30' stroke='${stroke}' stroke-width='${strokeWidth}'></line>`}
          ${values.feet ? values.feet(this, values) : ``}
        </svg>
      `),
      scaledSize: new google.maps.Size(width, height)
    }
  }

  getPropertyOf(object: any, key: string) {
    return (object && object[key]) || this.defaultValues[key];
  }

  category(name: string, category: any) {
    this.categoriesNames.push(name);
    this.categories.push(category);
    return this;
  }

  generate() {
    this.generateData();
    this.generateIcons();
  }

  get(path: number[]) {
    let dict = this.icons;
    for ( let i = 0; i < this.categoriesNames.length; i++ ) {
      let name = this.categoriesNames[i] + '.' + path[i];
      if ( dict[name] )
        dict = dict[name];
      else
        return null;
    }
    
    return dict.icon;
  }

  private generateData(previousDict=this.icons, height:number=0) {
    if ( height >= this.categoriesNames.length ) return;
    let categoryName = this.categoriesNames[height];
    let data = this.categories[height];

    for ( let item of data ) {
      let key = categoryName + '.' + item[0];
      previousDict[key] = {'data': {...previousDict['data'], ...item[1]}}; 
      this.generateData(previousDict[key], height+1);
    }
  }

  private generateIcons(previousDict=this.icons, height:number=0) {
    if ( height >= this.categoriesNames.length ) return;
    let keys = Object.getOwnPropertyNames(previousDict);
    for ( let key of keys ) {
      if ( !previousDict[key].data ) continue
      previousDict[key].icon = this.createIcon(previousDict[key]['data']);
      this.generateIcons(previousDict[key], height+1);
    }
  }

  static circle(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<circle cy='10' cx='15' r='8' stroke='${stroke}' stroke-width='1' fill='${fill}'></circle>`
  }

  static square(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<rect x='7.5' y='2.5' width='15' height='15' stroke='${stroke}' stroke-width='1' fill='${fill}'></rect>`
  }

  static diamond(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    return `<rect transform='rotate(45, 15, 10)' x='8' y='3' width='14' height='14' fill='${fill}' stroke='${stroke}' stroke-width='1'></rect>`
  }

  static generateNGon(n: number, r: number = 1) {
    let angle = 2*Math.PI/n;
    let points = [];
    for ( let i = 0; i < n; i++ )
      points.push([r*Math.cos(angle*i), r*Math.sin(angle*i)]);
    return points;
  }

  static hex(builder: MapIconBuilder, {stroke = builder.getPropertyOf(null, 'stroke'), fill}: any) {
    let points = MapIconBuilder.generateNGon(6, 10).map(([x, y]) => (x + 15) + ',' + (y + 10)).join(' ');
    return `
      <polygon fill='${fill}' stroke='${stroke}' stroke-width='1' points='${points}'></polygon>
    `
  }
  static fire() {
    return `
      <g id="Group_17830" data-name="Group 17830" transform="translate(-95, -108.625) scale(0.8)" transform-origin="110 125">
        <path id="Path_45452" data-name="Path 45452" d="M110.177,125.528c.105.05.212.1.317.15a7.489,7.489,0,0,1,3.779,4.351,13.4,13.4,0,0,1,.744,4.255c0,.065,0,.13,0,.194a.49.49,0,0,0,.3.465.471.471,0,0,0,.552-.11c.288-.3.576-.6.845-.918a5.016,5.016,0,0,0,1.049-1.9c.059.113.11.209.157.306a9.271,9.271,0,0,1,.991,4.089,7.257,7.257,0,0,1-5.707,7.137,6.939,6.939,0,0,1-6.3-1.653,7.289,7.289,0,0,1-2.437-4.1,6.53,6.53,0,0,1,.289-3.569c.318-.912.623-1.828.9-2.752.159-.526.256-1.071.38-1.607.007-.03.016-.06.032-.12.078.087.144.154.2.226a3.821,3.821,0,0,1,.96,2.518c0,.362.219.585.537.539a.67.67,0,0,0,.354-.2,6.6,6.6,0,0,0,1.548-2.827,12.9,12.9,0,0,0,.493-4.083c0-.119-.006-.238-.008-.357C110.156,125.557,110.165,125.548,110.177,125.528Z" transform="translate(-0.899 -1.156)" fill="#f06d0c"/>
      </g>
    `;
  }

  static evaluateValues(category: string, values: any) {
    let mapping = DataExtractionHelper.get(category),
      result: [number, any][] = [];
    
    if ( mapping ) {
      for ( let [key, value] of Object.entries(values) )
        result.push([+DataExtractionHelper.getKeyByValue(mapping, key)!, value]);
    } else {
      result = Object.values(values).map((value, idx) => [idx, value]);
    }

    return result;
  }

  static legend: any;
  static legendArgs: any;
  static initialize() {
    let builder = new MapIconBuilder({
      width: 30, height: 30, stroke: '#151D21', strokeWidth: 1, fill: '#ffffff'
    });

    this.legendArgs = LEGEND_ARGS[Params.rootLabel] || LEGEND_ARGS['default'];
    let legend = this.legend = LEGEND[Params.rootLabel] || LEGEND['default'];
    for ( let [category, values] of Object.entries(legend) )
      builder.category(category, this.evaluateValues(category, values));
    
    builder.generate();
    this.instance = builder;
  }

  static getIcon(pdv: PDV) {
    let args = this.legendArgs,
      result: number[] = [];
    
    for ( let arg of args ) {
      if ( typeof arg === 'string' ) {
        result.push(+pdv.filterProperty(arg));
      } else {
        let [prop, transform] = arg;
        result.push(transform(pdv.filterProperty(prop)));
      }
    }

    return this.instance!.get(result);
  }

  private static _instance: MapIconBuilder | null = null;
  public static get instance() { return this._instance!; }
  private static set instance(value: MapIconBuilder) { this._instance = value; } 
};

let LEGEND: {[key: string]: any} = {
  agentFinitions: {
    'visité': {0: {fill: '#0056A6'}, 1: {fill: '#A61F7D'}},
    'typology': {
      'Pur prospect': {head: MapIconBuilder.square},
      'Enduit hors P2CD': {head: MapIconBuilder.diamond},
      'P2CD + Enduit': {head: MapIconBuilder.circle},
      'Non documenté': {head: MapIconBuilder.hex}
    }
  },
  default: {
    'industriel': {
      'Siniat': {fill: '#A61F7D'},
      'Placo': {fill: '#0056A6'},
      'Knauf': {fill: '#67CFFE'},
      'Autres': {fill: '#888888'}
    },
    'Non Documenté': {0: {}, 1: {fill: '#FF0000'}},
    'pointFeu': {0: {}, 1: {strokeFeet: 'red', feet: MapIconBuilder.fire}},
    'segmentMarketing': {
      'Généralistes': {head: MapIconBuilder.circle},
      'Multi Spécialistes': {head: MapIconBuilder.square},
      'Purs Spécialistes': {head: MapIconBuilder.diamond},
      'Autres': {head: MapIconBuilder.circle}
    }
  }
};
let idNonDoc = +DEH.getKeyByValue(DEH.get('clientProspect'), "Non documenté")!;
let LEGEND_ARGS: {[key: string]: (string | [string, (arg: any) => number])[]} = {
  agentFinitions: [
    ['visited',  (visited: number) => +(visited != 2)],
    'typology'
  ],
  default: [
    'industriel',
    ['clientProspect', (prospect: number) => +(prospect == idNonDoc)],
    'pointFeu',
    'segmentMarketing'
  ]
};