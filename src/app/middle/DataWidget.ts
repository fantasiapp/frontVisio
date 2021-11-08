import DEH from './DataExtractionHelper';


const rodAfterFirstCategAxis = ['industryTarget', 'clientProspectTarget'],
    rodAfterSecondCategAxis = ['enduitIndustryTarget'];

export class DataWidget{
    private data: any;
    private dim: number;
    constructor(public rowsTitles: string[], public columnsTitles: string[],
        public idToI: {[key:number]: number|undefined}, public idToJ: {[key:number]: number|undefined}){
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
    
    widgetTreatement(km2 = false, sortLines=true, removeZeros:string, groupsAxis1?: string[], groupsAxis2?:string[]){
      if (km2) this.m2ToKm2();
      if (removeZeros == 'justLines') this.removeNullLine(); else if (removeZeros == 'all') this.removeZeros();
      if (sortLines) this.sortLines();
      if (groupsAxis1 && groupsAxis2) this.groupData(groupsAxis1, groupsAxis2, true);
    }
    
    formatWidget(transpose:boolean, histoCurve:Boolean, nbPdvs:number){
      if (histoCurve) this.completeWithCurve(nbPdvs);
      if (this.dim == 0) return [[this.rowsTitles[0], this.data]];
      if (this.dim == 1){
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

    getDim(){
      return this.dim;
    }
    
    getSum(){
      if (this.dim == 0) return Math.round(this.data);
      if (this.dim == 1) return Math.round(this.data.reduce((acc:number, value:number) => acc + value, 0));
      let sumCols = new Array(this.columnsTitles.length).fill(0);
      for(let j = 0; j < this.columnsTitles.length; j++) 
      sumCols[j] = this.data.reduce((acc:number, line:number[]) => acc + line[j], 0);
      return sumCols
    }
    
    completeWithCurve(nbPdvs:number){
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
    
    private groupData(groupsAxis1: string[], groupsAxis2: string[], simpleFormat=false){
      let isOne1 = groupsAxis1.length == 1,
        isOne2 = groupsAxis2.length == 1;
      groupsAxis1 = (groupsAxis1.length == 0) ? this.rowsTitles : groupsAxis1;
      groupsAxis2 = (groupsAxis2.length == 0) ? this.columnsTitles : groupsAxis2;
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
  
    private m2ToKm2(){
      for (let i = 0; i < this.rowsTitles.length; i++)
      for (let j = 0; j < this.columnsTitles.length; j++)
      this.data[i][j] = this.data[i][j]/1000;
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
        let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value == 0), true);
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
        let lineNull = this.data[i].reduce((acc: boolean, value: number) => acc && (value == 0), true);
        if (lineNull) this.idToI[DataWidget.findKeyByValue(this.idToI, i) as number] = undefined;
        if (!lineNull) realLinesIndexes.push(i);        
      }
      for (let _ in realLinesIndexes) newData.push([]);
      for (let j = 0; j < m; j++){
        let colNull = this.data.reduce((acc: boolean, line: number[]) => acc && (line[j] == 0), true);
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
    
    getData(){
      return this.data;
    }
  }