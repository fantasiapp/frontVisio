import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { DataService } from 'src/app/services/data.service';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { ValueFormatted, formatStringToNumber, formatNumberToString } from 'src/app/general/valueFormatter';
import { SliceTable } from 'src/app/middle/SliceTable';


@Component({
  selector: 'info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoBarComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  quiting: boolean = false;
  errorAdInput: boolean = false;

  @ViewChildren('comments')
  private comments?: QueryList<ElementRef>;
  
  @Input()
  set pdv(value: PDV | undefined) {
    this._pdv = value;
    this.opened = value ? true : false;
    this.currentIndex = 0;
    this.pdvChange.emit(value);
    if ( value ) {
      InfoBarComponent.valuesSave = JSON.parse(JSON.stringify(value.getValues())); //Values deepcopy
      InfoBarComponent.pdvId = value.id;
      this.redistributedDisabled = !value.attribute('redistributed')
      this.doesntSellDisabled = !value.attribute('sale')
      this.target = this._pdv!.attribute('target')
      this.targetP2cdFormatted = formatNumberToString(this.target[this.TARGET_VOLUME_ID] || 0);
      this.redistributedChecked = (this.target ? !this.target[this.TARGET_REDISTRIBUTED_ID] : false) || !value.attribute('redistributed');
      this.doesntSellChecked = (this.target ? !this.target[this.TARGET_SALE_ID]: false) || !value.attribute('sale')
      this.loadGrid()
    }
    this.logger.handleEvent(LoggerService.events.PDV_SELECTED, value?.id);
    this.logger.actionComplete();
  }

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;

  industries: string[] = [];//(PDV.getIndustries() as string[]);
  products: string[] = [];//PDV.getProducts() as string[];
  grid: number[][] = [];
  gridFormatted: string[][] = [];
  targetP2cdFormatted: string = "";
  salesColors: string[][] = [];

  SALES_INDUSTRY_ID;
  SALES_PRODUCT_ID;
  SALES_VOLUME_ID;
  SALES_DATE_ID;
  TARGET_VOLUME_ID;
  TARGET_LIGHT_ID;
  TARGET_REDISTRIBUTED_ID;
  TARGET_SALE_ID;
  TARGET_COMMENT_ID;

  redistributedDisabled: boolean = false;
  redistributedChecked: boolean = false;
  doesntSellDisabled: boolean = false;
  doesntSellChecked: boolean = false;


  industryIdToIndex : {[industryId: number]: number} = {}
  productIdToIndex : {[productId: number]: number} = {}
  hasChanged = false;

  myFormatNumberToString = formatNumberToString;

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  target?: any;
  static valuesSave: any[] = [];
  static pdvId: number = 0;
  redistributed?: boolean;

  getName(name: string) {
    return DataExtractionHelper.getNameOfRegularObject(name, this._pdv!.attribute(name));
  }

  constructor(private ref: ElementRef, private dataService: DataService, private filtersState: FiltersStatesService, private logger: LoggerService) {
    console.log('[InfobarComponent]: On')
    this.SALES_INDUSTRY_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'industry')
    this.SALES_PRODUCT_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'product')
    this.SALES_VOLUME_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'volume')
    this.SALES_DATE_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'date')
    this.TARGET_VOLUME_ID = DataExtractionHelper.TARGET_VOLUME_ID;
    this.TARGET_LIGHT_ID = DataExtractionHelper.TARGET_LIGHT_ID;
    this.TARGET_REDISTRIBUTED_ID = DataExtractionHelper.TARGET_REDISTRIBUTED_ID;
    this.TARGET_SALE_ID = DataExtractionHelper.TARGET_SALE_ID;
    this.TARGET_COMMENT_ID = DataExtractionHelper.TARGET_COMMENT_ID;

    
    filtersState.$load.subscribe(() => {
      this.industries = Object.values(DataExtractionHelper.get('labelForGraph') as []).filter((entry) => entry[0] == 'industryP2CD').map((entry) => entry = entry[1]) as string[];
      this.products = PDV.getProducts() as string[];
      this.products.splice(3, this.products.length, 'P2CD')
      for(let i = 0; i<this.industries.length; i++)
        this.industryIdToIndex[+DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('industrie'), this.industries[i])!] = i+1; //first row already used
      for(let i = 0; i<this.products.length-1; i++)
        this.productIdToIndex[+DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('produit'), this.products[i])!] = i;
    });
  }

  //make variable
  getSalesVolumes() {
    return (this.pdv ? Object.entries(this.pdv.displayIndustrieSaleVolumes()) : []).filter(entry => entry[1] != 0);
  }

  quit(save: boolean) {
    if(save && this.hasChanged) this.updatePdv(this._pdv!);
    else this._pdv!.setValues(InfoBarComponent.valuesSave)
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
      this.pdv = undefined; //force quit
  }

  setPage(index: number) {
    this.currentIndex = index % this.pages.length;
  }

  loadGrid() {
    // console.log("Id retenus : ", this.productIdToIndex)
    // console.log("Sales totales : ", this._pdv!.attribute("sales"))
    // console.log("Sales retenues : ", this._pdv!.attribute('sales').filter((sale: any) => Object.keys(this.productIdToIndex).includes(sale[DataExtractionHelper.SALES_PRODUCT_ID].toString())))
    this.grid = new Array(this.industries.length + 1);
    this.gridFormatted = new Array(this.industries.length+1);
    this.salesColors = new Array(this.industries.length + 1);
    for ( let i = 0; i < this.grid.length; i++ ) {
      this.grid[i] = new Array(this.products.length).fill(0);
      this.gridFormatted[i] = new Array(this.products.length).fill('');
      this.salesColors[i] = new Array(this.products.length).fill('red');
    }
    for(let sale of this._pdv!.attribute('sales').filter((sale: any) => Object.keys(this.productIdToIndex).includes(sale[DataExtractionHelper.SALES_PRODUCT_ID].toString()))) {
      let i = this.industryIdToIndex[sale[DataExtractionHelper.SALES_INDUSTRY_ID!]], j = this.productIdToIndex[sale[DataExtractionHelper.SALES_PRODUCT_ID!]];
      this.grid[i][j] = +sale[DataExtractionHelper.SALES_VOLUME_ID!]
      this.gridFormatted[i][j] = formatNumberToString(sale[DataExtractionHelper.SALES_VOLUME_ID!]);
      this.updateSum(i,j)
      this.salesColors[i][j] = this.getSaleColor(sale);
    }
    for(let row = 0; row < this.industries.length; row++)
      this.salesColors[row][3] = 'black'
  }

  getSaleColor(sale: number[]): string {
    if(this._pdv!.attribute('sale') === false || this._pdv!.attribute('onlySiniat') === true || sale[DataExtractionHelper.SALES_INDUSTRY_ID] == DataExtractionHelper.INDUSTRIE_SINIAT_ID) return 'black'
    if(Math.floor(Date.now()/1000) - 15778476 > sale[DataExtractionHelper.SALES_DATE_ID]) return 'orange'
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
    this.redistributedChecked = !this.redistributedChecked
    if(!this.target) this.target = SliceTable.initializeTarget()
    this.target[DataExtractionHelper.TARGET_REDISTRIBUTED_ID] = !this.target[this.TARGET_REDISTRIBUTED_ID]
    this.hasChanged = true;
  }

  changeTargetP2CD() {
    if(!this.target) this.target = SliceTable.initializeTarget()
    this.targetP2cdFormatted = formatStringToNumber(this.targetP2cdFormatted).toString();
    if(Number.isNaN(+this.targetP2cdFormatted)) {
      this.targetP2cdFormatted = formatNumberToString(this.target[this.TARGET_VOLUME_ID]);
      return;
    }
    this.target[this.TARGET_VOLUME_ID] = +this.targetP2cdFormatted;
    this.targetP2cdFormatted = formatNumberToString(this.target[this.TARGET_VOLUME_ID])
    console.log("newTargetFormatted : ", this.targetP2cdFormatted)
    this.hasChanged = true;
  }

  changeComment() { //PB : newValue isn't a number
    let ref = this.comments!.get(0); //<- the current text area is the first in view
    if ( !ref ) return;
    if(!this.target) this.target = SliceTable.initializeTarget()
    this.target[this.TARGET_COMMENT_ID] = ref.nativeElement.value;
    this.hasChanged = true;
  }

  changeLight(newLightValue: string) {
    if(!this.target) this.target = SliceTable.initializeTarget()
    this.target[this.TARGET_LIGHT_ID] = newLightValue
    this.hasChanged = true;
  }

  changeSales(i: number, j: number) { //careful : i and j seamingly inverted in the html
    this.gridFormatted[i][j] = formatStringToNumber(this.gridFormatted[i][j]).toString();
    if(Number.isNaN(+this.gridFormatted[i][j])) {
      this.gridFormatted[i][j] = formatNumberToString(this.grid[i][j]);
      this.errorAdInput = true;
      return;
    }
    this.errorAdInput = false;
    this.salesColors[i][j] = 'black'
    this.grid[i][j] = +this.gridFormatted[i][j];
    this.gridFormatted[i][j] = formatNumberToString(this.grid[i][j]);
    this.updateSum(i,j)

    for(let sale of this._pdv!.attribute('sales')) {
      if(i === this.industryIdToIndex[sale[this.SALES_INDUSTRY_ID!]] && j === this.productIdToIndex[sale[this.SALES_PRODUCT_ID!]]) {
        sale[this.SALES_VOLUME_ID!] = this.grid[i][j];
        sale[this.SALES_DATE_ID!] = Math.floor(Date.now() / 1000);
        this.hasChanged = true;
        return;
      }
    }
    //arriving here means that a new sale has to be created
    this._pdv!.attribute('sales').push([
      Math.floor(Date.now() / 1000),
      +DataExtractionHelper.getKeyByValue(this.industryIdToIndex, i)!,
      +DataExtractionHelper.getKeyByValue(this.productIdToIndex, j)!,
      this.grid[i][j]
    ]);
    this.hasChanged = true;
    return;
  }

  changeTargetSale(){
    if(!this.target) this.target = SliceTable.initializeTarget()
    this.doesntSellChecked = !this.doesntSellChecked;
    this.target[this.TARGET_SALE_ID] = !this.doesntSellChecked;
    this.target[this.TARGET_LIGHT_ID] = 'r'
    this.hasChanged = true;
  }

  pdvFromPDVToList(pdv: PDV) { //suitable format to update back, DataExtractionHelper, and then the rest of the application
    let pdvAsList = []
    for(let field of DataExtractionHelper.getPDVFields()) {
      if(field == 'target') pdvAsList.push(this.target)
      else pdvAsList.push(pdv.attribute(field))
    }
    return pdvAsList;
  }

  updatePdv(pdv: PDV) { //Field that may be changed here : target.commentTargetP2CD, target.redistributed, target.greenLight, target.targetP2CD
    let newPdv = this.pdvFromPDVToList(pdv);
    this.dataService.updatePdv(newPdv, InfoBarComponent.pdvId);
    this.hasChanged = false;
  }
}
