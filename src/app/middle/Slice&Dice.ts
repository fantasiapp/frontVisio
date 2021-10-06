import DataExtractionHelper, {NavigationExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import {Injectable} from '@angular/core';
import {Tree, Node} from './Node';
import { DataService } from '../services/data.service';


// peut-être à mettre dans un fichier de config
const nonRegularAxis = ['industrie', 'enduitIndustrie', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 'segmentDnEnduitTarget', 'enduitIndustrieTarget', 'industrieTarget'],
  targetAxis = ['clientProspectTarget', 'segmentDnEnduitTarget', 'enduitIndustrieTarget', 'industrieTarget'],
  enduitAxis = ['enduitIndustrie', 'segmentDnEnduit', 'segmentDnEnduitTarget', 'enduitIndustrieTarget'],
  industrieAxis = ['industrie', 'industrieTarget'],
  clientProspectAxis = ['clientProspect', 'clientProspectTarget'];

class DataWidget{
  private data: any;
  private dim: number;
  constructor(
    public rowsTitles: string[],
    public columnsTitles: string[],
    public idToI: {[key:number]: number|undefined},
    public idToJ: {[key:number]: number|undefined}
  ){
    let n = rowsTitles.length, m = columnsTitles.length;
    this.data = DataWidget.zeros(n, m);
    this.dim = 2;
  }

  addOnCase(x: number, y: number, value: number){
    this.data[this.idToI[x] as number][this.idToJ[y] as number] += value;
  }

  addOnRow(x: number, vect: number[]){
    let m = this.columnsTitles.length;
    for (let j = 0; j < m; j++)
      this.data[this.idToI[x] as number][j] += vect[j];
  }

  addOnColumn(y: number, vect: number[]){
    let n = this.rowsTitles.length;
    for (let i = 0; i < n; i++)
      this.data[i][this.idToJ[y] as number] += vect[i];
  }

  get(fieldId1: number, fieldId2: number){
    return this.data[this.idToI[fieldId1] as number][this.idToJ[fieldId2] as number];
  }

  groupData(groupsAxis1: string[], groupsAxis2: string[], simpleFormat=false){
    let isOne1 = groupsAxis1.length == 1,
      isOne2 = groupsAxis2.length == 1;
    groupsAxis1 = (groupsAxis1.length === 0) ? this.rowsTitles : groupsAxis1;
    groupsAxis2 = (groupsAxis2.length === 0) ? this.columnsTitles : groupsAxis2;
    let newData: number[][] = DataWidget.zeros(groupsAxis1.length, groupsAxis2.length),
      newIdToI = new Array(this.rowsTitles.length).fill(0),
      newIdToJ = new Array(this.columnsTitles.length).fill(0);
    for (let i = 0; i < this.rowsTitles.length; i++){
      let titleRow = this.rowsTitles[i];
      for (let j = 0; j < this.columnsTitles.length; j++){
        let titleColumn = this.columnsTitles[j];
        let newI = groupsAxis1.indexOf(titleRow),
            newJ = groupsAxis2.indexOf(titleColumn);
        newIdToI[i] = newI;
        newIdToJ[j] = newJ;
        if (newI < 0) newI = groupsAxis1.length - 1;
        if (newJ < 0) newJ = groupsAxis2.length - 1;
        newData[newI][newJ] += this.data[i][j];
      }
    }
    for (let [id, i] of Object.entries(this.idToI)) this.idToI[+id] = newIdToI[i as number];
    for (let [id, j] of Object.entries(this.idToJ)) this.idToJ[+id] = newIdToJ[j as number];
    if (simpleFormat && isOne1 && isOne2){
      this.dim = 0;
      this.data = newData[0][0];
    } else if (simpleFormat && isOne1){
      this.dim = 1;
      this.data = newData[0]; 
    } else if (simpleFormat && isOne2){
      this.dim = 1;
      this.data = newData.map(x => x[0]);
    } else{
      this.data = newData;
    }
    this.rowsTitles = groupsAxis1;
    this.columnsTitles = groupsAxis2;
  }
  
  private m2ToKm2(){
    for (let i = 0; i < this.rowsTitles.length; i++)
    for (let j = 0; j < this.columnsTitles.length; j++)
    this.data[i][j] = this.data[i][j]/1000;
  }

  percent(onCols=false){
    let almost100 = 99.999;
    if (this.dim == 0) this.data = almost100;
    else if (this.dim == 1){
      let sum = this.data.reduce((acc: number, value: number) => acc + value, 0);
      for (let i=0; i < this.data.length; i++)
        this.data[i] = almost100 * this.data[i] / sum;
    }
    else{
      if (!onCols){
        for (let i = 0; i < this.rowsTitles.length; i++){
          let sumRow = this.data[i].reduce((acc: number, value: number) => acc + value, 0);
          for (let j = 0; j < this.columnsTitles.length; j++)
            this.data[i][j] = almost100 * this.data[i][j] / sumRow;
        }
      }
      else{
        for (let j = 0; j < this.columnsTitles.length; j++){
          let sumCol = this.data.reduce((acc: number, line: number[]) => acc + line[j], 0);
          for (let i = 0; i < this.rowsTitles.length; i++)
            this.data[i][j] = almost100 * this.data[i][j] / sumCol;
        }
      }
    }
  }
  
  basicTreatement(km2 = false){
    if (km2) this.m2ToKm2();
    this.removeZeros();
    this.sortLines();
  }
  
  formatWidget(transpose:boolean){
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

  // ça ne change pas le idToJ (pour le moment on s'en fout mais l'info peut être utile plus tard)
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
      m = this.columnsTitles.length,
      newData: number[][] = [],
      realLinesIndexes: number[] = [],
      realColumnsIndexes: number[] = [];
    for (let i = 0; i < n; i++){
      let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value === 0), true);
      if (lineNull) this.idToI[i] = undefined;
      if (!lineNull) realLinesIndexes.push(i);        
    }
    for (let _ in realLinesIndexes) newData.push([]);
    for (let j = 0; j < m; j++){
      let colNull = this.data.reduce((acc: boolean, line: number[]) => acc && (line[j] === 0), true);
      if (colNull) this.idToJ[j] = undefined;
      if (!colNull){
        realColumnsIndexes.push(j)
        for (let i = 0; i < realLinesIndexes.length; i++){
          newData[i].push(this.data[realLinesIndexes[i]][j])
        }
      }
    }
    for (let [id, i] of Object.entries(this.idToI)) if (i != undefined) this.idToI[+id] = realLinesIndexes.indexOf(i);
    for (let [id, j] of Object.entries(this.idToJ)) if (j != undefined) this.idToJ[+id] = realColumnsIndexes.indexOf(j);
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
    let sumCols = new Array(this.columnsTitles.length).fill(0);
    for(let j = 0; j < this.columnsTitles.length; j++) 
      sumCols[j] = this.data.reduce((acc:number, line:number[]) => acc + line[j], 0);
    return sumCols
  }

  getData(){
    return this.data;
  }

  fillWithRandomValues(){
    for(let i = 0; i < this.rowsTitles.length; i++)
      for(let j = 0; j < this.columnsTitles.length; j++)
        this.data[i][j] = Math.random() * 100;
  }
}

