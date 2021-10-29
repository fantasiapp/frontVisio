import DEH, {NavigationExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import {Injectable} from '@angular/core';
import {Tree, Node} from './Node';
import { DataService, UpdateFields } from '../services/data.service';


// à mettre dans le back
const nonRegularAxis = ['industry', 'enduitIndustry', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 
    'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'enduitIndustryTarget', 'industryTarget', 'suiviAD'],
  targetAxis = ['clientProspectTarget', 'segmentDnEnduitTarget', 'enduitIndustryTarget', 'industryTarget'],
  enduitAxis = ['enduitIndustry', 'segmentDnEnduit', 'segmentDnEnduitTarget', 'enduitIndustryTarget'],
  industryAxis = ['industry', 'industryTarget'],
  clientProspectAxis = ['clientProspect', 'clientProspectTarget'],
  visitAxis = ['segmentDnEnduitTargetVisits'],
  adAxis = ['suiviAD'],
  gaugesAxis = ['visits', 'targetedVisits', 'avancementAD'],
  rodAfterFirstCategAxis = ['industryTarget', 'clientProspectTarget'],
  rodAfterSecondCategAxis = ['enduitIndustryTarget'];

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
    } else this.data = newData;
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
  
  basicTreatement(km2 = false, sortLines=true, removeNullColumns:boolean=true){
    if (km2) this.m2ToKm2();
    if (removeNullColumns) this.removeZeros() ; else this.removeNullLine();
    if (sortLines) this.sortLines();
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
    let sortedCoupleList = coupleList.sort(
      (couple1: [string, number[]], couple2: [string, number[]]) => sortCoupleListFunct(couple2) - sortCoupleListFunct(couple1));
    this.rowsTitles = sortedCoupleList.map((couple: [string, number[]]) => couple[0]);
    this.data = sortedCoupleList.map((couple: [string, number[]]) => couple[1]);
  }

  private removeNullLine(){
    let n = this.rowsTitles.length,
      m = this.columnsTitles.length,
      newData: number[][] = [],
      realLinesIndexes: number[] = [];
    for (let i = 0; i < n; i++){
      let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value === 0), true);
      if (lineNull) this.idToI[DataWidget.findKeyByValue(this.idToI, i) as number] = undefined;
      if (!lineNull) {
        newData.push(this.data[i]); 
        realLinesIndexes.push(i);
      }       
    }
    for (let [id, i] of Object.entries(this.idToI)) if (i != undefined) this.idToI[+id] = realLinesIndexes.indexOf(i);
    this.data = newData;
    this.rowsTitles = realLinesIndexes.map(index => this.rowsTitles[index]);
  }

  static findKeyByValue(dict:{[key:number]: number|undefined}, searchValue:number): number|undefined{
    for (let [key, value] of Object.entries(dict)) if (value == searchValue) return +key;
    return undefined;
  }
  
  private removeZeros(){
    let n = this.rowsTitles.length,
      m = this.columnsTitles.length,
      newData: number[][] = [],
      realLinesIndexes: number[] = [],
      realColumnsIndexes: number[] = [];
    for (let i = 0; i < n; i++){
      let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value === 0), true);
      if (lineNull) this.idToI[DataWidget.findKeyByValue(this.idToI, i) as number] = undefined;
      if (!lineNull) realLinesIndexes.push(i);        
    }
    for (let _ in realLinesIndexes) newData.push([]);
    for (let j = 0; j < m; j++){
      let colNull = this.data.reduce((acc: boolean, line: number[]) => acc && (line[j] === 0), true);
      if (colNull) this.idToJ[DataWidget.findKeyByValue(this.idToJ, j) as number] = undefined;
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

  // à enlever dans la version finale
  getData(){
    return this.data;
  }

  completeWithCurveForHistoCurve(nbPdvs:number){
    let nbPdvsCompletedInPercent = 0;
    for (let j = 0; j < this.columnsTitles.length; j++){
      nbPdvsCompletedInPercent += (this.data[0][j] / nbPdvs) * 100;
      this.data[1][j] = nbPdvsCompletedInPercent;
    }
  }

  getTargetStartingPoint(axis:string){
    if (rodAfterFirstCategAxis.includes(axis)) return this.data[0];  
    if (rodAfterSecondCategAxis.includes(axis)){
      if (this.dim == 1) return this.data[0] + this.data[1];
      let startingPoints = new Array(this.columnsTitles.length).fill(0);
      for(let j = 0; j < this.columnsTitles.length; j++) startingPoints[j] = this.data[0][j] + this.data[1][j];
      return startingPoints
    }       
  }

  numberToBool(){
    let boolMatrix = this.data.map((line:number[]) => line.map(value => value > 0).slice(0, line.length - 1));
    let firstLine: boolean[] = [];
    for (let j = 0; j < this.columnsTitles.length; j++) 
      firstLine.push(boolMatrix.map((line:Boolean[]) => line[j]).reduce((acc: boolean, value:boolean) => acc || value, false));
    firstLine.pop();
    let extendedBoolMatrix: boolean[][] = [[firstLine.reduce((acc: boolean, value:boolean) => acc || value, false)].concat(firstLine)];
    for (let i = 0; i < this.rowsTitles.length; i++)
      extendedBoolMatrix.push([boolMatrix[i].reduce((acc: boolean, value:boolean) => acc || value, false)].concat(boolMatrix[i]));
    let lineIds = new Array(this.columnsTitles.length).fill(0),
      columnsIds = new Array(this.columnsTitles.length).fill(0);
    let industriesDict = DEH.get('enseigne')
    lineIds = this.rowsTitles.map(title => DEH.getKeyByValue(industriesDict, title)); // ) changer quand le idToJ sera à jour
    for (let [id, j] of Object.entries(this.idToJ)) if (j !== undefined) columnsIds[j] = id;   
    return {boolMatrix: extendedBoolMatrix,
      enseigneIndexes: lineIds,
      segmentMarketingIndexes: columnsIds
    }
  }
}

