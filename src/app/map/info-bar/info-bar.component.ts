import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import DEH from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Pdv';
import { Sale } from 'src/app/middle/Sale';
import { DataService } from 'src/app/services/data.service';
import { LoggerService } from 'src/app/services/logger.service';
import { disabledParams } from 'src/app/behaviour/disabled-conditions'
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { Utils } from 'src/app/interfaces/Common';
import { ConditionnalDirective } from 'src/app/behaviour/conditionnal.directive';

@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeOut', [
      state('visible', style({
        opacity: 1
      })),
      state('invisible', style({
        opacity: 0
      })),
      transition('visible => invisible', [
        animate('1s')
      ]),
      transition('* => visible', [
        animate('0s')
      ])
    ])]
})
export class InfoBarComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  quiting: boolean = false;
  errorInput: boolean = false;

  @ViewChildren('comments')
  private comments?: QueryList<ElementRef>;

  @ViewChildren(ConditionnalDirective)
  private directives?: QueryList<ConditionnalDirective>;

  @Input()
  set pdv(value: PDV | undefined) {
    this.opened = value ? true : false;
    this.currentIndex = 0;
    this.pdvChange.emit(value);
    if ( value ) {
      this._pdv = new PDV(value.id, JSON.parse(JSON.stringify(value.getValues())));
      if(!this._pdv.target) this._pdv.initializeTarget()
      this.target = this._pdv.target as any[];
      this.target[this.TARGET_REDISTRIBUTED_ID] = this.target[DEH.getPositionOfAttr('structureTarget', 'redistributed')] && this.pdv!.redistributed;
      this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID] = this.target[DEH.getPositionOfAttr('structureTarget',  'redistributedFinitions')] && this.pdv!.redistributedFinitions;
      this.target[this.TARGET_SALE_ID] = this.target[DEH.getPositionOfAttr('structureTarget',  'sale')] && this.pdv!.sale
      if(this.target[DEH.getPositionOfAttr('structureTarget',  'bassin')] == "") this.target[DEH.getPositionOfAttr('structureTarget',  'bassin')] =  DEH.getNameOfRegularObject('bassin', this._pdv.bassin);

      this.displayedInfos = this.extractDisplayedInfos(this._pdv);
      this.targetP2cdFormatted = this.format(this.target[DEH.getPositionOfAttr('structureTarget',  'targetP2CD')]);
      this.showNavigation = this.shouldShowNavigation()
      this.isOnlySiniat = this.pdv!.onlySiniat

      this.loadGrid();
      this.cd.markForCheck();
      console.log("Set info bar DV")
    }
    this.logger.handleEvent(LoggerService.events.PDV_SELECTED, value?.id);
    this.logger.actionComplete();
  }
  @Input()
  display: string = 'p2cd';

  @Input()
  customData: {[field: string]: any} = {};

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;
  target: any[] = [];

  industries: string[] = [];
  products: string[] = [];
  grid: Sale[][] = [];
  gridFormatted: string[][] = [];
  targetP2cdFormatted: string = "";
  salesColors: string[][] = [];
  isOnlySiniat: boolean = false;

  SALES_INDUSTRY_ID;
  SALES_PRODUCT_ID;
  SALES_VOLUME_ID;
  SALES_DATE_ID;
  TARGET_VOLUME_ID;
  TARGET_LIGHT_ID;
  TARGET_REDISTRIBUTED_ID;
  TARGET_SALE_ID;
  TARGET_COMMENT_ID;
  TARGET_REDISTRIBUTED_FINITIONS_ID: any;

  showNavigation: boolean = false;

  industryIdToIndex : {[industryId: number]: number} = {}
  productIdToIndex : {[productId: number]: number} = {}
  hasChanged = false;
  mouseX: number = 0;
  mouseY : number = 0;

  disabledMsg: string = ''
  conditionsParams = disabledParams;
  noEmptySales(pdv: PDV, sales: any[]) {
    for(let sale of sales!) {
      if(sale[DEH.getPositionOfAttr('structureSales',  'industry')] != DEH.getIndustryId('Siniat') && sale[DEH.getPositionOfAttr('structureSales',  'volume')] > 0) {
        return true;
      }
      }
      return false;
  }

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  displayedInfos: {[field: string]: any} = {};
  redistributed?: boolean;

  extractDisplayedInfos(pdv: PDV) {
    return {
      name: pdv.name,
      agent: DEH.getNameOfRegularObject('agent', pdv.agent),
      segmentMarketing: DEH.getNameOfRegularObject('segmentMarketing', pdv.segmentMarketing),
      segmentCommercial: DEH.getNameOfRegularObject('segmentCommercial', pdv.segmentCommercial),
      enseigne: DEH.getNameOfRegularObject('enseigne', pdv.enseigne),
      dep: DEH.getNameOfRegularObject('dep', pdv.dep),
      ville: DEH.getNameOfRegularObject('ville', pdv.ville),
      bassin: this.target[DEH.getPositionOfAttr('structureTarget',  'bassin')],
      clientProspect: pdv.clientProspectFilter(),
      nbVisits: pdv.nbVisits,
      siniatP2cdSales: pdv.displayIndustrieSaleVolumes()['Siniat'],
      placoP2cdSales: pdv.displayIndustrieSaleVolumes()['Placo'],
      knaufP2cdSales: pdv.displayIndustrieSaleVolumes()['Knauf'],
      totalP2cdSales: pdv.displayIndustrieSaleVolumes()['Siniat'] + pdv.displayIndustrieSaleVolumes()['Placo'] + pdv.displayIndustrieSaleVolumes()['Knauf'] + pdv.displayIndustrieSaleVolumes()['Autres'],
      pregyEnduitSales: pdv.displayIndustrieSaleVolumes(true)['Prégy'],
      salsiEnduitSales: pdv.displayIndustrieSaleVolumes(true)['Salsi'],
      potential: pdv.potential,
      totalSiniatEnduitSales: pdv.potential + pdv.displayIndustrieSaleVolumes(true)['Salsi'] + pdv.displayIndustrieSaleVolumes(true)['Prégy'],
      totalEnduitSales: pdv.displayIndustrieSaleVolumes(true)['Prégy'] + pdv.displayIndustrieSaleVolumes(true)['Salsi'] + pdv.potential,
      typology: DEH.getFilter('segmentDnEnduit')[pdv.typology],
    }
  }

  shouldShowNavigation() {
    return this.target[this.TARGET_REDISTRIBUTED_ID] && this.target[this.TARGET_SALE_ID]
  }

  constructor(private ref: ElementRef, private dataService: DataService, private cd: ChangeDetectorRef, private logger: LoggerService) {
    //console.log('[InfobarComponent]: On')
    this.SALES_INDUSTRY_ID = DEH.getPositionOfAttr('structureSales', 'industry')
    this.SALES_PRODUCT_ID = DEH.getPositionOfAttr('structureSales', 'product')
    this.SALES_VOLUME_ID = DEH.getPositionOfAttr('structureSales', 'volume')
    this.SALES_DATE_ID = DEH.getPositionOfAttr('structureSales', 'date')
    this.TARGET_VOLUME_ID = DEH.getPositionOfAttr('structureTarget',  'targetP2CD');
    this.TARGET_LIGHT_ID = DEH.getPositionOfAttr('structureTarget',  'greenLight');
    this.TARGET_REDISTRIBUTED_ID = DEH.getPositionOfAttr('structureTarget', 'redistributed');
    this.TARGET_SALE_ID = DEH.getPositionOfAttr('structureTarget',  'sale');
    this.TARGET_COMMENT_ID = DEH.getPositionOfAttr('structureTarget',  'commentTargetP2CD');
    this.TARGET_REDISTRIBUTED_FINITIONS_ID = DEH.getPositionOfAttr('structureTarget',  'redistributedFinitions');

    
    this.industries = Object.values(DEH.get('labelForGraph') as []).filter((entry) => entry[0] == 'industryP2CD').map((entry) => entry = entry[1]) as string[];
    this.products = Object.values(DEH.get('product')) as string[];
    this.products.splice(3, this.products.length, 'P2CD')
    for(let i = 0; i<this.industries.length; i++)
      this.industryIdToIndex[+DEH.getKeyByValue(DEH.get('industry'), this.industries[i])!] = i+1; //first row already used
    for(let i = 0; i<this.products.length-1; i++)
      this.productIdToIndex[+DEH.getKeyByValue(DEH.get('product'), this.products[i])!] = i;
  }

  //make variable
  getSalesVolumes() {
    return (this.pdv ? Object.entries(this.pdv.displayIndustrieSaleVolumes()) : []).filter(entry => entry[1] != 0);
  }

  format(entry: number) {
    if(!entry) return ''
    return Utils.format(entry, 3, true);
  }

  convert(entry: string) {
    return Utils.convert(entry);
  }

  quit(save: boolean) {
    if(save && this.hasChanged)  {
      this.dataService.updatePdv(this._pdv!.getValues(), this._pdv!.id);
      this.hasChanged = false;
    }
    this.quiting = false;
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.hasChanged = false;
    this.pdv = undefined;
  }

  requestQuit() {
    //show the quit bar
    if ( this.hasChanged )
      this.quiting = true;
    else
      this.quit(false)
  }

  setPage(index: number) {
    this.currentIndex = index % this.pages.length;
  }

  loadGrid() {
    this.grid = new Array(this.industries.length + 1);
    this.gridFormatted = new Array(this.industries.length+1);
    this.salesColors = new Array(this.industries.length + 1);
    for ( let i = 0; i < this.grid.length; i++ ) {
      this.grid[i] = new Array(new Sale([]))
      this.gridFormatted[i] = new Array(this.products.length).fill('');
      this.salesColors[i] = new Array(this.products.length).fill('red');
      for(let j = 0; j < this.products.length; j++) this.grid[i][j] = new Sale([0, 0, 0, 0])
    }
    for(let sale of this._pdv!.p2cdSalesObject) {
      let i = this.industryIdToIndex[sale.industryId], j = this.productIdToIndex[sale.productId];
      this.grid[i][j] = sale;
      this.gridFormatted[i][j] = this.format(sale.volume);
      this.updateSum(i,j, 0, this.grid[i][j].volume)
      this.salesColors[i][j] = this.getSaleColor(sale);
    }
    for(let row = 0; row < this.industries.length; row++)
      this.salesColors[row][3] = 'black'
  }

  getSaleColor(sale: Sale): string {
    if(this.pdv!.sale === false || this.pdv!.onlySiniat === true || sale.industryId == DEH.getIndustryId('Siniat')) return 'black'
    if(Math.floor(Date.now()/1000) - 15778476 > sale.date) return 'orange'
    else return 'black'
}

  onKey(event: KeyboardEvent, i: number, j: number) {
    if(event.key === 'Enter') {
      this.changeSales(i, j);
      var currInput = <HTMLElement>document.activeElement;
      var inputs = Array.from(this.ref.nativeElement.querySelectorAll("input") as Array<HTMLElement>).filter((input) => input.getAttribute('disabled') == null);
      let currIndex = inputs.indexOf(currInput!);
      if(event.shiftKey) inputs[currIndex-1]?.focus();
      else inputs[currIndex+1]?.focus();
    }
    //if(event.keyCode === 37) console.log("Left")
    //if(event.keyCode === 38) console.log("Up")
    //if(event.keyCode === 39) console.log("Right")
    //if(event.keyCode === 40) console.log("Down")

  }

  updateSum(i: number, j: number, oldVolume: number, newVolume: number) {
    this.updateValue(0, j, this.grid[0][j].volume - oldVolume + newVolume)
    this.updateValue(i, 3, this.grid[i][3].volume - oldVolume + newVolume)
    this.updateValue(0, 3, this.grid[0][3].volume - oldVolume + newVolume)
  }

  updateValue(i: number, j: number, value: number) {
    this.grid[i][j].volume = value;
    this.gridFormatted[i][j] = this.format(value);
  }

  private updateDirectives() {
    for ( let directive of this.directives ?? [] )
      directive.update();
  }

  /*** Functions used to change the target field (and onlySiniat field) in the local pdv ***/
  changeRedistributed() {
    this.target[this.TARGET_REDISTRIBUTED_ID] = !this.target[this.TARGET_REDISTRIBUTED_ID]
    if(!this.target[this.TARGET_REDISTRIBUTED_ID]) this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID] = false;
    this.showNavigation = this.shouldShowNavigation()
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeRedistributedFinitions() {
    this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID] = !this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID]
    this.showNavigation = this.shouldShowNavigation()
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeTargetP2CD() {
    this.targetP2cdFormatted = this.convert(this.targetP2cdFormatted).toString();
    if(Number.isNaN(+this.targetP2cdFormatted)) {
      this.targetP2cdFormatted = this.format((this.pdv!.target as any[])[DEH.getPositionOfAttr('structureTarget',  'targetP2CD')]);
      this.errorInput = true;
      setTimeout(() => this.errorInput = false, 1000);
      return;
    }
    this.target[DEH.getPositionOfAttr('structureTarget',  'targetP2CD')] = this.convert(this.targetP2cdFormatted);
    this.targetP2cdFormatted = this.format(+this.targetP2cdFormatted)
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeComment() {
    let ref = this.comments!.get(0);
    if ( !ref ) return;
    this.target[DEH.getPositionOfAttr('structureTarget',  'commentTargetP2CD')] = ref.nativeElement.value;
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeTargetBassin() {
    if(!this.displayedInfos.bassin) {
      this.displayedInfos.bassin = this.target[DEH.getPositionOfAttr('structureTarget',  'bassin')];
      return;
    }
    this.target[DEH.getPositionOfAttr('structureTarget',  'bassin')] = this.displayedInfos.bassin;
    this.hasChanged = true;
    this.updateDirectives();
  } 
  changeTargetLight(newLightValue: string) {
    this.target[DEH.getPositionOfAttr('structureTarget',  'greenLight')] = newLightValue;
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeSales(i: number, j: number) { //careful : i and j seamingly inverted in the html
    let oldVolume = this.grid[i][j].volume; let newVolume = this.convert(this.gridFormatted[i][j]);
    if(Number.isNaN(newVolume)) {
      this.gridFormatted[i][j] = this.format(this.grid[i][j].volume);
      this.errorInput = true;
      setTimeout(() => this.errorInput = false, 1000)
      return;
    }
    this.errorInput = false;

    if(this.grid[i][j].date === 0) {this._pdv!.sales.push(this.grid[i][j].getData())} //if it's a new Sale

    this.gridFormatted[i][j] = newVolume.toString();

    this.updateValue(i,j, newVolume);
    this.salesColors[i][j] = 'black'
    this.grid[i][j].date = Math.floor(Date.now() / 1000);
    this.grid[i][j].industryId = +DEH.getKeyByValue(this.industryIdToIndex, i)!;
    this.grid[i][j].productId = +DEH.getKeyByValue(this.productIdToIndex, j)!

    this.updateSum(i,j, oldVolume, newVolume)
    this.hasChanged = true;
    this.updateDirectives();
  }
  changeTargetSale(){
    this.target[this.TARGET_SALE_ID] = !this.target[this.TARGET_SALE_ID];
    this.showNavigation = this.shouldShowNavigation()
    this.hasChanged = true;
    this.updateDirectives();
  }

  changeOnlySiniat() {
    this.isOnlySiniat = !this.isOnlySiniat;
    this.hasChanged = true;
    this.pdv!.changeOnlySiniat(this.isOnlySiniat);
    this.updateDirectives();
  }

  getMouseCoordinnates() {
    let e = window.event as any;
    this.mouseX = e.pageX;
    this.mouseY = e.pageY;
  }
}