class Sale {
  static INDUSTRY_ID_INDEX = 1;
  static PRODUCT_ID_INDEX = 2;
  static VOLUME_INDEX = 3;

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

  get targetP2cd(){
    let target = this.attribute('target');
    if (target == undefined) return 0;
    return target[DataExtractionHelper.TARGET_VOLUME_ID]
  }

  get targetFinition(){
    let target = this.attribute('target');
    if (target == undefined) return 0;
    return target[DataExtractionHelper.TARGET_FINITION_ID]
  }

  static getInstances(): Map<number, PDV> {
    if (!this.instances)
      this.load(false);
    return this.instances;
  }

  // Il faudra penser à delete la requête de la ram après l'avoir utilisée
  static load(loadTrees = true){
    this.createIndexMapping();
    for (let [id, data] of Object.entries(DataExtractionHelper.get('pdvs'))){
      let intId = parseInt(id);
      if (Number.isNaN(intId)) continue;
      this.instances.set(intId, new PDV(intId, <any[]>data));
    }
    if (loadTrees) this.loadTrees();
    // let structureTargets = DataExtractionHelper.get('structureTarget');
    // let indexPdv: number = structureTargets.indexOf("pdv"),
      // indexTargetP2cd:number = structureTargets.indexOf("targetP2CD"),
      // indexTargetFinition:number = structureTargets.indexOf("targetFinition");
    // for (let dataTarget of Object.values(DataExtractionHelper.get('target'))){
    //   let data: any = dataTarget as any;
    //   let pdvId: number = data[indexPdv] as number;
    //   let pdv = this.instances.get(pdvId) as PDV;
    //   let targetP2cd: number = data[indexTargetP2cd] as number;
    //   let targetFinition:boolean = data[indexTargetFinition] as boolean;
    //   pdv.targetP2cd = targetP2cd;
    //   pdv.targetFinition = targetFinition;
    // }
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
    this.geoTree = new Tree(NavigationExtractionHelper);
    this.tradeTree = new Tree(TradeExtrationHelper);
  }

  static getIndustries() {
    return Object.values(DataExtractionHelper.get('industrie'));
  }

