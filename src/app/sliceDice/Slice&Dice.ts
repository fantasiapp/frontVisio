import { data, data as MOCK_DATA } from './test'
import { Injectable } from '@angular/core';
import Tree from './Tree';
import DataExtractionHelper from './DataExtractionHelper';
import navigationNodeConstructor from './NavigationNode';
import tradeNodeConstructor from './TradeNode';

//make a useless Tree and Node objects
//extend to get navigation and trade
//then make everything an object

class DataWidget {
  private data: any;
  constructor(
    public rowsTitles: string[],
    public columnsTitles: string[],
    public idToI: {[key:number]: number},
    public idToJ: {[key:number]: number}
  ) {
    let n = rowsTitles.length, m = columnsTitles.length;
    this.data = DataWidget.zeros(n, m);
  }

  addOnCase(x: number, y: number, value: number) {
    this.data[this.idToI[x]][this.idToJ[y]] += value;
  }

  addOnRow(x: number, vect: number[]) {
    let m = this.columnsTitles.length;
    for (let j = 0; j < m; j++)
      this.data[this.idToI[x]][j] += vect[j];
  }

  addOnColumn(y: number, vect: number[]) {
    let n = this.columnsTitles.length;
    for (let i = 0; i < n; i++)
      this.data[i][this.idToI[y]] += vect[i];
  }

  get(fieldId1: number, fieldId2: number) {
    return this.data[this.idToI[fieldId1]][this.idToJ[fieldId2]];
  }

  // Pour le moment on ne change pas les dict iToI et iToJ, donc une fois la fonction utilisée le datawidget ne peut plus être modifié
  groupData(groupsAxe1: string[], groupsAxe2: string[], simpleFormat=false, percent=false) {
    groupsAxe1 = (groupsAxe1.length === 0) ? this.rowsTitles : groupsAxe1;
    groupsAxe2 = (groupsAxe2.length === 0) ? this.columnsTitles : groupsAxe2;
    let newData: number[][] = DataWidget.zeros(groupsAxe1.length, groupsAxe2.length);
    for (let i = 0; i < this.rowsTitles.length; i++) {
      let titleRow = this.rowsTitles[i];
      let sumRow = this.data[i].reduce((acc: number, value: number) => acc + value, 0)
      if (sumRow === 0) continue;
      for (let j = 0; j < this.columnsTitles.length; j++) {
        let titleColumn = this.columnsTitles[j];
        let newI = groupsAxe1.indexOf(titleRow),
            newJ = groupsAxe2.indexOf(titleColumn);
        if (newI < 0) newI = groupsAxe1.length - 1;
        if (newJ < 0) newJ = groupsAxe2.length - 1;
        newData[newI][newJ] += percent ? 100*this.data[i][j]/sumRow: this.data[i][j];
      }
    }
    if (simpleFormat && groupsAxe1.length == 1 && groupsAxe2.length == 1){
      this.data = newData[0][0];
      if(this.rowsTitles.length !== 1) this.rowsTitles = ['all'];
      this.columnsTitles = ['all'];
    }else if (simpleFormat && groupsAxe1.length == 1){
      this.data = newData[0];
      this.rowsTitles = ['all'];  
      this.columnsTitles = groupsAxe2; 
    }else if (simpleFormat && groupsAxe2.length == 1){
      this.data = newData.map(x => x[0]);
      this.rowsTitles = groupsAxe1;
      this.columnsTitles = ['all'];
    }else {
      this.data = newData;
      this.rowsTitles = groupsAxe1;
      this.columnsTitles = groupsAxe2;
    }
  }

  basicTreatement(){
    this.removeZeros();
    this.sortLines();
  }

  formatSimpleWidget(){
    let widgetParts: any[] = [];
    if (Number.isInteger(this.data)){
      widgetParts.push({label: this.rowsTitles[0], value: Math.round(this.data)})
    }else {
      for (let i = 0; i < this.rowsTitles.length; i++){
        widgetParts.push({label: this.rowsTitles[i], value: Math.round(this.data[i])})
      }
    }
    return widgetParts
  }

