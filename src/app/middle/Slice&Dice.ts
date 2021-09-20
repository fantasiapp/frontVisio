import Tree from './Tree';
import DataExtractionHelper from './DataExtractionHelper';
import navigationNodeConstructor from './NavigationNode';
import tradeNodeConstructor from './TradeNode';
import {Injectable} from '@angular/core';
import {WidgetManagerService} from '../grid/widget-manager.service';
import { CDK_CONNECTED_OVERLAY_SCROLL_STRATEGY_PROVIDER_FACTORY } from '@angular/cdk/overlay/overlay-directives';


class DataWidget{
  private data: any;
  private dim: number;
  constructor(
    public rowsTitles: string[],
    public columnsTitles: string[],
    public idToI: {[key:number]: number},
    public idToJ: {[key:number]: number}
  ){
    let n = rowsTitles.length, m = columnsTitles.length;
    this.data = DataWidget.zeros(n, m);
    this.dim = 2;
  }

  addOnCase(x: number, y: number, value: number){
    this.data[this.idToI[x]][this.idToJ[y]] += value;
  }

  addOnRow(x: number, vect: number[]){
    let m = this.columnsTitles.length;
    for (let j = 0; j < m; j++)
      this.data[this.idToI[x]][j] += vect[j];
  }

  addOnColumn(y: number, vect: number[]){
    let n = this.rowsTitles.length;
    for (let i = 0; i < n; i++)
      this.data[i][this.idToJ[y]] += vect[i];
  }

  get(fieldId1: number, fieldId2: number){
    return this.data[this.idToI[fieldId1]][this.idToJ[fieldId2]];
  }

  // Pour le moment on ne change pas les dict iToI et iToJ, donc une fois la fonction utilisée le datawidget ne peut plus être modifié
  groupData(groupsAxe1: string[], groupsAxe2: string[], simpleFormat=false, percent=false){
    groupsAxe1 = (groupsAxe1.length === 0) ? this.rowsTitles : groupsAxe1;
    groupsAxe2 = (groupsAxe2.length === 0) ? this.columnsTitles : groupsAxe2;
    let newData: number[][] = DataWidget.zeros(groupsAxe1.length, groupsAxe2.length);
    for (let i = 0; i < this.rowsTitles.length; i++){
      let titleRow = this.rowsTitles[i];
      let sumRow = this.data[i].reduce((acc: number, value: number) => acc + value, 0)
      if (sumRow === 0) continue;
      for (let j = 0; j < this.columnsTitles.length; j++){
        let titleColumn = this.columnsTitles[j];
        let newI = groupsAxe1.indexOf(titleRow),
            newJ = groupsAxe2.indexOf(titleColumn);
        if (newI < 0) newI = groupsAxe1.length - 1;
        if (newJ < 0) newJ = groupsAxe2.length - 1;
        newData[newI][newJ] += percent ? 100*this.data[i][j]/sumRow: this.data[i][j];
      }
    }
    if (simpleFormat && groupsAxe1.length == 1 && groupsAxe2.length == 1){
      this.dim = 0;
      this.data = newData[0][0];
      if(this.rowsTitles.length !== 1) this.rowsTitles = ['all'];
      this.columnsTitles = ['all'];
    } else if (simpleFormat && groupsAxe1.length == 1){
      this.dim = 1;
      this.data = newData[0];
      this.rowsTitles = ['all'];  
      this.columnsTitles = groupsAxe2; 
    } else if (simpleFormat && groupsAxe2.length == 1){
      this.dim = 1;
      this.data = newData.map(x => x[0]);
      this.rowsTitles = groupsAxe1;
      this.columnsTitles = ['all'];
    } else{
      this.data = newData;
      this.rowsTitles = groupsAxe1;
      this.columnsTitles = groupsAxe2;
    }
  }
  
  private m2ToKm2(){
    for (let i = 0; i < this.rowsTitles.length; i++)
    for (let j = 0; j < this.columnsTitles.length; j++)
    this.data[i][j] = this.data[i][j]/1000;
  }

  // percent(){
  //   if (this.dim == 0) this.data = 100;
  //   else if (this.dim == 1){
  //     let sum = this.data.reduce((acc: number, value: number) => acc + value, 0);
  //     for (let i=0; i < this.data.length; i++)
  //       this.data[i] = 100 * this.data[i] / sum;
  //   }
  //   else if (this.dim == 2){
  //     for (let i = 0; i < this.rowsTitles.length; i++){
  //       console.log(this.data[i]);
  //       let sumRow = this.data[i].reduce((acc: number, value: number) => acc + value, 0);
  //       for (let j = 0; j < this.columnsTitles.length; j++){
  //         this.data += 100 * this.data[i][j] / sumRow;
  //       }
  //     }
  //   }
  // }
  