class Sale {
  public date: Date|null;

  constructor(private data: any[]){
    let dataDate = this.data[DEH.SALES_DATE_ID]
    this.date = dataDate ? new Date(dataDate): null;
  };

  get type(): string{return (this.productId < 4) ? 'p2cd' : ((this.productId == 4) ? 'enduit' : 'other');}
  get industryId() {return this.data[DEH.SALE_INDUSTRY_ID];}
  get productId() {return this.data[DEH.SALE_PRODUCT_ID];}
  get volume() {return this.data[DEH.SALE_VOLUME_ID];}
};

export class PDV{
  private static instances: Map<number, PDV> = new Map<number, PDV>();
  static geoTree: Tree;
  static tradeTree: Tree;
  private static indexMapping: Map<string, number>;

  get targetP2cd(){
    let target = this.attribute('target');
    if (!target) return 0;
    return target[DEH.TARGET_VOLUME_ID]
  }

  get targetFinition(){
    let target = this.attribute('target');
    if (!target) return false;
    return target[DEH.TARGET_FINITIONS_ID]
  }

  static getInstances(): Map<number, PDV> {
    if (!this.instances)
      this.load(false);
    return this.instances;
  }

  // Il faudra penser à delete la requête de la ram après l'avoir utilisée
  static load(loadTrees = true){
    this.instances.clear(); //<- clear before
    this.createIndexMapping();
    for (let [id, data] of Object.entries(DEH.get('pdvs'))){
      let intId = parseInt(id);
      if (Number.isNaN(intId)) continue;
      this.instances.set(intId, new PDV(intId, <any[]>data));
    }
    if (loadTrees) this.loadTrees();
  };