  private sortLines(sortFunct = ((line: number[]) => line.reduce((acc: number, value: number) => acc + value, 0))){
    let coupleList: [string, number[]][] = [];
    for (let i = 0; i < this.rowsTitles.length; i ++)
      coupleList.push([this.rowsTitles[i], this.data[i]]);
    let sortCoupleListFunct = ((couple:[string, number[]]) => sortFunct(couple[1]));
    let sortedCoupleList = coupleList.sort((couple1: [string, number[]], couple2: [string, number[]]) => sortCoupleListFunct(couple2) - sortCoupleListFunct(couple1));
    this.rowsTitles = sortedCoupleList.map((couple: [string, number[]]) => couple[0]);
    this.data = sortedCoupleList.map((couple: [string, number[]]) => couple[1]);
  }

  // A supprimer dans la version finale
  // Ne marche pas quand la widget n'est plus une matrice
  display(roundNumber = false){
    let n = this.rowsTitles.length,
      m = this.columnsTitles.length;
    let displayArray = DataWidget.initializeDisplayArray(n + 1, m + 1)
    for (let i = 1; i < n + 1; i++){
      for (let j = 1; j < m + 1; j++){
        displayArray[i][j] = roundNumber ? Math.round(this.data[i - 1][j - 1]): this.data[i - 1][j - 1];
      }
    }
    for (let i = 1; i < n + 1; i++)
      displayArray[i][0] = this.rowsTitles[i - 1];
    for (let j = 1; j < m + 1; j++)
      displayArray[0][j] = this.columnsTitles[j - 1];
    console.log(displayArray)
  }

  private removeZeros(){
    let n = this.rowsTitles.length,
      m = this.columnsTitles.length;
    let newData: number[][] = [];
    let realLinesIndexes: number[] = [];
    let realColumnsIndexes: number[] = [];
    let i = 0;
    for (let i = 0; i < n; i++) {
      let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value === 0), true);
      if (!lineNull) realLinesIndexes.push(i);        
      }
    for (let _ in realLinesIndexes){
      newData.push([]);
    }
    for (let j = 0; j < m; j++){
      let colNull = this.data.reduce((acc: boolean, line: number[]) => acc && (line[j] === 0), true)
      if (!colNull){
        realColumnsIndexes.push(j)
        for (let i = 0; i < realLinesIndexes.length; i++){
          newData[i].push(this.data[realLinesIndexes[i]][j])
        }
      }
    }
    this.data = newData;
    this.rowsTitles = realLinesIndexes.map(index => this.rowsTitles[index]);
    this.columnsTitles = realColumnsIndexes.map(index => this.columnsTitles[index]);
  }

  private static zeros(n:number, m:number): number[][] {
    let data: number[][] = [];
    for (let i = 0; i < n; i++)
        data.push(new Array(m).fill(0));
    return data;
  }

  // A supprimer dans la version finale
  private static initializeDisplayArray(n:number, m:number): (number|string)[][] {
    let data: (number|string)[][] = [];
    for (let i = 0; i < n; i++)
      data.push(new Array(m).fill('x'));
    return data;
  }

  // A supprimer dans la version finale
  getData(){return this.data}
}

class Sale {
  static INDUSTRY_ID_INDEX: number = 0;
  static PRODUCT_ID_INDEX: number = 1;
  static VOLUME_INDEX: number = 2;

  constructor(private data: any[]) {};
  get type(): string {
    return this.productId < 4 ? 'p2cd' : (this.productId == 4 ? 'enduit' : 'other');
  }

  get industryId() { return this.data[Sale.INDUSTRY_ID_INDEX]; }
  get productId() { return this.data[Sale.PRODUCT_ID_INDEX]; }
  get volume() { return this.data[Sale.VOLUME_INDEX]; }
};

export class PDV {
  private static instances: Map<number, PDV> = new Map<number, PDV>();

  static geoTree: Tree;
  static tradeTree: Tree;
  private static indexMapping: Map<string, number>;

  static getInstances(): Map<number, PDV> {
    if ( !this.instances )
      this.load(false);
    return this.instances;
  }

  static load(loadTrees = true) {
    //load properties
    this.createIndexMapping();
    for ( let [id, data] of Object.entries(DataExtractionHelper.get('pdv')) ) {
      let intId = parseInt(id);
      if ( Number.isNaN(intId) ) continue;
      this.instances.set(intId, new PDV(intId, <any[]>data));
    }

    if ( loadTrees ) this.loadTrees();
  };