  static getProducts() {
    return Object.values(DataExtractionHelper.get('produit'));
  }
  
  readonly sales: Sale[];
  constructor(readonly id: number, private values: any[]){
    this.sales = [];
    for (let d of this.attribute('sales'))
      this.sales.push(new Sale(d));
  };

  public getValues() {return this.values;}
  public setValues(newValues: any[]) {this.values = Object.assign([], newValues);}

  public getValue(indicator: string, byIndustries=false, enduit=false, clientProspect=false, target=false): (number | number[]){
    if (indicator == 'dn') return this.computeDn(enduit, clientProspect, target);
    let relevantSales = this.sales.filter(sale => sale.type == indicator);
    // pas opti de le calculer 2 fois quand l'indicator c'est p2cd
    let p2cdSales = this.sales.filter(sale => sale.type == 'p2cd');
    if (byIndustries) return this.computeIndustries(target, relevantSales);      
    let total = p2cdSales.reduce((acc, sale) => acc + sale.volume, 0);
    if (enduit) return this.computeEnduit(target, relevantSales, total);
    return total;
  }

  private computeDn(enduit:boolean, clientProspect:boolean, target:boolean){
    if (enduit){
      let axe : string[]= (target) ? Object.values(DataExtractionHelper.get('segmentDnEnduitTarget')): Object.values(DataExtractionHelper.get('segmentDnEnduitTarget')),
        associatedIndex :{[key: string]: number}= {};
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      let pregyId = DataExtractionHelper.INDUSTRIE_PREGY_ID,
        salsiId = DataExtractionHelper.INDUSTRIE_SALSI_ID,
        siniatId = DataExtractionHelper.INDUSTRIE_SINIAT_ID,
        dnEnduit = (target) ? new Array(5).fill(0): new Array(3).fill(0),
        totalP2cd = 0,
        totalSiniatP2cd = 0,
        saleEnduit = false;
      for (let sale of this.sales){
        if ((sale.industryId == pregyId || sale.industryId == salsiId) && sale.type == 'enduit' && sale.volume > 0) saleEnduit = true;
        else if (sale.type == 'p2cd'){
          totalP2cd += sale.volume;
          if (sale.industryId == siniatId) totalSiniatP2cd += sale.volume;
        }
      }
      let saleP2cd = totalSiniatP2cd > 0.1 * totalP2cd;
      if (saleP2cd && saleEnduit) dnEnduit[associatedIndex["P2CD + Enduit"]] = 1;
      else if (saleEnduit){
        if (target && this.targetFinition) dnEnduit[associatedIndex["Cible P2CD"]] = 1;
        else dnEnduit[associatedIndex["Enduit hors P2CD"]] = 1;
      } else{
        if (target && this.targetFinition) dnEnduit[associatedIndex["Cible Pur Prospect"]] = 1;
        else dnEnduit[associatedIndex["Pur prospect"]] = 1;
      }
      return dnEnduit
    } else if (clientProspect){
      let axe : string[]= (target) ? Object.values(DataExtractionHelper.get(('clientProspectTarget'))): Object.values(DataExtractionHelper.get(('clientProspect'))),
        associatedIndex :{[key: string]: number}= {};
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      let resultTemplate = new Array(axe.length).fill(0);

      if (target && this.targetP2cd > 0){
        resultTemplate[associatedIndex["Potentiel ciblé"]] = 1;
        return resultTemplate; // Peut-être qu'il faut que le potentiel soit > 10% pour le rajouter...
      }
      if (this.sales.length === 0){
        resultTemplate[associatedIndex["Non documenté"]] = 1;
        return resultTemplate;
      }
      let totalP2cd = 0,
        siniatId = DataExtractionHelper.INDUSTRIE_SINIAT_ID,
        clientProspectLimit = DataExtractionHelper.get('paramsCompute')['clientProspectLimit'],
        siniatP2cd = 0;
      for (let sale of this.sales){
        if (sale.type == 'p2cd'){
          totalP2cd += sale.volume;
          if (sale.industryId == siniatId) siniatP2cd += sale.volume;
        }
      }
      if (siniatP2cd > clientProspectLimit * totalP2cd){
        resultTemplate[associatedIndex["Client"]] = 1;
        return resultTemplate;
      }
      resultTemplate[associatedIndex["Prospect"]] = 1;
      return resultTemplate;
    } else return 1;
  }

