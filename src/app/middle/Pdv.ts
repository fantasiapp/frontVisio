import DEH, {GeoExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import {SliceTable} from './SliceTable';
import {DataWidget} from './DataWidget';
import {Sale} from './Sale';
import {Tree, Node} from './Node';


const nonRegularAxis = ['mainIndustries', 'enduitIndustry', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 
    'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'enduitIndustryTarget', 'industryTarget', 'suiviAD'],
    visitAxis = ['segmentDnEnduitTargetVisits'];

class SimplePdv { // Theses attributes are directly those received from the back
    private static indexMapping: Map<string, number>;
  
    private static createIndexMapping(){
      const fields = DEH.get('structurePdvs') as string[];
      this.indexMapping = new Map<string, number>();
      fields.forEach((value: string, index: number) => 
        this.indexMapping.set(value, index)
      );
    }
    static index(attribute: string): number {
      return SimplePdv.indexMapping.get(attribute)!;
    }
    public static _initialize(){
      SimplePdv.createIndexMapping();
    }
  
    // code!: string;
    // name!: string;
    // drv!: string;
    // agent!: number;
    // agentFinitions!: number;
    // dep!: number;
    // bassin!: number;
    // ville!: number;
    // latitude!: number;
    // longitude!: number;
    // segmentCommercial!: number;
    // segmentMarketing!: number;
    // enseigne!: number;
    // ensemble!: number;
    // sousEnsemble!: number;
    // site!: number;
    // available!: boolean;
    // sale!: boolean;
    // redistributed!: boolean;
    // redistributedFinitions!: boolean;
    // pointFeu!: boolean;
    // onlySiniat!: boolean;
    // closedAt!: number;
    // nbVisits!: number;
    // target!: any[];
    // sales!: any[];
    icon: any = null;
  
    constructor(protected values: any[]) {
      //this code setups getters for each field written in structurePdvs
      // for(let key of DEH.get('structurePdvs')) {
      //   Object.defineProperty(this, key, {
      //     get: () => {
      //       if(SimplePdv.indexMapping.get(key)) {
      //           return this.values[SimplePdv.index(key)!]
      //         }
      //     }
      //   })
      // }
    }
  
    public getValues() {return this.values;}
    public setValues(newValues: any[]) {this.values = Object.assign([], newValues); this.icon = null; }
  
    get code(): string{return this.values[SimplePdv.indexMapping.get('code')!]}
    get name(): string{return this.values[SimplePdv.indexMapping.get('name')!]}
    get drv(): string{return this.values[SimplePdv.indexMapping.get('drv')!]}
    get agent(): number{return this.values[SimplePdv.indexMapping.get('agent')!]}
    get agentFinitions(): number{return this.values[SimplePdv.indexMapping.get('agentFinitions')!]}
    get dep(): number{return this.values[SimplePdv.indexMapping.get('dep')!]}
    get bassin(): number{return this.values[SimplePdv.indexMapping.get('bassin')!]}
    get ville(): number{return this.values[SimplePdv.indexMapping.get('ville')!]}
    get latitude(): number{return this.values[SimplePdv.indexMapping.get('latitude')!]}
    get longitude(): number{return this.values[SimplePdv.indexMapping.get('longitude')!]}
    get segmentCommercial(){return this.values[SimplePdv.indexMapping.get('segmentCommercial')!]}
    get segmentMarketing(): number{return this.values[SimplePdv.indexMapping.get('segmentMarketing')!]}
    get enseigne(): number{return this.values[SimplePdv.indexMapping.get('enseigne')!]}
    get ensemble(): number{return this.values[SimplePdv.indexMapping.get('ensemble')!]}
    get sousEnsemble(): number{return this.values[SimplePdv.indexMapping.get('sousEnsemble')!]}
    get site(): number{return this.values[SimplePdv.indexMapping.get('site')!]}
    get available(): boolean{return this.values[SimplePdv.indexMapping.get('available')!]}
    get sale(): boolean{return this.values[SimplePdv.indexMapping.get('sale')!]}
    get redistributed(): boolean{return this.values[SimplePdv.indexMapping.get('redistributed')!]}
    get redistributedFinitions(): boolean{return this.values[SimplePdv.indexMapping.get('redistributedFinitions')!]}
    get pointFeu(): boolean{return this.values[SimplePdv.indexMapping.get('pointFeu')!]}
    get onlySiniat(): boolean{return this.values[SimplePdv.indexMapping.get('onlySiniat')!]}
    get closedAt(){return this.values[SimplePdv.indexMapping.get('closedAt')!]}
    get nbVisits(): number{return this.values[SimplePdv.indexMapping.get('nbVisits')!]}
    get target(): any[] | false{return this.values[SimplePdv.indexMapping.get('target')!]}
    get sales(): number[][]{return this.values[SimplePdv.indexMapping.get('sales')!]}
  
    public changeOnlySiniat(val: boolean) {
      this.values[PDV.index('onlySiniat')] = val;
    }
    public changeTargetTargetFinitions(val: boolean) {
      if(this.target) this.initializeTarget();
      (this.target as any[])[DEH.TARGET_FINITIONS_ID] = val;
    }
    
    public initializeTarget() {
      this.values[SimplePdv.indexMapping.get('target')!] = [Math.floor(Date.now()/1000), true, true, true, 0, false, "", "", this.bassin]
    }
  }
  
  export class PDV extends SimplePdv{
  
    private static instances: Map<number, PDV> = new Map<number, PDV>();
    static geoTree: Tree;
    static tradeTree: Tree;
  
    constructor(readonly id: number, values: any[]){
      super(values);
    };
  
    //Getters for custom properties; used mostly in the table
    get salesObject(): Sale[] {let values: Sale[] = []; for(let s of this.sales) {values.push(new Sale(s));} return values;}
    get p2cdSalesObject(): Sale[] {let values: Sale[] = []; for(let s of this.sales) {if(["plaque", "cloison", "doublage"].includes(DEH.get('product')[s[DEH.SALES_PRODUCT_ID]])) values.push(new Sale(s));} return values;}
    get potential(): number {return this.computeSalesRepartition()['potentialFinition']}
    get typology(): number {return this.property('typology')}
  
    get targetP2cd(){ return this.target ? this.target[DEH.TARGET_VOLUME_ID] : false;}
    get targetFinition(){ return this.target ? this.target[DEH.TARGET_FINITIONS_ID] : false;}
    get volumeTarget(){ return this.target ? this.target[DEH.TARGET_VOLUME_ID] : false;}
    get lightTarget(){ return this.target ? this.target[DEH.TARGET_LIGHT_ID] : false;}
    get commentTarget(){ return this.target ? this.target[DEH.TARGET_COMMENT_ID] : false;}
  
    get siniatSales() {return this.displayIndustrieSaleVolumes()['Siniat']}
    get totalSales() {return Object.entries(this.displayIndustrieSaleVolumes()).reduce((totalSales: number, entry: any) => totalSales + entry[1], 0)}
    get graph() {
      let p2cdSales: any =  {}; let p2cdRaw:any = this.displayIndustrieSaleVolumes()
      let enduitSales: any =  {}; let enduitRaw: any = this.displayIndustrieSaleVolumes(true)
      p2cdSales['Siniat'] = {'value': p2cdRaw['Siniat']}
      for(let industry of ['Siniat', 'Placo', 'Knauf', 'Autres']) {
          p2cdSales[industry] = {'value': p2cdRaw[industry], 'color': SliceTable.getGraphColor('industry', industry)}
      }
      for(let industry of ['Prégy', 'Salsi', 'Autres']) {
          enduitSales[industry] = {'value': enduitRaw[industry], 'color': SliceTable.getGraphColor('indFinition', industry)}
      }
      return {'p2cd': p2cdSales, 'enduit': enduitSales};
    }
    get edit(): boolean {return true}
    get info(): boolean {return true}
    get checkboxP2cd(): boolean {return this.ciblage() === 2}
    get clientProspect(){return this.clientProspect2(true)}
  
    get realTargetP2cd(){
      if (this.targetP2cd > 0 && this.lightTarget !== 'r') return this.targetP2cd;
      return 0;
    }
    
    static getInstances(): Map<number, PDV> {
      if (!this.instances)
      this.load(false);
      return this.instances;
    }
  
    // Il faudra penser à delete la requête de la ram après l'avoir utilisée
    static load(loadTrees = true){
      SimplePdv._initialize();
      // this.instances.clear(); //<- clear before
      for (let [id, data] of Object.entries(DEH.get('pdvs'))){
        let intId = parseInt(id);
        if (Number.isNaN(intId)) continue;
        if(this.instances.get(intId)) this.instances.get(intId)?.setValues(<any[]>data);
        else this.instances.set(intId, new PDV(intId, <any[]>data));
      }
      if (loadTrees) this.loadTrees();
    };
    
    private static loadTrees(){
      this.geoTree = new Tree(GeoExtractionHelper);
      this.tradeTree = new Tree(TradeExtrationHelper);
    }
    
    public getValue(indicator: string, axisName?:string, visit=false): (number | number[]){
      if (axisName && nonRegularAxis.includes(axisName!)){
        let salesRepartition = this.computeSalesRepartition();
        if (indicator == 'dn' || visit) return this.computeIrregularAxis(axisName!, indicator, salesRepartition);
        else return this.computIndustriesAxis(axisName, salesRepartition);
      } else return (indicator == 'dn') ? 1: 
      this.salesObject.filter(sale => sale.type == 'p2cd').reduce((acc, sale) => acc + sale.volume, 0);
    }
  
    private computeSalesRepartition():{[key:string]:any}{
      let salesRepartition: {[key:string]:any} = {Siniat: 0, Salsi: 0, Prégy: 0, Knauf: 0, Challengers: 0, 
        Placo: 0, totalSales: 0, totalP2cd: 0, totalEnduit: 0, sumExceptSiniat: 0, completed: false};
      for (let sale of this.salesObject){
        let type = sale.type, industry = sale.industry, volume = sale.volume;
        salesRepartition['totalSales'] += volume;
        if (sale.date != null) salesRepartition['completed'] = true;
        if (type == 'p2cd'){
          salesRepartition['totalP2cd'] += volume;
          if (industry !== 'Siniat') salesRepartition['sumExceptSiniat'] += volume;
          if (['Siniat', 'Placo', 'Knauf'].includes(industry)) salesRepartition[industry] += volume;
          else salesRepartition['Challengers'] += volume;
        } else if (type == 'enduit' && ['Salsi', 'Prégy'].includes(industry) && volume > 0){
          salesRepartition['totalEnduit'] += volume;
          salesRepartition[industry] += volume;
        }
      }
      salesRepartition['potentialFinition'] = Math.max(salesRepartition['totalP2cd'] * DEH.getParam('ratioPlaqueFinition') - salesRepartition['Salsi'] - salesRepartition['Prégy'], 0);
      return salesRepartition;
    }
  
    private computeIrregularAxis(axisName:string, indicator:string, params: {[key:string]:any}){
      let axis: string[] = Object.values(DEH.get(axisName, true)),
        repartition= new Array(axis.length).fill(0),
        found = false, i = 0;
      let value = (indicator == 'dn') ? 1: ((indicator == 'visits') ? this.nbVisits : 
        this.nbVisits * Math.max(params['totalP2cd'] * DEH.get("params")["ratioPlaqueFinition"], params['totalEnduit']))
      while (!found){
        if (this.conditionAxis(axisName, axis[i], params)){
          found = true;
          repartition[i] = value;
        }
        i++;
      }
      return repartition;
    }
  
    // peut-être qu'il faudrait le merge avec computeElement à terme...
    private conditionAxis(axisName:string, item:string, params:{[key:string]:any}){
      switch(item){
        // suiviAD axis
        case 'Terminées': return this.onlySiniat || !this.redistributed || params['completed'];
        case 'Non mises à jour': return params['totalSales'] != params['Siniat'];
        // DN finition axis
        case 'Non documenté': return (axisName == 'segmentDnEnduit' || axisName == 'segmentDnEnduitTarget' || axisName == 'segmentDnEnduitTargetVisits') ?
          this.sales.length == 0 || !this.redistributedFinitions || !this.redistributed || (params['Siniat'] == params['totalSales'] && !this.onlySiniat):
          params['totalP2cd'] == 0;
        case 'Cible P2CD + Enduit': return this.targetFinition && (params['Siniat'] > DEH.getParam('ratioCustomerProspect') * params['totalP2cd']) && params['totalEnduit'] > 0;
        case 'P2CD + Enduit': return (params['Siniat'] > DEH.getParam('ratioCustomerProspect') * params['totalP2cd']) && params['totalEnduit'] > 0;
        case 'Cible P2CD': case 'Cible Enduit hors P2CD': return this.targetFinition && params['totalEnduit'] > 0;
        case 'Enduit hors P2CD': return params['totalEnduit'] > 0;
        case 'Cible Pur Prospect': return this.targetFinition;
        // DN P2CD axis
        case 'Potentiel ciblé': return this.realTargetP2cd > 0;
        case 'Client': return params['Siniat'] > DEH.getParam('ratioCustomerProspect') * params['totalP2cd'];
        default: return true;
      }
    }
  
    private computIndustriesAxis(axisName:string, salesIndustries: {[key:string]:any}){
      let axis: string[] = Object.values(DEH.get(axisName, true)),
        computedAxis = new Array(axis.length).fill(0);
      for (let i = 0; i < axis.length; i++)
        computedAxis[i] = this.computeElement(axis[i], salesIndustries, axisName);
      return computedAxis
    }
  
    private computeElement(element:string, salesRepartition:{[key:string]: number}, axisName:string){
      switch (element){
        case 'Placo': case 'Knauf':case 'Challengers': return (axisName !== 'industryTarget') ? salesRepartition[element]:
          (this.realTargetP2cd ? salesRepartition[element] * (1 - this.realTargetP2cd / salesRepartition['sumExceptSiniat']): salesRepartition[element]);
        case 'Potentiel ciblé': return this.realTargetP2cd;
        case 'Cible Croissance': return (salesRepartition['totalEnduit'] > 0 && this.targetFinition) ? salesRepartition['potentialFinition']: 0;
        case 'Croissance': return (salesRepartition['totalEnduit'] > 0 && (axisName == 'enduitIndustry' ||!this.targetFinition)) ? salesRepartition['potentialFinition']: 0;
        case 'Cible Conquête': return (salesRepartition['totalEnduit'] == 0 && this.targetFinition) ? salesRepartition['potentialFinition']: 0;
        case 'Conquête': return (salesRepartition['totalEnduit'] == 0 && (axisName == 'enduitIndustry' || !this.targetFinition)) ? salesRepartition['potentialFinition']: 0;
        default: return salesRepartition[element];
      }
    }
  
    static findById(id: number): PDV | undefined {
      return this.instances.get(id);
    }
  
    static filterPdvs(pdvs:PDV[]){
      return pdvs.filter(pdv => pdv.available && pdv.sale);
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
        let visit = visitAxis.includes(axis1) || visitAxis.includes(axis2);
        for (let pdv of newPdvs){
          if (pdv.available && pdv.sale){// condition à mettre dans le reslice peut-être
            if (irregular == 'no') 
              dataWidget.addOnCase(
                pdv[axis1 as keyof PDV], pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1, visit) as number);
            else if (irregular == 'line') 
              dataWidget.addOnColumn(
                pdv[axis2 as keyof PDV], pdv.getValue(indicator, axis1, visit) as number[]);
            else if (irregular == 'col') 
              dataWidget.addOnRow(
                pdv[axis1 as keyof PDV], pdv.getValue(indicator, axis2, visit) as number[]);
          }
        }
      }
    }
  
    private static ComputeAxisName(node:Node, axis:string){
      if (axis == 'lgp-1') return this.geoTree.attributes['natures'][1];
      if (['lg-1', 'lt-1'].includes(axis)) return (node.children[0] as Node).nature;
      return axis
    }
  
    private static computeAxis(node:Node, axis:string){
      axis = this.ComputeAxisName(node, axis);
      let dataAxis = DEH.get(axis, true), titles = Object.values(dataAxis),
        idToX:any = {};
      Object.keys(dataAxis).forEach((id, index) => idToX[parseInt(id)] = index);
      return [axis, titles, idToX];
    }
  
    static getData(node: Node, axis1: string, axis2: string, indicator: string,
        addConditions:[string, number[]][]): DataWidget{
      let [newAxis1, rowsTitles, idToI] = this.computeAxis(node, axis1),
          [newAxis2, columnsTitles, idToJ] = this.computeAxis(node, axis2);
      let pdvs = PDV.slice(node);
      let dataWidget = new DataWidget(rowsTitles, columnsTitles, idToI, idToJ);
      this.fillUpTable(dataWidget, newAxis1, newAxis2, indicator, pdvs, addConditions);
      return dataWidget;
    }
  
    static reSlice(pdvs:PDV[], conditions: [string, number[]][]): PDV[]{
      if (conditions.length == 0) return pdvs;
      let newPdvs: PDV[] = [];
      for (let pdv of pdvs)
        if (conditions.map(condition => condition[1].includes(pdv.property(condition[0]))).reduce((acc, bool) => acc && bool, true)) 
          newPdvs.push(pdv);
      return newPdvs;
    }
  
    //Juste pour le reSlice
    property(propertyName:string){
      switch(propertyName){
        case 'clientProspect': return this.clientProspect2(true);
        case 'industriel': return this.industriel();
        case 'ciblage': return this.ciblage();
        case 'pointFeuFilter': return this.pointFeu? 2: 1;
        case 'visited': return (this.nbVisits > 0)? 1: 2;
        case 'segmentMarketingFilter': return this.segmentMarketingFilter();
        case 'typology': return this.typologyFilter();
        default: return this[propertyName as keyof SimplePdv];
      }
    }
  
    private segmentMarketingFilter(){
      let dictSegment = DEH.get('segmentMarketingFilter'),
        dictAllSegments = DEH.get('segmentMarketing');
      let pdvSegment = this.segmentMarketing;
      let result = parseInt(DEH.getKeyByValue(dictSegment, dictAllSegments[pdvSegment])!);
      if (Number.isNaN(result)) result = 4;
      return result;
    }
  
    private typologyFilter():any{
      let dnResult = this.getValue('dn', 'segmentDnEnduit') as number[],
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
      let salesRepartition = this.displayIndustrieSaleVolumes(),
        industrieMax = 'Autres';
      for (let [industrie, sales] of Object.entries(salesRepartition))
        if (sales > salesRepartition[industrieMax]) industrieMax = industrie;
      return parseInt(DEH.getKeyByValue(DEH.get('industriel'), industrieMax)!);
    }
  
    ciblage(){
      return (this.realTargetP2cd > 0) ? 2: 1; //Ca c'est hardcodé
    }
    
    static ComputeListCiblage(nodes: Node[], dn:boolean){
      return nodes.map(node => dn ? PDV.computeCiblage(node, false, dn): PDV.computeCiblage(node, false, dn)/1000);
    }
  
    private getCiblage(enduit:boolean, dn:boolean){
      if (dn && enduit) return this.targetFinition ? 1: 0;
      if (dn) return (isNaN(this.targetP2cd) || this.targetP2cd <= 0 || this.lightTarget == 'r') ? 0: 1;
      if (enduit) return this.targetFinition ? Math.max(this.potential, 0): 0;
      return this.realTargetP2cd;
    }
  
    static slice(node:Node){
      return PDV.filterPdvs(PDV.childrenOfNode(node));
    }
  
    static computeCiblage(node: Node, enduit=false, dn=false){
      let pdvs = PDV.childrenOfNode(node);
      return pdvs.reduce((acc, pdv) => acc + pdv.getCiblage(enduit, dn), 0);
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
  
    clientProspect2(index=false){
      let dnResult = this.getValue('dn', 'clientProspect') as number[],
        clientProspectDict = DEH.get('clientProspect');
      let clientProspectAxis = Object.values(clientProspectDict),
        clientProspectIds = Object.keys(clientProspectDict);
      for (let i = 0; i < dnResult.length; i++)
        if (dnResult[i] == 1)
          return (index) ? parseInt(clientProspectIds[i]): clientProspectAxis[i];
    }
  
    displayIndustrieSaleVolumes(enduit=false): {[key:string]:number}{
      let dictSales = this.computeSalesRepartition();
      if (enduit) return {Salsi: dictSales['Salsi'], Prégy: dictSales['Prégy'], Autres: dictSales['potentialFinition']};
      return {Siniat: dictSales['Siniat'], Placo: dictSales['Placo'], Knauf: dictSales['Knauf'], Autres: dictSales['Challengers']};
    }
  
    private getFirstSaleDate(){
      let firstSaleDateInSeconds  = Infinity;
      for (let sale of this.salesObject)
        if (sale.date !== null && sale.date < firstSaleDateInSeconds)
          firstSaleDateInSeconds = sale.date;
      return firstSaleDateInSeconds;
    }
  
    private computeWeeksRepartitionAD(){    
      let axe : string[]= Object.values(DEH.get('weeks')),
        dnAd = new Array(axe.length).fill(0);
      if (!this.adCompleted()) return dnAd;
      let associatedIndex :{[key: string]: number}= {};
      for (let i = 0; i < axe.length; i++)
        associatedIndex[axe[i]] = i;
      if (this.onlySiniat || !this.redistributed){
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
      if (!find) dnAd[associatedIndex['avant']] = 1;
      return dnAd
    }
  
    private static fillFirstLineOfHistoCurve(widget: DataWidget, pdvs:PDV[]){
      for (let pdv of pdvs)
        widget.addOnRow(1, pdv.computeWeeksRepartitionAD())// Le 1 est harcodé car c'est l'id de "Nombre de PdV complétés", il faudra changer ça
    }
  
    hasNonSiniatSale(){
      let siniatId = DEH.INDUSTRIE_SINIAT_ID;
      return this.salesObject.reduce((acc: boolean, sale:Sale) => acc || sale.industryId !== siniatId, false);
    }
  
    adCompleted(){
      return this.onlySiniat || !this.redistributed || this.salesObject.reduce((acc:boolean, sale:Sale) => acc || sale.date !== null, false);
    }
  
    static computeJauge(node:Node, indicator:string): [[string, number][], number[]]{
      let pdvs = PDV.filterPdvs(PDV.childrenOfNode(node));
      switch(indicator){
        case 'visits': {
          let totalVisits: number= 0,
            cibleVisits:number = PDV.computeTargetVisits(node) as number,
            threshold = [50, 99.99, 100];
          for (let pdv of pdvs) totalVisits += pdv.nbVisits;
          let adaptedVersion = (totalVisits >= 2) ? ' visites': ' visite';
          return [[[totalVisits.toString().concat(adaptedVersion, ' sur un objectif de ', cibleVisits.toString()), 100 * Math.min(totalVisits / cibleVisits, 1)]], threshold];
        };
        case 'targetedVisits': {
          let totalVisits = 0, totalCibleVisits = 0, thresholdForGreen = 100 * PDV.computeTargetVisits(node, true),
            threshold = [thresholdForGreen / 2, thresholdForGreen, 100];
          for (let pdv of pdvs){
            totalVisits += pdv.nbVisits;
            if (pdv.targetFinition) totalCibleVisits += pdv.nbVisits;
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
  
    static computeTargetVisits(node:Node, threshold=false){
      let finitionAgents:any[] = (node.nature == ('root')) ? Object.values(DEH.get('agentFinitions')): 
        ((node.nature == 'drv') ? DEH.findFinitionAgentsOfDrv(node.id): 
        [DEH.get('agentFinitions')[node.id]]);
      if (threshold) return (1 / finitionAgents.length) * finitionAgents.reduce(
        (acc, agent) => acc + agent[DEH.AGENTFINITION_RATIO_ID], 0);
      return finitionAgents.reduce(
        (acc, agent) => acc + agent[DEH.AGENTFINITION_TARGETVISITS_ID], 0);
    }
  };