  private static createIndexMapping() {
    const fields = DataExtractionHelper.get('pdv')['fields'] as string[];
    this.indexMapping = new Map<string, number>();
    fields.forEach((value: string, index: number) => 
      this.indexMapping.set(value, index)
    );
  }

  static index(attribute: string): number {
    return PDV.indexMapping.get(attribute)!;
  }
  
  private static loadTrees() {
    this.geoTree = new Tree(DataExtractionHelper.getGeoTree(), navigationNodeConstructor);
    this.tradeTree = new Tree(DataExtractionHelper.getTradeTree(), tradeNodeConstructor);
  }
  
  readonly sales: Sale[];
  constructor(readonly id: number, private values: any[]) {
    this.sales = [];
    for ( let d of this.attribute('sales') )
      this.sales.push(new Sale(d));
  };

  private getValue(indicator: string, byIndustries=false): number | number[] {
    if ( indicator == 'dn' ) return 1;
    let relevantSales = this.sales.filter(sale => sale.type == indicator);
    if ( byIndustries ) {
      let keys = Object.keys(DataExtractionHelper.get('industrie'));

      let idIndustries: {[key:number]: any} = {}, diced = new Array(keys.length).fill(0);
      keys.forEach((id, index) => idIndustries[parseInt(id)] = index);
      for ( let sale of relevantSales )
        diced[idIndustries[sale.industryId]] += sale.volume;
      
      return diced;
    }

    return relevantSales.reduce((acc, sale) => acc + sale.volume, 0);
  }

  static findById(id: number): PDV | undefined {
    return this.instances.get(id);
  }

  static fillUpTable(dataWidget: DataWidget, slice: {[key:string]:number}, axe1:string, axe2:string, indicator:string, pdvs: PDV[]) {
    for ( let pdv of pdvs ) {
      if ( pdv.attribute('available') && pdv.attribute('sale') ) {
        if ( axe1 == 'industrie' )
          dataWidget.addOnColumn(pdv.attribute(axe2), pdv.getValue(indicator, true) as number[]);
        else if ( axe2 == 'industrie' )
          dataWidget.addOnRow(pdv.attribute(axe1), pdv.getValue(indicator, true) as number[]);
        else
          dataWidget.addOnCase(pdv.attribute(axe1), pdv.attribute(axe2), pdv.getValue(indicator, false) as number);
      }
    }
  }

  attribute(name: string) {
    return this.values[PDV.index(name)];
  }

  //this is correct, but the order of elements is just different
  static getData(slice: any, axe1: string, axe2: string, indicator: string) {
    let dataAxe1 = DataExtractionHelper.get(axe1);
    let dataAxe2 = DataExtractionHelper.get(axe2);

    let rowsTitles = Object.values(dataAxe1) as string[];
    let columnsTitles = Object.values(dataAxe2) as string[];
    let idToI:any = {}, idToJ:any = {};
    
    Object.keys(dataAxe1).forEach((id, index) => idToI[parseInt(id)] = index);
    Object.keys(dataAxe2).forEach((id, index) => idToJ[parseInt(id)] = index);

    let pdvs: PDV[] = [...this.instances.values()], childrenOfSlice: any;
    if ( slice ) {
      [pdvs, childrenOfSlice] = this.sliceTree(slice);
      if ( childrenOfSlice.hasOwnProperty(axe1) ) {
        rowsTitles = childrenOfSlice[axe1].map((node: any) => node.name);
        childrenOfSlice[axe1].forEach((id: number, index: number) => idToI[id] = index);
      }

      if ( childrenOfSlice.hasOwnProperty(axe2) ) {
        rowsTitles = childrenOfSlice[axe2].map((node: any) => node.name);
        childrenOfSlice[axe2].forEach((id: number, index: number) => idToJ[id] = index);
      }
    }


    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpTable(dataWidget, slice, axe1, axe2, indicator, pdvs);
    return dataWidget;
  }

  static hasNodeChildren(node: any): boolean {
    return (node.children.length != 0) && !(node.children[0] instanceof Sale);
  }