  private computeIndustries(target:boolean, relevantSales:Sale[]){
    let keys = target ? Object.keys(DataExtractionHelper.get('industrieTarget')): Object.keys(DataExtractionHelper.get('industrie'));
    let idIndustries: {[key:number]: any} = {}, diced = new Array(keys.length).fill(0);
    keys.forEach((id, index) => idIndustries[parseInt(id)] = index);
    for (let sale of relevantSales)
      diced[idIndustries[sale.industryId]] += sale.volume;    
    if (target && this.targetP2cd > 0){
      let siniatId = DataExtractionHelper.INDUSTRIE_SINIAT_ID,
        sumExceptSiniat = 0;
      for (let i = 0; i < diced.length; i++)
        if (i !== idIndustries[siniatId]) sumExceptSiniat += diced[i];
      // peut-être que ça mériterait d'être plus générique car ici on suppose que 'Potentiel' a été rajouté avec l'id 0
      diced[idIndustries[0]] = this.targetP2cd; // j'ai fait comme si target p2cd était ce que l'on compte vendre en plus, si c'est ce que l'on compte vendre au total il faudra enlever ce que l'on vend déjà
      for (let i = 0; i < diced.length; i++)
        if ((i !== idIndustries[siniatId]) && (i !== idIndustries[0])) diced[i] *= 1 - this.targetP2cd / sumExceptSiniat;
    }  
    return diced;
  }

  private computeEnduit(target:boolean, relevantSales:Sale[], total:number){
    let axe : string[]= (target) ? Object.values(DataExtractionHelper.get(('enduitIndustrieTarget'))): Object.values(DataExtractionHelper.get(('enduitIndustrie'))),
      associatedIndex :{[key: string]: number}= {};
    for (let i = 0; i < axe.length; i++)
      associatedIndex[axe[i]] = i;

    let pregyId = DataExtractionHelper.INDUSTRIE_PREGY_ID,
      salsiId = DataExtractionHelper.INDUSTRIE_SALSI_ID,
      totalEnduit = DataExtractionHelper.get('paramsCompute')['theoricalRatioEnduit'] * total,
      diced = (target) ? new Array(6).fill(0): new Array(4).fill(0);
    let growthConquestLimit = DataExtractionHelper.get('paramsCompute')['growthConquestLimit'] * totalEnduit;
    for (let sale of relevantSales){
      if (sale.industryId == pregyId) diced[associatedIndex["Pregy"]] += sale.volume;
      else if (sale.industryId == salsiId) diced[associatedIndex["Salsi"]] += sale.volume;    
    }
    let salsiPlusPregy = diced[associatedIndex["Pregy"]] + diced[associatedIndex["Salsi"]];
    let other = Math.max(totalEnduit - salsiPlusPregy, 0)
    if (salsiPlusPregy > growthConquestLimit){
      if (target && this.targetFinition) diced[associatedIndex["Cible Croissance"]] = other;
      else diced[associatedIndex["Croissance"]] = other; 
    }
    else{
      if (target && this.targetFinition) diced[associatedIndex["Cible Conquête"]] = other;
      else diced[associatedIndex["Conquête"]] = other;
    }
    return diced;
  }

  static findById(id: number): PDV | undefined {
    return this.instances.get(id);
  }

  static fillUpTable(dataWidget: DataWidget, axis1:string, axis2:string, indicator:string, pdvs: PDV[], addConditions:[string, number[]][]): void{
    let newPdvs = PDV.reSlice(pdvs, addConditions);
    if (axis1 == 'suiviAD' || axis2 == 'suiviAD' || axis1 == 'histo&curve') dataWidget.fillWithRandomValues(); // a enlever quand on enlèra le mock des visites
    else {
      let irregular: string = 'no';
      if (nonRegularAxis.includes(axis1)) irregular = 'line';
      else if (nonRegularAxis.includes(axis2)) irregular = 'col';
      let byIndustries, enduit, clientProspect, target;
      if (irregular == 'line' || irregular == 'col')
          byIndustries = industrieAxis.includes(axis1) || industrieAxis.includes(axis2),
          enduit = enduitAxis.includes(axis1) || enduitAxis.includes(axis2),
          clientProspect = clientProspectAxis.includes(axis1) || clientProspectAxis.includes(axis2),
          target = targetAxis.includes(axis1) || targetAxis.includes(axis2);
      for (let pdv of newPdvs){
        if (pdv.attribute('available') && pdv.attribute('sale')){
          if (irregular == 'no') dataWidget.addOnCase(pdv.attribute(axis1), pdv.attribute(axis2), pdv.getValue(indicator) as number);
          else if (irregular == 'line') dataWidget.addOnColumn(pdv.attribute(axis2), pdv.getValue(indicator, byIndustries, enduit, clientProspect, target) as number[]);
          else if (irregular == 'col') dataWidget.addOnRow(pdv.attribute(axis1), pdv.getValue(indicator, byIndustries, enduit, clientProspect, target) as number[]);
        }
      }
    }
  }