  private static createIndexMapping(){
    const fields = DEH.get('structurePdvs') as string[];
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

  static getProducts() {
    return Object.values(DEH.get('product'));
  }
  
  readonly sales: Sale[];
  constructor(readonly id: number, private values: any[]){
    this.sales = [];
    for (let d of this.attribute('sales'))
      this.sales.push(new Sale(d));
  };

  public getValues() {return this.values;}
  public setValues(newValues: any[]) {this.values = Object.assign([], newValues);}

  public getValue(indicator: string, byIndustries=false, enduit=false, clientProspect=false, 
      target=false, visit=false, ad=false): (number | number[]){
    if (visit) return this.computeVisits(indicator);
    if (indicator == 'dn') return this.computeDn(enduit, clientProspect, target, ad);
    let relevantSales = this.sales.filter(sale => sale.type == indicator);
    // pas opti de le calculer 2 fois quand l'indicator c'est p2cd
    let p2cdSales = this.sales.filter(sale => sale.type == 'p2cd');
    if (byIndustries) return this.computeIndustries(target, relevantSales);      
    let total = p2cdSales.reduce((acc, sale) => acc + sale.volume, 0);
    if (enduit) return this.computeEnduit(target, relevantSales, total);
    return total;
  }

  //Assez sale pour le moment, il faut factoriser avec le code d'en dessous après
  private computeVisits(indicator:string){
    let axe : string[]= Object.values(DEH.get('segmentDnEnduitTargetVisits')),
      associatedIndex :{[key: string]: number}= {};
    for (let i = 0; i < axe.length; i++)
      associatedIndex[axe[i]] = i;
    let pregyId = DEH.INDUSTRIE_PREGY_ID,
      salsiId = DEH.INDUSTRIE_SALSI_ID,
      siniatId = DEH.INDUSTRIE_SINIAT_ID,
      visitsRepartition = new Array(6).fill(0),
      totalP2cd = 0, totalSiniatP2cd = 0, totalEnduit = 0;
    for (let sale of this.sales){
      if ((sale.industryId == pregyId || sale.industryId == salsiId) && sale.type == 'enduit') totalEnduit += sale.volume;
      else if (sale.type == 'p2cd'){
        totalP2cd += sale.volume;
        if (sale.industryId == siniatId) totalSiniatP2cd += sale.volume;
      }
    }
    let saleP2cd = totalSiniatP2cd > DEH.get("params")["ratioCustomerProspect"] * totalP2cd,
      saleEnduit = totalEnduit > 0,
      toAdd = (indicator == 'visits') ? this.attribute("nbVisits") : 
        this.attribute("nbVisits") * Math.max(totalP2cd * DEH.get("params")["ratioPlaqueFinition"], totalEnduit); 
        // Ca c'est le calcul du volume d'enduit qu'il faudra peut-être aller chercher chez baptiste à l'avenir
    if (saleP2cd && saleEnduit){
      if (this.targetFinition) visitsRepartition[associatedIndex["Cible P2CD + Enduit"]] = toAdd;
      else visitsRepartition[associatedIndex["P2CD + Enduit"]] = toAdd;
    }
    else if (saleEnduit){
      if (this.targetFinition) visitsRepartition[associatedIndex["Cible Enduit hors P2CD"]] = toAdd;
      else visitsRepartition[associatedIndex["Enduit hors P2CD"]] = toAdd;
    } else{
      if (this.targetFinition) visitsRepartition[associatedIndex["Cible Pur Prospect"]] = toAdd;
      else visitsRepartition[associatedIndex["Pur prospect"]] = toAdd;
    }
    return visitsRepartition
  }

  private computeDn(enduit:boolean, clientProspect:boolean, target:boolean, ad:boolean){
    if (ad){
      let axe : string[]= Object.values(DEH.get("suiviAD")),
        associatedIndex :{[key: string]: number}= {},
        dnAd = new Array(axe.length).fill(0);
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      if (this.adCompleted()) dnAd[associatedIndex["Terminées"]] = 1;
      else if (this.hasNonSiniatSale()) dnAd[associatedIndex["Non mises à jour"]] = 1;
      else dnAd[associatedIndex["Non renseignées"]] = 1;
      return dnAd;
    }
    if (enduit){
      let axe : string[]= (target) ? Object.values(DEH.get('segmentDnEnduitTarget')): 
          Object.values(DEH.get('segmentDnEnduit')),
        associatedIndex :{[key: string]: number}= {};
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      let pregyId = DEH.INDUSTRIE_PREGY_ID,
        salsiId = DEH.INDUSTRIE_SALSI_ID,
        siniatId = DEH.INDUSTRIE_SINIAT_ID,
        dnEnduit = new Array(axe.length).fill(0),
        totalP2cd = 0, totalSales = 0,
        totalSiniatP2cd = 0,
        saleEnduit = false;
      if (this.sales.length == 0 || !this.attribute("redistributedFinitions") || !this.attribute("redistributed")) dnEnduit[associatedIndex["Non documenté"]] = 1;
      else {
        for (let sale of this.sales){
          totalSales += sale.volume;
          if ((sale.industryId == pregyId || sale.industryId == salsiId) && sale.type == 'enduit' && sale.volume > 0) 
            saleEnduit = true;
          else if (sale.type == 'p2cd'){
            totalP2cd += sale.volume;
            if (sale.industryId == siniatId) totalSiniatP2cd += sale.volume;
          }
        }
        let saleP2cd = totalSiniatP2cd > DEH.get("params")["ratioCustomerProspect"] * totalP2cd;
        if (totalSiniatP2cd == totalSales && !this.attribute("onlySiniat")) dnEnduit[associatedIndex["Non documenté"]] = 1;
        else if (saleP2cd && saleEnduit) dnEnduit[associatedIndex["P2CD + Enduit"]] = 1;
        else if (saleEnduit){
          if (target && this.targetFinition) dnEnduit[associatedIndex["Cible P2CD"]] = 1;
          else dnEnduit[associatedIndex["Enduit hors P2CD"]] = 1;
        } else{
          if (target && this.targetFinition) dnEnduit[associatedIndex["Cible Pur Prospect"]] = 1;
          else dnEnduit[associatedIndex["Pur prospect"]] = 1;
        }
      }
      return dnEnduit
    } else if (clientProspect){
      let axe : string[]= (target) ? Object.values(DEH.get(('clientProspectTarget'))): 
          Object.values(DEH.get(('clientProspect'))),
        associatedIndex :{[key: string]: number}= {};
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      let resultTemplate = new Array(axe.length).fill(0);
      if (target && this.targetP2cd > 0 && this.getLightTarget() !== 'r'){
        resultTemplate[associatedIndex["Potentiel ciblé"]] = 1;
        return resultTemplate; // Peut-être qu'il faut que le potentiel soit > 10% pour le rajouter...
      }
      let totalP2cd = 0,
      siniatId = DEH.INDUSTRIE_SINIAT_ID,
      clientProspectLimit = DEH.getParam('ratioCustomerProspect'),
      siniatP2cd = 0;
      for (let sale of this.sales)
        if (sale.type == 'p2cd'){
          totalP2cd += sale.volume;
          if (sale.industryId == siniatId) siniatP2cd += sale.volume;
        }
      if (totalP2cd === 0){
        resultTemplate[associatedIndex["Non documenté"]] = 1;
        return resultTemplate;
      }
      if (siniatP2cd > 0.09 * totalP2cd){
        resultTemplate[associatedIndex["Client"]] = 1;
        return resultTemplate;
      }
      resultTemplate[associatedIndex["Prospect"]] = 1;
      return resultTemplate;
    } else return 1;
  }

  private computeIndustries(target:boolean, relevantSales:Sale[]){
    let keys = target ? Object.keys(DEH.get('industryTarget')): Object.keys(DEH.get('industry'));
    let idIndustries: {[key:number]: any} = {}, diced = new Array(keys.length).fill(0);
    keys.forEach((id, index) => idIndustries[parseInt(id)] = index);
    for (let sale of relevantSales)
      diced[idIndustries[sale.industryId]] += sale.volume;    
    if (target && this.targetP2cd > 0 && this.getLightTarget() !== 'r'){
      let siniatId = DEH.INDUSTRIE_SINIAT_ID,
        sumExceptSiniat = 0;
      for (let i = 0; i < diced.length; i++)
        if (i !== idIndustries[siniatId]) sumExceptSiniat += diced[i];
      // peut-être que ça mériterait d'être plus générique car ici on suppose que 'Potentiel' a été rajouté avec l'id 0
      // j'ai fait comme si target p2cd était ce que l'on compte vendre en plus, 
      // si c'est ce que l'on compte vendre au total il faudra enlever ce que l'on vend déjà
      diced[idIndustries[0]] = this.targetP2cd; 
      for (let i = 0; i < diced.length; i++)
        if ((i !== idIndustries[siniatId]) && (i !== idIndustries[0])) diced[i] *= 1 - this.targetP2cd / sumExceptSiniat;
    }  
    return diced;
  }

  private computeEnduit(target:boolean, relevantSales:Sale[], total:number){
    let axe : string[]= (target) ? Object.values(DEH.get(('enduitIndustryTarget'))): 
        Object.values(DEH.get(('enduitIndustry'))),
      associatedIndex :{[key: string]: number}= {};
    for (let i = 0; i < axe.length; i++)
      associatedIndex[axe[i]] = i;
    let pregyId = DEH.INDUSTRIE_PREGY_ID,
      salsiId = DEH.INDUSTRIE_SALSI_ID,
      totalEnduit = DEH.getParam("ratioPlaqueFinition") * total,
      diced = (target) ? new Array(6).fill(0): new Array(4).fill(0);
    for (let sale of relevantSales){
      if (sale.industryId == pregyId) diced[associatedIndex["Prégy"]] += sale.volume;
      else if (sale.industryId == salsiId) diced[associatedIndex["Salsi"]] += sale.volume;    
    }
    let salsiPlusPregy = diced[associatedIndex["Prégy"]] + diced[associatedIndex["Salsi"]];
    let other = Math.max(totalEnduit - salsiPlusPregy, 0);
    let dnEnduit = this.getValue('dn', false, true) as number[];
    // if (this.clientProspect() == 'Client'){
    if (dnEnduit[1] == 1){
      if (target && this.targetFinition) diced[associatedIndex["Cible Croissance"]] = other;
      else diced[associatedIndex["Croissance"]] = other; 
    }
    else if (dnEnduit[2] == 1){
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

  static filterPdvs(pdvs:PDV[]){
    return pdvs.filter(pdv => pdv.attribute('available') && pdv.attribute('sale'));
  }

  static fillUpTable(dataWidget: DataWidget, axis1:string, axis2:string, indicator:string, 
      pdvs: PDV[], addConditions:[string, number[]][]): void{
    let newPdvs = PDV.reSlice(pdvs, addConditions);
    if (axis1 == 'histo&curve'){
      PDV.fillFirstLineOfHistoCurve(dataWidget, pdvs);
      dataWidget.completeWithCurveForHistoCurve(newPdvs.length);
    }
    else {
      let irregular: string = 'no';
      if (nonRegularAxis.includes(axis1)) irregular = 'line';
      else if (nonRegularAxis.includes(axis2)) irregular = 'col';
      let byIndustries, enduit, clientProspect, target, visit, ad;
      if (irregular == 'line' || irregular == 'col')
          byIndustries = industryAxis.includes(axis1) || industryAxis.includes(axis2),
          enduit = enduitAxis.includes(axis1) || enduitAxis.includes(axis2),
          clientProspect = clientProspectAxis.includes(axis1) || clientProspectAxis.includes(axis2),
          target = targetAxis.includes(axis1) || targetAxis.includes(axis2),
          visit = visitAxis.includes(axis1) || visitAxis.includes(axis2),
          ad = adAxis.includes(axis1) || adAxis.includes(axis2);
      for (let pdv of newPdvs){
        if (pdv.attribute('available') && pdv.attribute('sale')){
          if (irregular == 'no') 
            dataWidget.addOnCase(
              pdv.attribute(axis1), pdv.attribute(axis2), pdv.getValue(indicator) as number);
          else if (irregular == 'line') 
            dataWidget.addOnColumn(
              pdv.attribute(axis2), pdv.getValue(indicator, byIndustries, enduit, 
                clientProspect, target, visit, ad) as number[]);
          else if (irregular == 'col') 
            dataWidget.addOnRow(
              pdv.attribute(axis1), pdv.getValue(indicator, byIndustries, enduit, 
                clientProspect, target, visit, ad) as number[]);
        }
      }
    }
  }

  attribute(name: string){
        return this.values[PDV.index(name)];
  }

  static getData(slice: any, axe1: string, axe2: string, indicator: string, 
      geoTree:boolean, addConditions:[string, number[]][]): DataWidget{
    // Ces conditions il va falloir les factoriser à l'avenir
    let labelsToLevelName: {[key: string]: string} = {Région: 'drv', Secteur: 'agent'};
    if (axe2 == 'lgp-1') axe2 = labelsToLevelName[this.geoTree.attributes['labels'][1]]; // lgp is for "level geographique du profil"
    if (axe2 == 'lg-1') { // lg is for "level geographique"
      let labels = this.geoTree.attributes['labels'];      
      let currentLevelIndex = (Object.getOwnPropertyNames(slice).length === 0) ? 0: 
        Math.max.apply(null, Object.keys(slice).map(key => labels.indexOf(key)));
      let subLevelLabel = labelsToLevelName[labels[currentLevelIndex + 1]];
      axe2 = subLevelLabel;
    }
    if (axe1 == 'lt-1'){ // lt is for "level trade"
      let labelsToLevelName: {[key: string]: string} = 
        {Enseigne: "enseigne", Ensemble: "ensemble", 'Sous-Ensemble': "sousEnsemble", PDV: 'site'}; 
        //le PDV: 'site' c'est un fix le temps que jlw rajoute ça dans le back
      let labels = this.tradeTree.attributes['labels'];
      let currentLevelIndex = (Object.getOwnPropertyNames(slice).length === 0) ? 0: 
        Math.max.apply(null, Object.keys(slice).map(key => labels.indexOf(key)));
      let subLevelLabel = labelsToLevelName[labels[currentLevelIndex + 1]];
      axe1 = subLevelLabel;
    }
    let dataAxe1 = DEH.get(axe1, true);
    let dataAxe2 = DEH.get(axe2, true);
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
    for (let pdv of pdvs)
      if (conditions.map(condition => condition[1].includes(pdv.property(condition[0]))).reduce((acc, bool) => acc && bool, true)) 
        newPdvs.push(pdv);
    return newPdvs;
  }

  //Juste pour le reSlice
  property(propertyName:string){
    switch(propertyName){
      case 'clientProspect': return this.clientProspect(true);
      case 'industriel': return this.industriel();
      case 'ciblage': return this.ciblage();
      case 'pointFeuFilter': return this.attribute('pointFeu')? 2: 1;
      case 'visited': return (this.attribute("nbVisits") > 0)? 1: 2;
      case 'segmentMarketingFilter': return this.segmentMarketingFilter();
      case 'typology': return this.typologyFilter();
      default: return this.attribute(propertyName);
    }
  }

  private segmentMarketingFilter(){
    let dictSegment = DEH.get('segmentMarketingFilter'),
      dictAllSegments = DEH.get('segmentMarketing')
    let pdvSegment = this.attribute('segmentMarketing');
    let result = parseInt(DEH.getKeyByValue(dictSegment, dictAllSegments[pdvSegment])!);
    if (Number.isNaN(result)) result = 4;
    return result;
  }

  private typologyFilter():any{
    let dnResult = this.getValue('dn', false, true) as number[],
      typologyIds = Object.keys(DEH.get('segmentDnEnduit'));
    for (let i = 0; i < dnResult.length; i++)
      if (dnResult[i] == 1)
        return parseInt(typologyIds[i]);
  }

  static countForFilter(pdvs:PDV[], attributesToCount:string[]){
    let dictCounter: {[key:string]: {[key:string]:number}} = {};
    for (let attribute of attributesToCount)
      dictCounter[attribute] = {};
    for (let pdv of pdvs)
      for (let attribute of Object.keys(dictCounter)){
        if (dictCounter[attribute].hasOwnProperty(pdv.property(attribute))) 
          dictCounter[attribute][pdv.property(attribute)] += 1;
        else dictCounter[attribute][pdv.property(attribute)] = 1;
      }
    return dictCounter
  }

  industriel(){
    let dnIndustries = this.getValue('p2cd', true) as number[],
      industriesDict = DEH.get('industriel'),
      iMax = 0;
    let industriesList = Object.values(DEH.get('industry'));
    for (let i = 1; i < dnIndustries.length; i++)
      if (dnIndustries[i] > dnIndustries[iMax]) iMax = i;
    let result = parseInt(DEH.getKeyByValue(industriesDict, industriesList[iMax])!);
    if (Number.isNaN(result)) result = 4;
    return result;
  }

  ciblage(){
    return (this.targetP2cd > 0 && this.getLightTarget() !== 'r') ? 2: 1;
  }

  //La fonction est appelée une fois par widget, ça pourrait peut-être être optimisé tous les widgets d'un dashboard ont le même slice
  static slice(sliceDict: {[key: string]: number}, axe1:string, axe2:string, 
      rowsTitles:string[], idToI: {[key:number]: number}, idToJ: {[key:number]: number}, geoTree:boolean): PDV[]{
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
    } else pdvs = [...this.instances.values()];
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
    structure.slice(relevantDepth).forEach(h => dictChildren[h] = []);    
    let pdvs: PDV[] = this.computeSlice(tree, slice, dictChildren);
    delete dictChildren[structure[relevantDepth]];
    return [pdvs, dictChildren];
  }

  static sliceMap(slice: {[key:string]:number}, addConditions:[string, any][], geoTree: boolean = true){
    let pdvs = this.sliceTree(slice, geoTree)[0];
    return PDV.reSlice(pdvs, addConditions);
  }
  
  static ComputeListCiblage(nodes: Node[], dn:boolean){
    return nodes.map(node => dn ? PDV.computeCiblage(node, false, dn): PDV.computeCiblage(node, false, dn)/1000);
  }

  static computeCiblage(node: Node, enduit=false, dn=false): number{
    let pdvs = PDV.childrenOfNode(node), ciblage = 0;
    if (dn && enduit){
      for (let pdv of pdvs) if (pdv.targetFinition) ciblage += 1;
    }
    else if (dn){
      for (let pdv of pdvs){
        let target = pdv.targetP2cd;
        if (isNaN(target) || pdv.getLightTarget() == 'r') target = 0;
        let toAdd = (target > 0) ? 1: 0;
        ciblage += toAdd;
      };
    }
    else if (enduit){
      for (let pdv of pdvs)
        if (pdv.targetFinition) ciblage += Math.max(pdv.getPotential(), 0);
    }
    else {
      for (let pdv of pdvs){
        let target = pdv.targetP2cd;
        if (isNaN(target) || pdv.getLightTarget() == 'r') target = 0;
        ciblage += target;
      };
    }
    return ciblage;
  }

  getPotential(){
    let p2cdSalesRaw = this.displayIndustrieSaleVolumes();
    let siniatSale = p2cdSalesRaw['Siniat'];
    let totalSale = Object.entries(p2cdSalesRaw).reduce(
      (total: number, [_, value]: [string, number]) => total + value, 0)
    let enduitSalesRaw = this.displayIndustrieSaleVolumes(true);
    let pregySale = enduitSalesRaw['Prégy'];
    let salsiSale = enduitSalesRaw['Salsi'];
    return siniatSale > 0.1*totalSale ? (0.36*siniatSale) - salsiSale - pregySale : 
      (0.36*totalSale) - salsiSale - pregySale;
  }

  static heightOf(tree: Tree, label: string){
    return tree.attributes['labels'].indexOf(label);
  }

  static childrenOfNode(node: Node | PDV):PDV[]{
    if ( node instanceof PDV ) return [node];
    return node.children.map(
      (child: any) => this.childrenOfNode(child)).reduce((a: PDV[], b: PDV[]) => a.concat(b), [])
  }

  static getLeaves(tree: Tree, node: Node | PDV, height: number, dictChildren: {[key:string]:any[]}): PDV[]{
    if ( node instanceof PDV ) return [node];
    let structure = tree.attributes['labels'];
    dictChildren[structure[height]].push([node.id, node.name]);
    return node.children.map(
      (child: any) => this.getLeaves(tree, child, height+1, dictChildren)).reduce((a: PDV[], b: PDV[]) => a.concat(b), []);
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
      clientProspectDict = DEH.get('clientProspect');
    let clientProspectAxis = Object.values(clientProspectDict),
      clientProspectIds = Object.keys(clientProspectDict);
    for (let i = 0; i < dnResult.length; i++)
      if (dnResult[i] === 1)
        return (index) ? parseInt(clientProspectIds[i]): clientProspectAxis[i];
  }

  displayIndustrieSaleVolumes(enduit = false){
    if (enduit){
      let industriesSalevolume = this.getValue('enduit', true) as number[],
        totalP2cd = this.getValue('p2cd') as number,
        dictResult:{[key:string]:number} = {},
        pregyId = DEH.INDUSTRIE_PREGY_ID,
        salsiId = DEH.INDUSTRIE_SALSI_ID,
        industrieAxis = DEH.get('industry'),
        listIndustries = Object.values(industrieAxis);
        for (let i = 0; i < industriesSalevolume.length; i++){
          if (listIndustries[i] == industrieAxis[pregyId]) 
            dictResult[industrieAxis[pregyId]] = industriesSalevolume[i];
          else if (listIndustries[i] == industrieAxis[salsiId]) 
            dictResult[industrieAxis[salsiId]] = industriesSalevolume[i];
        }
        dictResult['Autres'] = Math.max(totalP2cd * 0.36 - dictResult[industrieAxis[pregyId]] - dictResult[industrieAxis[salsiId]], 0);
      return dictResult;
    }
    let industriesSalevolume = this.getValue('p2cd', true) as number[],
      dictResult:{[key:string]:number} = {},
      siniatId = DEH.INDUSTRIE_SINIAT_ID,
      knaufId = DEH.INDUSTRIE_KNAUF_ID,
      placoId = DEH.INDUSTRIE_PLACO_ID,
      industrieAxis = DEH.get('industry'),
      listIndustries = Object.values(industrieAxis);
    dictResult['Autres'] = 0;
    for (let i = 0; i < industriesSalevolume.length; i++){
      if (listIndustries[i] == industrieAxis[siniatId]) 
        dictResult[industrieAxis[siniatId]] = industriesSalevolume[i];
      else if (listIndustries[i] == industrieAxis[knaufId]) 
        dictResult[industrieAxis[knaufId]] = industriesSalevolume[i];
      else if (listIndustries[i] == industrieAxis[placoId]) 
        dictResult[industrieAxis[placoId]] = industriesSalevolume[i];
      else dictResult['Autres'] += industriesSalevolume[i];
    }
    return dictResult;
  }

  private getFirstSaleDate(){
    let firstSaleDateInSeconds  = Infinity;
    for (let sale of this.sales)
      if (sale.date !== null && sale.date.getTime() < firstSaleDateInSeconds)
        firstSaleDateInSeconds = sale.date.getTime();
    return firstSaleDateInSeconds;
  }

  private computeWeeksRepartitionAD(){    
    let axe : string[]= Object.values(DEH.get("weeks")),
      dnAd = new Array(axe.length).fill(0);
    if (!this.adCompleted()) return dnAd;
    let associatedIndex :{[key: string]: number}= {};
    for (let i = 0; i < axe.length; i++)
      associatedIndex[axe[i]] = i;
    if (this.attribute("onlySiniat") || !this.attribute("redistributed")){
      dnAd[associatedIndex["avant"]] = 1;
      return dnAd
    }
    let updateDateInSeconds = this.getFirstSaleDate(),
      currentDate = new Date(),
      day = currentDate.getDay() == 0 ? 6: currentDate.getDay() - 1, // car dans timestamp la semaine commence le dimanche
      BeginingOfTheWeek = currentDate.getTime() / 1000 - (currentDate.getSeconds() + 60 * (currentDate.getMinutes() + 60 * (currentDate.getHours() + 24 * day))),
      aWeekInSeconds = 7 * 24 * 60 * 6,
      find = false, i = 0;
    while(!find && i < 7){
      if (updateDateInSeconds > BeginingOfTheWeek - i * aWeekInSeconds){
        dnAd[associatedIndex['s-'.concat(i.toString())]] = 1;
        find = true;
      }
      i++;
    }
    if (!find) dnAd[associatedIndex["avant"]] = 1;
    return dnAd
  }

  private static fillFirstLineOfHistoCurve(widget: DataWidget, pdvs:PDV[]){
    for (let pdv of pdvs)
      widget.addOnRow(1, pdv.computeWeeksRepartitionAD())// Le 1 est harcodé car c'est l'id de "Nombre de PdV complétés", il faudra changer ça
  }

  hasNonSiniatSale(){
    let siniatId = DEH.INDUSTRIE_SINIAT_ID;
    return this.sales.reduce((acc: boolean, sale:Sale) => acc || sale.industryId !== siniatId, false);
  }

  adCompleted(){
    return this.attribute("onlySiniat") || !this.attribute("redistributed") || this.sales.reduce((acc:boolean, sale:Sale) => acc || sale.date !== null, false);
  }
  static computeJauge(slice:any, indicator:string): [[string, number][], number[]]{
    let pdvs = PDV.filterPdvs(PDV.childrenOfNode(DEH.followSlice(slice)));
    switch(indicator){
      case 'visits': {
        let totalVisits: number= 0,
          cibleVisits:number = PDV.computeTargetVisits(slice) as number,
          threshold = [50, 99.99, 100];
        for (let pdv of pdvs) totalVisits += pdv.attribute("nbVisits");
        let adaptedVersion = (totalVisits >= 2) ? ' visites': ' visite';
        return [[[totalVisits.toString().concat(adaptedVersion, ' sur un objectif de ', cibleVisits.toString()), 100 * Math.min(totalVisits / cibleVisits, 1)]], threshold];
      };
      case 'targetedVisits': {
        let totalVisits = 0,
          totalCibleVisits = 0,
          thresholdForGreen = 100 * PDV.computeTargetVisits(slice, true),
          threshold = [thresholdForGreen / 2, thresholdForGreen, 100];
        for (let pdv of pdvs){
          totalVisits += pdv.attribute("nbVisits");
          if (pdv.targetFinition) totalCibleVisits += pdv.attribute("nbVisits");
        }
        let adaptedVersion = (totalCibleVisits >= 2) ? ' visites ciblées': ' visite ciblée';
        return [[[totalCibleVisits.toString().concat(adaptedVersion, ' sur un total de ', totalVisits.toString()), 100 * totalCibleVisits / totalVisits]], threshold];
      };
      case 'avancementAD': {
        let nbCompletedPdv = pdvs.reduce((acc: number, pdv:PDV) => pdv.adCompleted() ? acc + 1: acc, 0),
          ratio = nbCompletedPdv / pdvs.length,
          adaptedVersion = (nbCompletedPdv >= 2) ? ' PdV complétés':  'PdV complété';
        return [[[nbCompletedPdv.toString().concat(adaptedVersion, ' sur un total de ', pdvs.length.toString()), 100 * ratio]], [33, 66, 100]];
       }
      default: return [[['  ', 100 * Math.random()]], [33, 66, 100]];
    }
  }

  static computeTargetVisits(slice:any, threshold=false){
    let relevantNode = DEH.followSlice(slice);
    let finitionAgents:any[] = (relevantNode.label == 'France') ? Object.values(DEH.get("agentFinitions")): 
      ((relevantNode.label == 'Région') ? DEH.findFinitionAgentsOfDrv(relevantNode.id): 
      [DEH.get("agentFinitions")[relevantNode.id]]);
    if (threshold) return (1 / finitionAgents.length) * finitionAgents.reduce(
      (acc, agent) => acc + agent[DEH.AGENTFINITION_RATIO_ID], 0);
    return finitionAgents.reduce(
      (acc, agent) => acc + agent[DEH.AGENTFINITION_TARGETVISITS_ID], 0);
  }

  getVolumeTarget() : number{
    let target = this.attribute('target');
    if (!target) return 0;
    return target[DEH.TARGET_VOLUME_ID]
  }

  getLightTarget(){
    let target = this.attribute('target');
    if (!target) return "";
    return target[DEH.TARGET_LIGHT_ID]
  }

  getCommentTarget(){
    let target = this.attribute('target');
    if (!target) return "";
    return target[DEH.TARGET_COMMENT_ID]
  }
};


@Injectable({providedIn: 'root'})
class SliceDice{
  geoTree: boolean = true;
  private updateTargetName?: string;
  constructor(private dataService: DataService){console.log('[SliceDice]: on');}

  getWidgetData(slice:any, axis1:string, axis2:string, indicator:string, groupsAxis1:(number|string[]), 
      groupsAxis2:(number|string[]), percent:string, transpose=false, target=false, addConditions:[string, number[]][] = []){
    let colors: undefined;
    if ([typeof(groupsAxis1), typeof(groupsAxis2)].includes('number')){
      let groupsAxis = (typeof(groupsAxis1) == 'number') ? groupsAxis1: groupsAxis2;
      let labelsIds = DEH.get("axisForGraph")[+groupsAxis][DEH.AXISFORGRAHP_LABELS_ID];
       groupsAxis = labelsIds.map(
         (labelId:number) => DEH.get("labelForGraph")[labelId][DEH.LABELFORGRAPH_LABEL_ID]);
       colors = labelsIds.map(
         (labelId:number) => DEH.get("labelForGraph")[labelId][DEH.LABELFORGRAPH_COLOR_ID]);
      if (typeof(groupsAxis1) == 'number') groupsAxis1 = groupsAxis; else groupsAxis2 = groupsAxis;
    }
    if (gaugesAxis.includes(axis1)){
      let jauge = PDV.computeJauge(slice, axis1);
      return {data: jauge[0], sum: 0, target: undefined, colors: colors, targetLevel: {}, threshold: jauge[1]};
    }
    let dataWidget = PDV.getData(slice, axis1, axis2, indicator.toLowerCase(), this.geoTree, addConditions);
    let km2 = (!(indicator == 'dn' || indicator == 'visits')) ? true : false,
      sortLines = percent !== 'classic' && axis1 != 'suiviAD';
    dataWidget.basicTreatement(km2, sortLines);
    dataWidget.groupData(groupsAxis1 as string[], groupsAxis2 as string[], true);
    let sum = dataWidget.getSum();
    let targetsStartingPoint = dataWidget.getTargetStartingPoint(axis1);
    if (percent == 'classic') dataWidget.percent(); else if (percent == 'cols') dataWidget.percent(true);
    let rodPosition = undefined, rodPositionForCiblage = undefined,
      targetLevel: {'name' : string, 'ids': any[], 'volumeIdentifier' : string, 'structure': string} = 
        {'name' : "", 'ids': [], 'volumeIdentifier' : "", 'structure': ''};
    if (target){
      let finition = enduitAxis.includes(axis1) || enduitAxis.includes(axis2);
      let dn = indicator == 'dn';
      let node = DEH.followSlice(slice);      
      if(typeof(sum) == 'number'){
        let targetValue = DEH.getTarget(node.label, node.id, dn, finition);      
        rodPosition = 360 * Math.min((targetValue + targetsStartingPoint) / sum, 1);
      } else{
        rodPosition = new Array(dataWidget.columnsTitles.length).fill(0);
        let elemIds = new Array(dataWidget.columnsTitles.length).fill(0);
        for (let [id, j] of Object.entries(dataWidget.idToJ)) if (j !== undefined) elemIds[j] = id; // pour récupérer les ids des tous les éléments de l'axe
        targetLevel['ids'] = elemIds;
        let targetValues = 
          DEH.getListTarget(finition ? "agentFinitions": (node.children[0] as Node).label, elemIds, dn, finition);
        for (let i = 0; i < targetValues.length; i++) 
          rodPosition[i] = Math.min((targetValues[i] + targetsStartingPoint[i]) / sum[i], 1);
        if (node.label == 'France' && !finition){ // This is to calculate the position of the ciblage rods
          let drvNodes: Node[] = node.children as Node[];
          let agentNodesMatrix: Node[][] = drvNodes.map((drvNode:Node) => drvNode.children as Node[]);
          let ciblageValues = agentNodesMatrix.map(
            (agentNodesOfADrv: Node[]) => agentNodesOfADrv.map((agentNode: Node) => DEH.getTarget('Secteur', agentNode.id, dn))
              .reduce((acc:number, value:number) => acc + value, 0));
          rodPositionForCiblage = new Array(dataWidget.columnsTitles.length).fill(0);
          for (let i = 0; i < targetValues.length; i++) 
            rodPositionForCiblage[i] = Math.min((ciblageValues[i] + targetsStartingPoint[i]) / sum[i], 1);
        }
      }
      targetLevel['volumeIdentifier'] = dn ? "dn": "vol";
      if(finition) targetLevel['name'] = "targetLevelAgentFinitions";
      else if(node.label === 'France') targetLevel['name'] = 'targetLevelDrv';
      else if(node.label === 'Région') targetLevel['name'] = 'targetLevelAgentP2CD';
      else targetLevel['name'] = 'targetLevel'
      targetLevel['structure'] = "structureTargetlevel";
    }
    if (typeof(sum) !== 'number') sum = 0;
    return {data: dataWidget.formatWidget(transpose), sum: sum, target: rodPosition, 
      colors: colors, targetLevel: targetLevel, ciblage: rodPositionForCiblage}    
  }

  rubiksCubeCheck(slice:any, indicator: string, percent:string){
    let sortLines = percent !== 'classic';
    let dataWidget = PDV.getData(slice, "enseigne", "segmentMarketing", indicator.toLowerCase(), this.geoTree, []);
    dataWidget.basicTreatement(false, sortLines, false);
    return dataWidget.numberToBool()
  }

  getIndustriesReverseDict(){
    let industriesReverseDict:{[key:string]:string} = {};
    for (let [industrieId, industrieName] of Object.entries(DEH.get('industry')))
      industriesReverseDict[industrieName as string] = industrieId;
    return industriesReverseDict;
  }

  updateTargetLevel(newValue: number, targetLevelName: string, targetLevelId: string, 
      volumeid: number, targetLevelStructure: string) {
    let newTargetLevel: number[] = DEH.get(targetLevelName)[targetLevelId]
    newTargetLevel[+DEH.get(targetLevelStructure).indexOf(volumeid)] = +newValue;
    this.dataService.updateTargetLevel(newTargetLevel, targetLevelName as UpdateFields, +targetLevelId);
  }
};

function loadAll(){
  PDV.load(true);
  (window as any).PDV = PDV;
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