  static sliceTree(slice: {[key:string]:number}): [PDV[], {[key:string]:any[]}] {
    let relevantDepth: number,
      searchedId: number,
      geoTree: boolean = true;
    
    relevantDepth = Math.max.apply(null, Object.keys(slice).map(key => this.geoTree.attributes['labels'].indexOf(key)));
    if ( !relevantDepth ) {
      relevantDepth = Math.max.apply(null, Object.keys(slice).map(key => this.tradeTree.attributes['labels'].indexOf(key)));
      geoTree = false;
    }
    

    let tree = geoTree ? this.geoTree : this.tradeTree;
    let structure = tree.attributes['labels'];
    let dictChildren: {[key:string]: any} = {};
    structure.slice(relevantDepth).forEach(h =>
      dictChildren[h] = []
    );
    
    let pdvs: PDV[] = this.computeSlice(tree, slice, dictChildren);
    delete dictChildren[structure[relevantDepth]];
    return [pdvs, dictChildren];
  }

  static heightOf(tree: Tree, label: string) {
    return tree.attributes['labels'].indexOf(label);
  }

  static getLeaves(tree: Tree, node: any, height: number, dictChildren: {[key:string]:any[]}): PDV[] {
    let structure = tree.attributes['labels'];
    dictChildren[structure[height]].push([node.id, node.name]);
    
    if ( node.children.length )
      return node.children.map((child: any) => this.getLeaves(tree, child, height+1, dictChildren)).reduce((a: PDV[], b: PDV[]) => a.concat(b), []);
    else
      return [this.instances.get(node.id)!];
  }


  static computeSlice(tree:Tree, slice: {[key:string]:number}, dictChildren: {}) {
    //verify if slice is correct
    let keys: string[] = Object.keys(slice).sort((u, v) => this.heightOf(tree, u) - this.heightOf(tree, v)), connectedNodes, lastNodes;

    if (keys.length === 0){
      connectedNodes = [tree.root];
    }else {
      lastNodes = tree.getNodesAtHeight(this.heightOf(tree, keys[0]));
      connectedNodes = lastNodes.filter(node => node.id == slice[keys[0]]);
    }

    for ( let i = 1; connectedNodes.length && (i < keys.length); i++ ) {
      let currentHeight = this.heightOf(tree, keys[i]),
          previousHeight = this.heightOf(tree, keys[i-1]),
          heightDiff = currentHeight - previousHeight,
          nodes = tree.getNodesAtHeight(currentHeight).filter(node => node.id == slice[keys[i]]),
          parentNodes = nodes.slice(), //copy
          numberOfNodes = nodes.length;
      
      //climb the tree until a parent of same level is found
      while ( heightDiff-- > 0 )
        for ( let i = 0; i < numberOfNodes; i++ )
          if ( nodes[i] ) parentNodes[i] = parentNodes[i].parent;
      
      //verify is the slice structure is correct
      connectedNodes = nodes.filter((node, idx) => parentNodes[idx] && parentNodes[idx].id == slice[keys[i-1]]);
//      console.log(connectedNodes);
      lastNodes = nodes;
    }

    //incorrect slice
    if ( !connectedNodes.length ) return [];
    
    let pdvs = connectedNodes.map(node => this.getLeaves(tree, node, node.height, dictChildren)).flat();
    return pdvs;
  }


};


@Injectable()
class SliceDice {
  //use some service to correctly load data
  constructor() {
    
  }

  dnMarcheP2cd(slice:any) {
    PDV.load();
    let dataWidget = PDV.getData(slice, "segmentMarketing", "segmentCommercial", "dn");
    dataWidget.basicTreatement();
    dataWidget.groupData([], ['@other'], true)
    return dataWidget.formatSimpleWidget();
  }
  
  p2cdMarcheP2cd(slice:any) {
    PDV.load();
    let dataWidget = PDV.getData(slice, "segmentMarketing", "segmentCommercial", "p2cd");
    dataWidget.basicTreatement();
    dataWidget.groupData([], ["@other"], true)
    return dataWidget.formatSimpleWidget();
  }
};

function load() {
  PDV.load();
  return PDV.geoTree;
}

export { SliceDice, load };