  attribute(name: string){
    return this.values[PDV.index(name)];
  }

  static getData(slice: any, axe1: string, axe2: string, indicator: string, geoTree:boolean, addConditions:[string, number[]][]): DataWidget{
    if (axe2 == 'lg-1') {
      let labelsToLevelName: {[key: string]: string} = {Région: 'drv', Secteur: 'agent'};
      let labels = this.geoTree.attributes['labels'];      
      let currentLevelIndex = (Object.getOwnPropertyNames(slice).length === 0) ? 0: Math.max.apply(null, Object.keys(slice).map(key => labels.indexOf(key)));
      let subLevelLabel = labelsToLevelName[labels[currentLevelIndex + 1]];
      axe2 = subLevelLabel;
    }
    if (axe1 == 'lt-1'){
      let labelsToLevelName: {[key: string]: string} = {Enseigne: "enseigne", Ensemble: "ensemble", 'Sous-Ensemble': "sousEnsemble", PDV: 'site'}; //le PDV: 'site' c'est un fix le temps que jlw rajoute ça dans le back
      let labels = this.tradeTree.attributes['labels'];
      let currentLevelIndex = (Object.getOwnPropertyNames(slice).length === 0) ? 0: Math.max.apply(null, Object.keys(slice).map(key => labels.indexOf(key)));
      let subLevelLabel = labelsToLevelName[labels[currentLevelIndex + 1]];
      axe1 = subLevelLabel;
    }
    let dataAxe1 = DataExtractionHelper.get(axe1);
    let dataAxe2 = DataExtractionHelper.get(axe2);
    let rowsTitles = Object.values(dataAxe1) as string[];
    let columnsTitles = Object.values(dataAxe2) as string[];
    let idToI:any = {}, idToJ:any = {};    
    Object.keys(dataAxe1).forEach((id, index) => idToI[parseInt(id)] = index);
    Object.keys(dataAxe2).forEach((id, index) => idToJ[parseInt(id)] = index);
    let pdvs = PDV.slice(slice, axe1, axe2, rowsTitles, idToI, idToJ, geoTree);
    let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
    this.fillUpTable(dataWidget, axe1, axe2, indicator, pdvs, addConditions);
    return dataWidget;
  }

  static reSlice(pdvs:PDV[], conditions: [string, number[]][]): PDV[]{
    if (conditions.length === 0) return pdvs;
    let newPdvs: PDV[] = [];
    for (let pdv of pdvs){
      if (conditions.map(condition => condition[1].includes(pdv.property(condition[0]))).reduce((acc, bool) => acc && bool, true)) newPdvs.push(pdv);
    }
    return newPdvs;
  }

  //Juste pour le reSlice
  property(propertyName:string){
    if (propertyName == 'clientProspect') return this.clientProspect(true);
    if (propertyName == 'industriel' || propertyName == 'industrie') return this.industriel();
    if (propertyName == 'ciblage') return this.ciblage();
    if (propertyName == 'pointFeuFilter') return (this.attribute('pointFeu'))? 2: 1;
    if (propertyName == 'segmentMarketingFilter') return this.segmentMarketingFilter();
    return this.attribute(propertyName);
  }

  private segmentMarketingFilter(){
    let dictSegment = DataExtractionHelper.get('segmentMarketingFilter'),
      dictAllSegments = DataExtractionHelper.get('segmentMarketing')
    let pdvSegment = this.attribute('segmentMarketing');
    let result = parseInt(DataExtractionHelper.getKeyByValue(dictSegment, dictAllSegments[pdvSegment])!);
    if (Number.isNaN(result)) result = 4;
    return result;
  }

  static countForFilter(pdvs:PDV[]){
    // Peut-être qu'il faudrait relier cette liste à ce que Majed fait
    let listAttributeToTest = ['clientProspect', 'ciblage', 'pointFeuFilter', 'segmentMarketingFilter', 'segmentCommercial', 'industriel', 'enseigne', 'agent', 'dep', 'bassin']
    let dictCounter: {[key:string]: {[key:string]:number}}= {};
    for (let attribute of listAttributeToTest)
      dictCounter[attribute] = {};
    for (let pdv of pdvs){
      for (let attribute of listAttributeToTest){
        if (dictCounter[attribute].hasOwnProperty(pdv.property(attribute))) dictCounter[attribute][pdv.property(attribute)] += 1;
        else dictCounter[attribute][pdv.property(attribute)] = 1;
      }
    }
    return dictCounter
  }

