import DEH, {GeoExtractionHelper, TradeExtrationHelper} from './DataExtractionHelper';
import {SliceTable} from './SliceTable';
import {Sale} from './Sale';
import {Tree, Node} from './Node';

// à mettre dans le back
const nonRegularAxis = ['mainIndustries', 'enduitIndustry', 'segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 
    'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'enduitIndustryTarget', 'industryTarget', 'suiviAD', 'weeks'],
    dnLikeAxis = ['segmentDnEnduit', 'clientProspect', 'clientProspectTarget', 'segmentDnEnduitTarget', 'segmentDnEnduitTargetVisits', 'suiviAD', 'weeks'];

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
    (this.target as any[])[DEH.getPositionOfAttr('structureTarget',  'targetFinitions')] = val;
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
  get p2cdSalesObject(): Sale[] {let values: Sale[] = []; for(let s of this.sales) {if(["plaque", "cloison", "doublage"].includes(DEH.get('product')[s[DEH.getPositionOfAttr('structureSales',  'product')]])) values.push(new Sale(s));} return values;}
  get potential(): number {return this.computeSalesRepartition()['potentialFinition']}
  get typology(): number {return this.filterProperty('typology')}

  get targetP2cd(){ return this.target ? this.target[DEH.getPositionOfAttr('structureTarget',  'targetP2CD')] : false;}
  get targetFinition(){ return this.target ? this.target[DEH.getPositionOfAttr('structureTarget',  'targetFinitions')] : false;}
  get volumeTarget(){ return this.target ? this.target[DEH.getPositionOfAttr('structureTarget',  'targetP2CD')] : false;}
  get lightTarget(){ return this.target ? this.target[DEH.getPositionOfAttr('structureTarget',  'greenLight')] : false;}
  get commentTarget(){ return this.target ? this.target[DEH.getPositionOfAttr('structureTarget',  'commentTargetP2CD')] : false;}

  get siniatSales() {return this.computeSalesRepartition()['Siniat']}
  get totalSales() {return this.computeSalesRepartition()['totalP2cd']}
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
  get checkboxP2cd(): boolean {return this.ciblageFilter() === 2}
  get clientProspect(){return this.clientProspectFilter(true)}

  // to avoid specific cases for some axis
  get histoCurve(){return 1}
  get avancementAD(){return 0}
  get visits(){return 0}
  get targetedVisits(){return 0}
  
  get realTargetP2cd(){
    if (this.targetP2cd > 0 && this.lightTarget !== 'r') return this.targetP2cd;
    return 0;
  }
  
  getCiblage(enduit:boolean, dn:boolean){
    if (dn && enduit) return this.targetFinition ? 1: 0;
    if (dn) return (isNaN(this.targetP2cd) || this.targetP2cd <= 0 || this.lightTarget == 'r') ? 0: 1;
    if (enduit) return this.targetFinition ? Math.max(this.potential, 0): 0;
    return this.realTargetP2cd;
  }
  
  displayIndustrieSaleVolumes(enduit=false): {[key:string]:number}{
    let dictSales = this.computeSalesRepartition();
    if (enduit) return {Salsi: dictSales['Salsi'], Prégy: dictSales['Prégy'], Autres: dictSales['potentialFinition']};
    return {Siniat: dictSales['Siniat'], Placo: dictSales['Placo'], Knauf: dictSales['Knauf'], Autres: dictSales['Challengers']};
  }

  static getInstances(): Map<number, PDV> {
    if (!this.instances)
    this.load(false);
    return this.instances;
  }

  static load(loadTrees = true){
    SimplePdv._initialize();
    this.instances.clear(); //<- clear before
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

  static findById(id: number): PDV | undefined {
    return this.instances.get(id);
  }

  static slice(node:Node){
    return PDV.filterPdvs(PDV.childrenOfNode(node));
  }

  static countForFilter(pdvs:PDV[], attributesToCount:string[]){
    let dictCounter: {[key:string]: {[key:string]:number}} = {};
    for (let attribute of attributesToCount)
      dictCounter[attribute] = {};
    for (let pdv of pdvs)
      for (let attribute of Object.keys(dictCounter)){
        if (dictCounter[attribute].hasOwnProperty(pdv.filterProperty(attribute))) 
          dictCounter[attribute][pdv.filterProperty(attribute)] += 1;
        else dictCounter[attribute][pdv.filterProperty(attribute)] = 1;
      }
    return dictCounter
  }

  static reSlice(pdvs:PDV[], conditions: [string, number[]][]): PDV[]{
    if (conditions.length == 0) return pdvs;
    let newPdvs: PDV[] = [];
    for (let pdv of pdvs)
      if (conditions.map(condition => condition[1].includes(pdv.filterProperty(condition[0]))).reduce((acc, bool) => acc && bool, true)) 
        newPdvs.push(pdv);
    return newPdvs;
  }

  private static filterPdvs(pdvs:PDV[]){
    return pdvs.filter(pdv => pdv.available && pdv.sale);
  }

  private static childrenOfNode(node: Node | PDV):PDV[]{
    if (node instanceof PDV) return [node];
    return node.children.map(
      (child: any) => this.childrenOfNode(child)).reduce((a: PDV[], b: PDV[]) => a.concat(b), [])
  }
  
  public getValue(indicator: string, axisName:string): (number | number[]){
    let salesRepartition = this.computeSalesRepartition();
    if (nonRegularAxis.includes(axisName)){
      if (dnLikeAxis.includes(axisName)) return this.computeDnLikeAxis(axisName!, indicator, salesRepartition);
      else return this.computeIrregularAxis(axisName, salesRepartition);
    }
    switch(indicator){
      case 'dn': return 1;
      case 'visits': return this.nbVisits as number;
      case 'targetedvisits': return this.targetFinition ? this.nbVisits: 0;
      case 'avancementad': return salesRepartition['completed'] ? 1: 0;
      default: return salesRepartition['totalP2cd'];
    }
  }
  
  private computeSalesRepartition():{[key:string]:any}{
    let salesRepartition: {[key:string]:any} = {Siniat: 0, Salsi: 0, Prégy: 0, Knauf: 0, Challengers: 0, 
      Placo: 0, totalSales: 0, totalP2cd: 0, totalEnduit: 0, sumExceptSiniat: 0, completed: false, firstSaleDate: Infinity};
    for (let sale of this.salesObject){
      let type = sale.type, industry = sale.industry, volume = sale.volume;
      salesRepartition['totalSales'] += volume;
      if (sale.date != null){
        salesRepartition['completed'] = true;
        if (sale.date < salesRepartition['firstSaleDate']) salesRepartition['firstSaleDate'] = sale.date;
      }
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
    salesRepartition['completed'] = this.onlySiniat || !this.redistributed || salesRepartition['completed'];
    salesRepartition['potentialFinition'] = Math.max(salesRepartition['totalP2cd'] * DEH.getParam('ratioPlaqueFinition') - salesRepartition['Salsi'] - salesRepartition['Prégy'], 0);
    let currentDate = new Date(),
      day = currentDate.getDay() == 0 ? 6: currentDate.getDay() - 1; // because for timestamp week begins sunday
    salesRepartition['beginingOfTheWeek'] = currentDate.getTime() / 1000 - (currentDate.getSeconds() + 60 * (currentDate.getMinutes() + 60 * (currentDate.getHours() + 24 * day)))
    return salesRepartition;
  }
  
  // a DN like axis is an axis for which a pdv is represented in a single categorie
  private computeDnLikeAxis(axisName:string, indicator:string, params: {[key:string]:any}){
    let axis: string[] = Object.values(DEH.get(axisName, true)),
      repartition= new Array(axis.length).fill(0),
      found = false, i = 0;
    let value = (indicator == 'dn') ? 1: ((indicator == 'visits') ? this.nbVisits : 
      this.nbVisits * Math.max(params['totalP2cd'] * DEH.get("params")["ratioPlaqueFinition"], params['totalEnduit']))
    while (!found && i < repartition.length){
      if (this.conditionForAxis(axisName, axis[i], params)){
        found = true;
        repartition[i] = value;
      }
      i++;
    }
    return repartition;
  }

  private conditionForAxis(axisName:string, item:string, params:{[key:string]:any}){
    switch(item){
      // suiviAD axis
      case 'Terminées': return params['completed'];
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
      // weeks axis
      case 'avant': return params['completed'] && (this.onlySiniat || !this.redistributed || params['firstSaleDate'] < params['beginingOfTheWeek'] - 6 * 604800); // 604800 is a week in seconds
      case 's-1': case 's-2': case 's-3': case 's-4': case 's-5': case 's-6': return params['completed'] && params['firstSaleDate'] < params['beginingOfTheWeek'] - (+item.charAt(2) - 1) * 604800;
      case 's-0': return params['completed'];
      default: return true;
    }
  }

  private computeIrregularAxis(axisName:string, salesIndustries: {[key:string]:any}){
    return (Object.values(DEH.get(axisName, true)) as string[]).map((element:string) => this.computeElement(element, salesIndustries, axisName));
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

  filterProperty(propertyName:string){
    switch(propertyName){
      case 'clientProspect': return this.clientProspectFilter(true);
      case 'industriel': return this.industrielFilter();
      case 'ciblage': return this.ciblageFilter();
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

  industrielFilter(){
    let salesRepartition = this.displayIndustrieSaleVolumes(),
      industrieMax = 'Autres';
    for (let [industrie, sales] of Object.entries(salesRepartition))
      if (sales > salesRepartition[industrieMax]) industrieMax = industrie;
    return parseInt(DEH.getKeyByValue(DEH.get('industriel'), industrieMax)!);
  }

  ciblageFilter(){
    return (this.realTargetP2cd > 0) ? 2: 1; //Hardcode
  }
  
  clientProspectFilter(index=false){
    let dnResult = this.getValue('dn', 'clientProspect') as number[],
    clientProspectDict = DEH.get('clientProspect');
    let clientProspectAxis = Object.values(clientProspectDict),
    clientProspectIds = Object.keys(clientProspectDict);
    for (let i = 0; i < dnResult.length; i++)
    if (dnResult[i] == 1)
    return (index) ? parseInt(clientProspectIds[i]): clientProspectAxis[i];
  }
}