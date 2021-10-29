import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DEH from 'src/app/middle/DataExtractionHelper';
import { PDV, Sale } from 'src/app/middle/Slice&Dice';
import { DataService } from 'src/app/services/data.service';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { disabledParams } from 'src/app/behaviour/disabled-conditions'
import { formatStringToNumber, formatNumberToString } from 'src/app/general/valueFormatter';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

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
  
  @Input()
  set pdv(value: PDV | undefined) {
    this.opened = value ? true : false;
    this.currentIndex = 0;
    this.pdvChange.emit(value);
    if ( value ) {
      this._pdv = new PDV(-1, value.getValues());
      this._pdv.updateField('target', PDV.initializeTarget())
      this.target = <any[]>this._pdv.target
      this.displayedInfos = this.extractDisplayedInfos(this.pdv!);
      this.redistributedDisabled = !this.pdv!.redistributed || !this.noSales();
      this.doesntSellDisabled = !this.pdv!.sale || !this.noSales();
      this.targetP2cdFormatted = formatNumberToString((this.pdv!.target as any[])[DEH.TARGET_VOLUME_ID]);
      this.target[this.TARGET_REDISTRIBUTED_ID] = (this.pdv!.target as any[])[DEH.TARGET_REDISTRIBUTED_ID] && this.pdv!.redistributed;
      this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID] = (this.pdv!.target as any[])[DEH.TARGET_REDISTRIBUTED_FINITIONS_ID] && this.pdv!.redistributedFinitions;
      this.target[this.TARGET_SALE_ID] = (this.pdv!.target as any[])[DEH.TARGET_SALE_ID] && this.pdv!.sale
      this.showNavigation = this.target[this.TARGET_REDISTRIBUTED_ID] && this.target[this.TARGET_SALE_ID]
      this.isOnlySiniat = this.pdv!.onlySiniat
      this.loadGrid();
    }
    this.logger.handleEvent(LoggerService.events.PDV_SELECTED, value?.id);
    this.logger.actionComplete();
  }
  @Input()
  display: string = 'p2cd';
  @Input()

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;
  target: any[] = [];

  industries: string[] = [];
  products: string[] = [];
  grid: number[][] = [];
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

  redistributedDisabled: boolean = false;
  doesntSellDisabled: boolean = false;
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
      if(sale[DEH.SALES_INDUSTRY_ID] != DEH.INDUSTRIE_SINIAT_ID && sale[DEH.SALES_VOLUME_ID] > 0) {
        return true;
      }
      }
      return false;
  }

  myFormatNumberToString = formatNumberToString;

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  displayedInfos: {[field: string]: any} = {};
  redistributed?: boolean;

  extractDisplayedInfos(pdv: PDV) {
    return {
      name: this.pdv!.name,
      agent: this.pdv!.get('agent'),
      segmentMarketing: this.pdv!.get('segmentMarketing'),
      segmentCommercial: this.pdv!.get('segmentCommercial'),
      enseigne: this.pdv!.get('enseigne'),
      dep: this.pdv!.get('dep'),
      ville: this.pdv!.get('ville'),
      bassin: this.pdv!.get('bassin'),
      clientProspect: this.pdv!.clientProspect2(),
      nbVisits: this.pdv!.nbVisits,
      siniatP2cdSales: Math.round(this.pdv!.graph.p2cd['Siniat'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      placoP2cdSales: Math.round(this.pdv!.graph.p2cd['Placo'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      knaufP2cdSales: Math.round(this.pdv!.graph.p2cd['Knauf'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      totalP2cdSales: Math.round(this.pdv!.graph.p2cd['Siniat'].value + this.pdv!.graph.p2cd['Placo'].value + this.pdv!.graph.p2cd['Knauf'].value + this.pdv!.graph.p2cd['Autres'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      pregyEnduitSales: Math.round(this.pdv!.graph.enduit['Prégy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      salsiEnduitSales: Math.round(this.pdv!.graph.enduit['Salsi'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      potential: Math.round(this.pdv!.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      totalSiniatEnduitSales: Math.round(this.pdv!.potential + this.pdv!.graph.enduit['Salsi'].value + this.pdv!.graph.enduit['Prégy'].value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      totalEnduitSales: Math.round(this.pdv!.graph.enduit['Prégy'].value + this.pdv!.graph.enduit['Salsi'].value + this.pdv!.potential).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '),
      typology: this.pdv!.typology,
    }
  }

  constructor(private ref: ElementRef, private dataService: DataService, private filtersState: FiltersStatesService, private logger: LoggerService) {
    console.log('[InfobarComponent]: On')
    this.SALES_INDUSTRY_ID = DEH.getKeyByValue(DEH.get("structureSales"), 'industry')
    this.SALES_PRODUCT_ID = DEH.getKeyByValue(DEH.get("structureSales"), 'product')
    this.SALES_VOLUME_ID = DEH.getKeyByValue(DEH.get("structureSales"), 'volume')
    this.SALES_DATE_ID = DEH.getKeyByValue(DEH.get("structureSales"), 'date')
    this.TARGET_VOLUME_ID = DEH.TARGET_VOLUME_ID;
    this.TARGET_LIGHT_ID = DEH.TARGET_LIGHT_ID;
    this.TARGET_REDISTRIBUTED_ID = DEH.TARGET_REDISTRIBUTED_ID;
    this.TARGET_SALE_ID = DEH.TARGET_SALE_ID;
    this.TARGET_COMMENT_ID = DEH.TARGET_COMMENT_ID;
    this.TARGET_REDISTRIBUTED_FINITIONS_ID = DEH.TARGET_REDISTRIBUTED_FINITIONS_ID;

    
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

  quit(save: boolean) {
    if(save && this.hasChanged) this.updatePdv(this.pdv!);
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
    // console.log("Id retenus : ", this.productIdToIndex)
    // console.log("Sales totales : ", this.pdv!.attribute("sales"))
    // console.log("Sales retenues : ", this.pdv!.attribute('sales').filter((sale: any) => Object.keys(this.productIdToIndex).includes(sale[DEH.SALES_PRODUCT_ID].toString())))
    this.grid = new Array(this.industries.length + 1);
    this.gridFormatted = new Array(this.industries.length+1);
    this.salesColors = new Array(this.industries.length + 1);
    for ( let i = 0; i < this.grid.length; i++ ) {
      this.grid[i] = new Array(this.products.length).fill(0);
      this.gridFormatted[i] = new Array(this.products.length).fill('');
      this.salesColors[i] = new Array(this.products.length).fill('red');
    }
    for(let sale of this.pdv!.salesObject) {
      let i = this.industryIdToIndex[sale.industryId], j = this.productIdToIndex[sale.productId];
      this.grid[i][j] = sale.volume
      this.gridFormatted[i][j] = formatNumberToString(sale.volume);
      this.updateSum(i,j)
      this.salesColors[i][j] = this.getSaleColor(sale);
    }
    for(let row = 0; row < this.industries.length; row++)
      this.salesColors[row][3] = 'black'
  }

  getSaleColor(sale: Sale): string {
    if(this.pdv!.sale === false || this.pdv!.onlySiniat === true || sale.industryId == DEH.INDUSTRIE_SINIAT_ID) return 'black'
    if(Math.floor(Date.now()/1000) - 15778476 > sale.date) return 'orange'
    else return 'black'
}

  onKey(event: any) {
    if(event.keyCode === 37) console.log("Left")
    if(event.keyCode === 38) console.log("Up")
    if(event.keyCode === 39) console.log("Right")
    if(event.keyCode === 40) console.log("Down")
  }

  updateSum(row: number, i: number) {
    let sum = 0, diff;
    for ( let j = 0; j < this.grid.length-1; j++ ) {
      sum += this.grid[j+1][i] | 0;
    }
    this.grid[0][i] = sum;
    this.gridFormatted[0][i] = formatNumberToString(sum);
    diff = this.grid[row][0] + this.grid[row][1] + this.grid[row][2] - this.grid[row][3];
    this.grid[row][3] += diff;
    this.grid[0][3] += diff;
    this.gridFormatted[row][3] = formatNumberToString(this.grid[row][3]);
    this.gridFormatted[0][3] = formatNumberToString(this.grid[0][3]);
    return sum;
  }

  changeRedistributed() {
      this.target[this.TARGET_REDISTRIBUTED_ID] = !this.target[this.TARGET_REDISTRIBUTED_ID]
      this.showNavigation = !this.target[this.TARGET_SALE_ID] != true && this.target[this.TARGET_REDISTRIBUTED_ID]!=true
      this.hasChanged = true;
  }
  changeRedistributedFinitions() {
    this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID] = !this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID]
    this.showNavigation = this.target[this.TARGET_SALE_ID] != true && this.target[this.TARGET_REDISTRIBUTED_FINITIONS_ID]!=true
    this.hasChanged = true;
  }


  changeTargetP2CD() {
    this.targetP2cdFormatted = formatStringToNumber(this.targetP2cdFormatted).toString();
    if(Number.isNaN(+this.targetP2cdFormatted)) {
      this.targetP2cdFormatted = formatNumberToString((this.pdv!.target as any[])[DEH.TARGET_VOLUME_ID]);
      this.errorInput = true;
      setTimeout(() => this.errorInput = false, 1000);
      return;
    }
    this.targetP2cdFormatted = formatNumberToString(+this.targetP2cdFormatted)
    this.hasChanged = true;
  }

  changeComment() { //PB : newValue isn't a number
    let ref = this.comments!.get(0); //<- the current text area is the first in view
    if ( !ref ) return;
    this.hasChanged = true;

  }

  changeTargetBassin() {
      this.hasChanged = true;
  } 

  changeTargetLight(newLightValue: string) {
    this.hasChanged = true;
  }

  changeSales(i: number, j: number) { //careful : i and j seamingly inverted in the html
    this.gridFormatted[i][j] = formatStringToNumber(this.gridFormatted[i][j]).toString();
    if(Number.isNaN(+this.gridFormatted[i][j])) {
      this.gridFormatted[i][j] = formatNumberToString(this.grid[i][j]);
      this.errorInput = true;
      setTimeout(() => this.errorInput = false, 1000)
      return;
    }
    this.errorInput = false;
    this.salesColors[i][j] = 'black'
    this.grid[i][j] = +this.gridFormatted[i][j];
    this.gridFormatted[i][j] = formatNumberToString(this.grid[i][j]);
    this.updateSum(i,j)

    for(let sale of this.pdv!.salesObject) {
      if(i === this.industryIdToIndex[sale.industryId] && j === this.productIdToIndex[sale.productId]) {
        sale.volume = this.grid[i][j];
        sale.date = Math.floor(Date.now() / 1000);
        this.hasChanged = true;
        this.redistributedDisabled = !this.pdv!.redistributed || !this.noSales();
        this.doesntSellDisabled = !this.pdv!.sale || !this.noSales();
        return;
      }
    }
    //arriving here means that a new sale has to be created
    this.pdv!.salesObject.push(new Sale([
      Math.floor(Date.now() / 1000),
      +DEH.getKeyByValue(this.industryIdToIndex, i)!,
      +DEH.getKeyByValue(this.productIdToIndex, j)!,
      this.grid[i][j]
    ]));
    this.hasChanged = true;
    return;
  }

  changeTargetSale(){
      this.target[this.TARGET_SALE_ID] = !this.target[this.TARGET_SALE_ID];
      this.showNavigation = this.target[this.TARGET_SALE_ID] != true && this.target[this.TARGET_REDISTRIBUTED_ID]!=true
      this.hasChanged = true;
  }
  changeOnlySiniat() {
    if(this.noSales()) {
      this.isOnlySiniat = !this.isOnlySiniat;
      this.hasChanged = true;
    }
  }

  noSales(): boolean { //check if they are no sales, or only with a null volume (other than Siniat)
    for(let sale of this.pdv!.salesObject) {
      if(sale.industryId != DEH.INDUSTRIE_SINIAT_ID && sale.volume > 0)
        return false;
    }
    return true;
  }

  getMouseCoordinnates() {
    let e = window.event as any;
    this.mouseX = e.pageX;
    this.mouseY = e.pageY;
  }

  pdvFromPDVToList(pdv: PDV) { //suitable format to update back, DataExtractionHelper, and then the rest of the application
    let pdvAsList = pdv.getValues();
    pdvAsList[PDV.index('onlySiniat')] = this.isOnlySiniat
    pdvAsList[PDV.index('target')] = this.pdv!.target
    return pdvAsList;
  }

  updatePdv(pdv: PDV) { //Field that may be changed here : target.commentTargetP2CD, target.redistributed, target.greenLight, target.targetP2CD
    let newPdv = this.pdvFromPDVToList(pdv);
    this.dataService.updatePdv(newPdv, pdv.id);
    this.hasChanged = false;
  }
}