  industriel(){
    let dnIndustries = this.getValue('p2cd', true) as number[],
      industriesDict = DataExtractionHelper.get('industriel'),
      iMax = 0;
    let industriesList = Object.values(DataExtractionHelper.get('industrie'));
    for (let i = 1; i < dnIndustries.length; i++)
      if (dnIndustries[i] > dnIndustries[iMax]) iMax = i;
    let result = parseInt(DataExtractionHelper.getKeyByValue(industriesDict, industriesList[iMax])!);
    if (Number.isNaN(result)) result = 4;
    return result;
  }

  ciblage(){
    return (this.targetP2cd > 0 && this.getLightTarget() !== 'r') ? 2: 1;
  }

  //La fonction est appelée une fois par widget, ça pourrait peut-être être optimisé tous les widgets d'un dashboard ont le même slice
  static slice(sliceDict: {[key: string]: number}, axe1:string, axe2:string, rowsTitles:string[], idToI: {[key:number]: number}, idToJ: {[key:number]: number}, geoTree:boolean): PDV[]{
    let pdvs: PDV[] = [], childrenOfSlice: any;
    if (sliceDict) {
      [pdvs, childrenOfSlice] = this.sliceTree(sliceDict, geoTree);
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
    return pdvs;
  }

  static hasNodeChildren(node: any): boolean{
    return (node.children.length != 0) && !(node.children[0] instanceof Sale);
  }

  static sliceTree(slice: {[key:string]:number}, geoTree:boolean=true): [PDV[], {[key:string]:any[]}]{
    let tree = geoTree ? this.geoTree : this.tradeTree;    
    let relevantDepth = Math.max.apply(null, Object.keys(slice).map(key => tree.attributes['labels'].indexOf(key)));
    let structure = tree.attributes['labels'];
    let dictChildren: {[key:string]: any} = {};
    structure.slice(relevantDepth).forEach(h =>
      dictChildren[h] = []
    );    
    let pdvs: PDV[] = this.computeSlice(tree, slice, dictChildren);
    delete dictChildren[structure[relevantDepth]];
    return [pdvs, dictChildren];
  }

  static sliceMap(slice: {[key:string]:number}, addConditions:[string, any][]){
    let pdvs = this.sliceTree(slice, true)[0];
    return PDV.reSlice(pdvs, addConditions);
  }

  static computeCiblage(slice: {[key:string]:number}, enduit = false){
    let pdvs = this.sliceTree(slice, true)[0];
    let ciblage = 0;
    if (enduit){
      for (let pdv of pdvs){
        if (pdv.targetFinition) ciblage += pdv.getPotential();
      }
      return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' T.');
    }
    for (let pdv of pdvs){
      let target = pdv.targetP2cd;
      if (isNaN(target)) target = 0;
      ciblage += target;
    }
    return 'Ciblage: '.concat(Math.round(ciblage/1000).toString(), ' km².');
  }

  getPotential(){
      let p2cdSalesRaw = this.displayIndustrieSaleVolumes();
      let siniatSale = p2cdSalesRaw['Siniat'];
      let totalSale = Object.entries(p2cdSalesRaw).filter(([industry, value]) => {!['Siniat', 'Placo', 'Knauf'].includes(industry)})
      .reduce((total: number, [industry, value]: [string, number]) => total + value, 0)
      let enduitSalesRaw = this.displayIndustrieSaleVolumes(true);
      let pregySale = enduitSalesRaw['Pregy'];
      let salsiSale = enduitSalesRaw['Salsi'];
      return Math.max(siniatSale > 0.1*totalSale ? (0.36*siniatSale) - salsiSale - pregySale : (0.36*totalSale) - salsiSale - pregySale, 0);
  }

  static heightOf(tree: Tree, label: string){
    return tree.attributes['labels'].indexOf(label);
  }

  static getLeaves(tree: Tree, node: Node | PDV, height: number, dictChildren: {[key:string]:any[]}): PDV[]{
    if ( node instanceof PDV ) return [node];
    let structure = tree.attributes['labels'];
    dictChildren[structure[height]].push([node.id, node.name]);
    return node.children.map((child: any) => this.getLeaves(tree, child, height+1, dictChildren)).reduce((a: PDV[], b: PDV[]) => a.concat(b), []);
  }

  static computeSlice(tree:Tree, slice: {[key:string]:number}, dictChildren: {}): PDV[]{
    //verify if slice is correct
    let keys: string[] = Object.keys(slice).sort((u, v) => this.heightOf(tree, u) - this.heightOf(tree, v)), connectedNodes;
    if (keys.length === 0)
      connectedNodes = [tree.root];
    else
      connectedNodes = tree.getNodesAtHeight(this.heightOf(tree, keys[0])).filter(node => node.id == slice[keys[0]]);
    for ( let i = 1; i < keys.length; i++ )  {
      connectedNodes = connectedNodes.map((node: Node) =>
        (node.children as Node[]).filter((child: Node) => child.id == slice[keys[i]])
      ).flat();
    }
    //incorrect slice
    if (!connectedNodes.length) return [];
    let pdvs = connectedNodes.map(node => this.getLeaves(tree, node, node.height, dictChildren)).flat();
    return pdvs;
  }