  basicTreatement(km2 = false){
    if (km2) this.m2ToKm2();
    this.removeZeros();
    this.sortLines();
  }
  
  formatWidget(transpose:boolean){
    // Pas très beau pour les deux prochaines lignes
    if (this.columnsTitles[this.columnsTitles.length - 1] === '@other') this.columnsTitles[this.columnsTitles.length - 1] = 'Challengers'; 
    if (this.rowsTitles[this.rowsTitles.length - 1] === '@other') this.rowsTitles[this.rowsTitles.length - 1] = 'Challengers'; 
    if (this.dim === 0) return [[this.rowsTitles[0], this.data]];
    if (this.dim === 1){
      let widgetParts: [string, number][] = [];    
      for (let i = 0; i < this.rowsTitles.length; i++)
        widgetParts.push([this.rowsTitles[i], this.data[i]]);
      return widgetParts
    }
    if (transpose){
      let widgetParts: (number | string)[][] = [['x'].concat(this.rowsTitles)];
      for (let j = 0; j < this.columnsTitles.length; j++){
        let line: (number | string)[] = [this.columnsTitles[j]]
        for (let i = 0; i < this.rowsTitles.length; i++)
          line.push(this.data[i][j]);
        widgetParts.push(line);
      }
      return widgetParts;  
    }
    let widgetParts: (number | string)[][] = [['x'].concat(this.columnsTitles)];
    for (let i = 0; i < this.rowsTitles.length; i++){
      let line: (number | string)[] = [this.rowsTitles[i]]
      for (let j = 0; j < this.columnsTitles.length; j++)
        line.push(this.data[i][j]);
      widgetParts.push(line);
    }
    return widgetParts;    
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
  
  private removeZeros(){
    let n = this.rowsTitles.length,
      m = this.columnsTitles.length;
    let newData: number[][] = [];
    let realLinesIndexes: number[] = [];
    let realColumnsIndexes: number[] = [];
    let i = 0;
    for (let i = 0; i < n; i++){
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
  
  private static zeros(n:number, m:number): number[][]{
    let data: number[][] = [];
    for (let i = 0; i < n; i++)
      data.push(new Array(m).fill(0));
    return data;
  }
  
  getSum(){
    if (this.dim === 0) return Math.round(this.data);
    if (this.dim === 1) return Math.round(this.data.reduce((acc:number, value:number) => acc + value, 0));
    return Math.round(
      this.data.reduce((acc:number, list:number[]) => acc + list.reduce((acc:number, value:number) => acc + value, 0), 0));
  }

  getData(){
    return this.data;
  }
}

class Sale{
  static INDUSTRY_ID_INDEX = 0;
  static PRODUCT_ID_INDEX = 1;
  static VOLUME_INDEX = 2;

  constructor(private data: any[]){};

  get type(): string{
    return (this.productId < 4) ? 'p2cd' : ((this.productId == 4) ? 'enduit' : 'other');
  }

  get industryId() {return this.data[Sale.INDUSTRY_ID_INDEX];}
  get productId() {return this.data[Sale.PRODUCT_ID_INDEX];}
  get volume() {return this.data[Sale.VOLUME_INDEX];}
};

export class PDV{
  private static instances: Map<number, PDV> = new Map<number, PDV>();
  static geoTree: Tree;
  static tradeTree: Tree;
  private static indexMapping: Map<string, number>;

  static getInstances(): Map<number, PDV> {
    if (!this.instances)
      this.load(false);
    return this.instances;
  }

  static load(loadTrees = true){
    this.createIndexMapping();
    for (let [id, data] of Object.entries(DataExtractionHelper.get('pdvs'))){
      let intId = parseInt(id);
      if (Number.isNaN(intId)) continue;
      this.instances.set(intId, new PDV(intId, <any[]>data));
    }
    if (loadTrees) this.loadTrees();
  };

  private static createIndexMapping(){
    const fields = DataExtractionHelper.get('structurePdv') as string[];
    this.indexMapping = new Map<string, number>();
    fields.forEach((value: string, index: number) => 
      this.indexMapping.set(value, index)
    );
  }

  static index(attribute: string): number {
    return PDV.indexMapping.get(attribute)!;
  }
  
  private static loadTrees(){
    this.geoTree = new Tree(DataExtractionHelper.getGeoTree(), navigationNodeConstructor);
    this.tradeTree = new Tree(DataExtractionHelper.getTradeTree(), tradeNodeConstructor);
  }
  
  readonly sales: Sale[];
  constructor(readonly id: number, private values: any[]){
    this.sales = [];
    for (let d of this.attribute('sales'))
      this.sales.push(new Sale(d));
  };

  private getValue(indicator: string, byIndustries=false, enduit=false): (number | number[]){
    if (indicator == 'dn'){
      if (enduit){
        let pregyId = DataExtractionHelper.INDUSTRIE_PREGY_ID,
          salsiId = DataExtractionHelper.INDUSTRIE_SALSI_ID,
          siniatId = DataExtractionHelper.INDUSTRIE_SINIAT_ID,
          dnEnduit = new Array(3).fill(0),
          saleP2cd = false,
          saleEnduit = false;
        for (let sale of this.sales){
          if ((sale.industryId == pregyId || sale.industryId == salsiId) && sale.type == 'enduit') saleEnduit = true;
          else if (sale.industryId == siniatId && sale.type == 'p2cd') saleP2cd = true;
        }        
        if (saleP2cd && saleEnduit) dnEnduit[1] = 1;
        else if (saleEnduit) dnEnduit[2] = 1;
        else dnEnduit[0] = 1;
        return dnEnduit
      } else return 1;
    }
    let relevantSales = this.sales.filter(sale => sale.type == indicator);
    // pas opti de le calculer 2 fois quand l'indicator c'est p2cd
    let p2cdSales = this.sales.filter(sale => sale.type == 'p2cd');
    if (byIndustries){
      let keys = Object.keys(DataExtractionHelper.get('industrie'));
      let idIndustries: {[key:number]: any} = {}, diced = new Array(keys.length).fill(0);
      keys.forEach((id, index) => idIndustries[parseInt(id)] = index);
      for (let sale of relevantSales)
        diced[idIndustries[sale.industryId]] += sale.volume;      
      return diced;
    }
    let total = p2cdSales.reduce((acc, sale) => acc + sale.volume, 0);
    if (enduit){
      // pour le moment ce n'est pas très générique
      let pregyId = DataExtractionHelper.INDUSTRIE_PREGY_ID,
       salsiId = DataExtractionHelper.INDUSTRIE_SALSI_ID,
       totalEnduit = DataExtractionHelper.get('paramsCompute')['theoricalRatioEnduit'] * total,
       diced = new Array(4).fill(0);
      let growthConquestLimit = DataExtractionHelper.get('paramsCompute')['growthConquestLimit'] * totalEnduit;
      for (let sale of relevantSales){
        if (sale.industryId == pregyId) diced[0] += sale.volume;
        else if (sale.industryId == salsiId) diced[1] += sale.volume;    
      }
      let other = Math.max(totalEnduit - diced[0] - diced[1], 0)
      if (diced[0] + diced[1] > growthConquestLimit) diced[2] = other; 
      else diced[3] = other;
      return diced;
    }
    return total;
  }

  static findById(id: number): PDV | undefined {
    return this.instances.get(id);
  }

  static fillUpTable(dataWidget: DataWidget, axe1:string, axe2:string, indicator:string, pdvs: PDV[]){
    for (let pdv of pdvs){
      if (pdv.attribute('available') && pdv.attribute('sale')){
        if (axe1 == 'industrie')
          dataWidget.addOnColumn(pdv.attribute(axe2), pdv.getValue(indicator, true) as number[]);
        else if (axe2 == 'industrie')
          dataWidget.addOnRow(pdv.attribute(axe1), pdv.getValue(indicator, true) as number[]);
        else if (axe1 == 'enduitIndustrie' || axe1 == 'segmentDnEnduit'){
          dataWidget.addOnColumn(pdv.attribute(axe2), pdv.getValue(indicator, false, true) as number[]);
        }
        else if (axe2 == 'enduitIndustrie' || axe2 == 'segmentDnEnduit')
          dataWidget.addOnRow(pdv.attribute(axe1), pdv.getValue(indicator, false, true) as number[]);
        else
          dataWidget.addOnCase(pdv.attribute(axe1), pdv.attribute(axe2), pdv.getValue(indicator, false) as number);
      }
    }
  }

  attribute(name: string){
    return this.values[PDV.index(name)];
  }

  static getData(slice: any, axe1: string, axe2: string, indicator: string) {
    let dataAxe1 = DataExtractionHelper.get(axe1);
    let dataAxe2 = DataExtractionHelper.get(axe2);
    let rowsTitles = Object.values(dataAxe1) as string[];
    let columnsTitles = Object.values(dataAxe2) as string[];
    let idToI:any = {}, idToJ:any = {};    
    Object.keys(dataAxe1).forEach((id, index) => idToI[parseInt(id)] = index);
    Object.keys(dataAxe2).forEach((id, index) => idToJ[parseInt(id)] = index);
    let pdvs: PDV[] = [], childrenOfSlice: any;
    if (slice) {
      //!!OPTIMIZE
      //!! We are calling sliceTree once per widget, even if it is the same slice
      [pdvs, childrenOfSlice] = this.sliceTree(slice);
      if (childrenOfSlice.hasOwnProperty(axe1)){
        rowsTitles = childrenOfSlice[axe1].map((node: any) => node.name);
        childrenOfSlice[axe1].forEach((id: number, index: number) => idToI[id] = index);
      }
      if (childrenOfSlice.hasOwnProperty(axe2)){
        rowsTitles = childrenOfSlice[axe2].map((node: any) => node.name);
        childrenOfSlice[axe2].forEach((id: number, index: number) => idToJ[id] = index);
      }
    } else{
      pdvs = [...this.instances.values()];
    }
    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpTable(dataWidget, axe1, axe2, indicator, pdvs);
    return dataWidget;
  }

  static hasNodeChildren(node: any): boolean{
    return (node.children.length != 0) && !(node.children[0] instanceof Sale);
  }

  static sliceTree(slice: {[key:string]:number}): [PDV[], {[key:string]:any[]}]{
    let relevantDepth: number,
      searchedId: number,
      geoTree: boolean = true;    
    relevantDepth = Math.max.apply(null, Object.keys(slice).map(key => this.geoTree.attributes['labels'].indexOf(key)));
    if (!relevantDepth){
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

  static heightOf(tree: Tree, label: string){
    return tree.attributes['labels'].indexOf(label);
  }

  static getLeaves(tree: Tree, node: any, height: number, dictChildren: {[key:string]:any[]}): PDV[]{
    let structure = tree.attributes['labels'];
    dictChildren[structure[height]].push([node.id, node.name]);    
    if ( node.children.length )
      return node.children.map((child: any) => this.getLeaves(tree, child, height+1, dictChildren)).reduce((a: PDV[], b: PDV[]) => a.concat(b), []);
    else
      return [this.instances.get(node.id)!];
  }


  static computeSlice(tree:Tree, slice: {[key:string]:number}, dictChildren: {}){
    //verify if slice is correct
    let keys: string[] = Object.keys(slice).sort((u, v) => this.heightOf(tree, u) - this.heightOf(tree, v)), connectedNodes, lastNodes;
    if (keys.length === 0){
      connectedNodes = [tree.root];
    }else {
      lastNodes = tree.getNodesAtHeight(this.heightOf(tree, keys[0]));
      connectedNodes = lastNodes.filter(node => node.id == slice[keys[0]]);
    }

    for (let i = 1; connectedNodes.length && (i < keys.length); i++ ){
      let currentHeight = this.heightOf(tree, keys[i]),
          previousHeight = this.heightOf(tree, keys[i-1]),
          heightDiff = currentHeight - previousHeight,
          nodes = tree.getNodesAtHeight(currentHeight).filter(node => node.id == slice[keys[i]]),
          parentNodes = nodes.slice(), //copy
          numberOfNodes = nodes.length;
      
      //climb the tree until a parent of same level is found
      while (heightDiff-- > 0)
        for (let i = 0; i < numberOfNodes; i++)
          if (nodes[i]) parentNodes[i] = parentNodes[i].parent;
      
      //verify is the slice structure is correct
      connectedNodes = nodes.filter((_, idx) => parentNodes[idx] && parentNodes[idx].id == slice[keys[i-1]]);
      //console.log(connectedNodes);
      lastNodes = nodes;
    }

    //incorrect slice
    if (!connectedNodes.length) return [];
    
    let pdvs = connectedNodes.map(node => this.getLeaves(tree, node, node.height, dictChildren)).flat();
    return pdvs;
  }
};


@Injectable()
class SliceDice{
  constructor(){ console.log('[SliceDice]: on'); }

  getWidgetData(slice:any, axis1:string, axis2:string, indicator:string, groupsAxis1:string[], groupsAxis2:string[], percent:boolean, transpose = false){
    let dataWidget = PDV.getData(slice, axis1, axis2, indicator.toLowerCase());
    let km2 = (indicator !== 'dn') ? true : false;
    dataWidget.basicTreatement(km2);
    dataWidget.groupData(groupsAxis1, groupsAxis2, true, percent);
    return dataWidget.formatWidget(transpose);
  }
};

function load(){
  PDV.load(true);
  return PDV.geoTree;
}

export {SliceDice, load};