  clientProspect(index=false){
    let dnResult = this.getValue('dn', false, false, true) as number[],
      clientProspectDict = DataExtractionHelper.get('clientProspect');
    let clientProspectAxis = Object.values(clientProspectDict);
    for (let i = 0; i < dnResult.length; i++)
      if (dnResult[i] === 1){
        let result = (index) ? parseInt(DataExtractionHelper.getKeyByValue(clientProspectDict, clientProspectAxis[i])!): clientProspectAxis[i];
        return result;
      }
  }

  displayIndustrieSaleVolumes(enduit = false){
    if (enduit){
      let industriesSalevolume = this.getValue('enduit', true) as number[],
      dictResult:{[key:string]:number} = {},
      pregyId = DataExtractionHelper.INDUSTRIE_PREGY_ID,
      salsiId = DataExtractionHelper.INDUSTRIE_SALSI_ID,
      industrieAxis = DataExtractionHelper.get('industrie'),
      listIndustries = Object.values(industrieAxis);
    dictResult['Autres'] = 0;
    for (let i = 0; i < industriesSalevolume.length; i++){
      if (listIndustries[i] == industrieAxis[pregyId]) dictResult[industrieAxis[pregyId]] = industriesSalevolume[i];
      else if (listIndustries[i] == industrieAxis[salsiId]) dictResult[industrieAxis[salsiId]] = industriesSalevolume[i];
      else dictResult['Autres'] += industriesSalevolume[i];
    }
    return dictResult;
    }
    let industriesSalevolume = this.getValue('p2cd', true) as number[],
      dictResult:{[key:string]:number} = {},
      siniatId = DataExtractionHelper.INDUSTRIE_SINIAT_ID,
      knaufId = DataExtractionHelper.INDUSTRIE_KNAUF_ID,
      placoId = DataExtractionHelper.INDUSTRIE_PLACO_ID,
      industrieAxis = DataExtractionHelper.get('industrie'),
      listIndustries = Object.values(industrieAxis);
    dictResult['Autres'] = 0;
    for (let i = 0; i < industriesSalevolume.length; i++){
      if (listIndustries[i] == industrieAxis[siniatId]) dictResult[industrieAxis[siniatId]] = industriesSalevolume[i];
      else if (listIndustries[i] == industrieAxis[knaufId]) dictResult[industrieAxis[knaufId]] = industriesSalevolume[i];
      else if (listIndustries[i] == industrieAxis[placoId]) dictResult[industrieAxis[placoId]] = industriesSalevolume[i];
      else dictResult['Autres'] += industriesSalevolume[i];
    }
    return dictResult;
  }


  getVolumeTarget() : number{
    let target = this.attribute('target');
    if (target == undefined) return 0;
    return target[DataExtractionHelper.TARGET_VOLUME_ID]
  }

  getLightTarget(){
    let target = this.attribute('target');
    if (target == undefined) return "";
    return target[DataExtractionHelper.TARGET_LIGHT_ID]
  }

  getCommentTarget(){
    let target = this.attribute('target');
    if (target == undefined) return "";
    return target[DataExtractionHelper.TARGET_COMMENT_ID]
  }
};


@Injectable()
class SliceDice{
  geoTree: boolean = true;
  private updateTargetName?: string;
  constructor(private dataService: DataService){console.log('[SliceDice]: on');}

  getWidgetData(slice:any, axis1:string, axis2:string, indicator:string, groupsAxis1:(number|string[]), groupsAxis2:(number|string[]), 
      percent:string, transpose=false, target=false, addConditions:[string, number[]][] = []){
    let colors: undefined;
    if (typeof(groupsAxis1) === 'number'){
      let labelsIds = DataExtractionHelper.get("axisForGraph")[groupsAxis1][DataExtractionHelper.AXISFORGRAHP_LABELS_ID];
       groupsAxis1 = labelsIds.map((labelId:number) => DataExtractionHelper.get("labelForGraph")[labelId][DataExtractionHelper.LABELFORGRAPH_LABEL_ID]);
       colors = labelsIds.map((labelId:number) => DataExtractionHelper.get("labelForGraph")[labelId][DataExtractionHelper.LABELFORGRAPH_COLOR_ID]);
    }
    if (typeof(groupsAxis2) === 'number'){
      let labelsIds = DataExtractionHelper.get("axisForGraph")[groupsAxis2][DataExtractionHelper.AXISFORGRAHP_LABELS_ID];
       groupsAxis2 = labelsIds.map((labelId:number) => DataExtractionHelper.get("labelForGraph")[labelId][DataExtractionHelper.LABELFORGRAPH_LABEL_ID]);
       colors = labelsIds.map((labelId:number) => DataExtractionHelper.get("labelForGraph")[labelId][DataExtractionHelper.LABELFORGRAPH_COLOR_ID]);
    }
    let dataWidget = PDV.getData(slice, axis1, axis2, indicator.toLowerCase(), this.geoTree, addConditions);
    let km2 = (indicator !== 'dn') ? true : false;
    dataWidget.basicTreatement(km2);
    dataWidget.groupData(groupsAxis1 as string[], groupsAxis2 as string[], true);
    let sum = dataWidget.getSum();
    if (percent == 'classic') dataWidget.percent(); else if (percent == 'cols') dataWidget.percent(true);
    let rodPosition = undefined;
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let targetName:string;
      if (indicator == 'dn' && finition) targetName = "dnFinition";
      else if (indicator == 'dn') targetName = "dnP2CD";
      else if (finition) targetName = "volFinition";
      else targetName = "volP2CD";
      if(typeof(sum) == 'number'){
        let targetValue:number;      
        if (Object.keys(slice).length == 0) targetValue = DataExtractionHelper.getTarget("", 0, targetName);
        else{
          let listSlice = Object.entries(slice) as [string, number][];
          let relevantLevel: [string, number] = listSlice[listSlice.length - 1]; //On considère que le dernier niveau est en dernier
          targetValue = DataExtractionHelper.getTarget(relevantLevel[0], relevantLevel[1], targetName);
        }
        rodPosition = 2 * Math.PI * targetValue / sum;
      } else{
        rodPosition = new Array(dataWidget.columnsTitles.length).fill(0);
        let agentIds = new Array(dataWidget.columnsTitles.length).fill(0);
        for (let [id, j] of Object.entries(dataWidget.idToJ)) if (j !== undefined) agentIds[j] = id;
        let targetValues = DataExtractionHelper.getListTarget(agentIds, targetName);
        for (let i = 0; i < targetValues.length; i++) rodPosition[i] = targetValues[i] / sum[i];
      }
      this.updateTargetName = targetName;
    }
    if (typeof(sum) !== 'number') sum = 0;
    return {data: dataWidget.formatWidget(transpose), sum: sum, target: rodPosition, colors: colors, updateTargetName: this.updateTargetName};
  }

  getIndustriesReverseDict(){
    let industriesReverseDict:{[key:string]:string} = {};
    for (let [industrieId, industrieName] of Object.entries(DataExtractionHelper.get('industrie')))
      industriesReverseDict[industrieName as string] = industrieId;
    return industriesReverseDict;
  }

  // pathId(path: any) {
  //   let structure = (this.geoTree ? PDV.geoTree : PDV.tradeTree).attributes['labels'],
  //     maxHeight = structure.length,
  //     acc = 0;
  
  //   for ( let i = 0; i < maxHeight; i++ )
  //     acc += (path[structure[i]] || 0) * Math.pow(10, 3*i);
    
  //   return acc + (this.geoTree ? 0 : 1);
  // }

  updateTargetLevelDrv(id: number, value: number, updateTargetName: string) {
    let newTargetLevelDrv: number[] = DataExtractionHelper.get('targetLevelDrv')[Object.keys(DataExtractionHelper.get('drv'))[id]]
    console.log("targetLevelDrv : ", newTargetLevelDrv, " DataExtractionHelper.get('structureTargetLevelDrv') : ", DataExtractionHelper.get('structureTargetLevelDrv'), "this.updateTargetName : ", updateTargetName, "DataExtractionHelper.get('structureTargetLevelDrv').indexOf(this.updateTargetName) : ", DataExtractionHelper.get('structureTargetLevelDrv').indexOf(updateTargetName))
    newTargetLevelDrv[+DataExtractionHelper.get('structureTargetLevelDrv').indexOf(updateTargetName)] = +value;
    this.dataService.updateTargetLevelDrv(newTargetLevelDrv, +Object.keys(DataExtractionHelper.get('drv'))[id]);
  }
};

function loadAll(){
  PDV.load(true);
}

function getGeoTree() {
  if ( !PDV.geoTree )
    PDV.load(true);
  return PDV.geoTree;
};

function getTradeTree() {
  if ( !PDV.tradeTree )
    PDV.load(true);
  return PDV.tradeTree;
};

export {SliceDice, loadAll, getGeoTree, getTradeTree};