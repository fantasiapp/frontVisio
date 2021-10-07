import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import { of } from 'rxjs';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { BasicWidget } from 'src/app/widgets/BasicWidget';
import { DataService } from 'src/app/services/data.service';

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

  @ViewChild('comments', {static: false, read: ElementRef})
  private comment?: ElementRef;
  
  @Input()
  set pdv(value: PDV | undefined) {
    this._pdv = value;
    this.opened = value ? true : false;
    this.currentIndex = 0;
    this.pdvChange.emit(value);
    if ( value ) {
      let target = value!.getLightTarget();
      this.targetClass = { 'r': target == 'r', 'g': target == 'g', 'o': target == 'o' };
    } 
  }

  @Output()
  pdvChange = new EventEmitter<PDV | undefined>();

  pages: string[] = ['Référentiel', 'Ciblage', 'Saisie de l\'AD'];
  currentIndex: number = 0;

  industries: string[] = [];//(PDV.getIndustries() as string[]);
  products: string[] = [];//PDV.getProducts() as string[];
  grid: number[][] = [];
  gridFormatted: string[][] = [];
  targetClass: any = {
    'r': false,
    'g': false,
    'o': false
  };

  TARGET_SALE_ID = DataExtractionHelper.TARGET_SALE_ID;
  TARGET_REDISTRIBUTED_ID = DataExtractionHelper.TARGET_REDISTRIBUTED_ID;
  TARGET_VOLUME_ID = DataExtractionHelper.TARGET_VOLUME_ID;
  TARGET_COMMENT_ID = DataExtractionHelper.TARGET_COMMENT_ID;
  TARGET_LIGHT_ID = DataExtractionHelper.TARGET_LIGHT_ID;
  SALES_INDUSTRY_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'industry')
  SALES_PRODUCT_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'product')
  SALES_VOLUME_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'volume')
  SALES_DATE_ID = DataExtractionHelper.getKeyByValue(DataExtractionHelper.get("structureSales"), 'date')

  industryIdToIndex : {[industryId: number]: number} = {}
  productIdToIndex : {[productId: number]: number} = {}
  hasChanged = false;

  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  static valuesSave: any[] = [];
  static pdvId: number = 0;
  redistributed?: boolean;

  getName(name: string) {
    return DataExtractionHelper.getNameOfRegularObject(name, this._pdv!.attribute(name));
  }

  constructor(private ref: ElementRef, private dataService: DataService, private filtersState: FiltersStatesService) {
    console.log('[InfobarComponent]: On');
    
    filtersState.$load.subscribe(() => {
      this.industries = Object.values(DataExtractionHelper.get('labelForGraph') as []).filter((entry) => entry[0] == 'industryP2CD').map((entry) => entry = entry[1]) as string[];
      this.products = PDV.getProducts() as string[];
      this.products.splice(3, this.products.length, 'P2CD')
      this.grid = new Array(this.industries.length + 1);
      this.gridFormatted = new Array(this.industries.length+1);
      for ( let i = 0; i < this.grid.length; i++ ) {
        this.grid[i] = new Array(this.products.length).fill(0);
        this.gridFormatted[i] = new Array(this.products.length).fill(0);
      }
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
    if(save && this.hasChanged) this.updatePdv(this._pdv!)
    else this._pdv!.setValues(InfoBarComponent.valuesSave)
    this.quiting = false;
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.pdv = undefined;
  }

  requestQuit() {
    //show the quit bar
    this.quiting = true;
  }

  setPage(index: number) {
    this.currentIndex = index % this.pages.length;
    if(index === 2) this.loadGrid()
  }

  loadGrid() {
    for(let sale of this._pdv!.attribute('sales')) {
      let i = this.industryIdToIndex[sale[this.SALES_INDUSTRY_ID!]], j = this.productIdToIndex[sale[this.SALES_PRODUCT_ID!]];
      this.grid[i][j] = +sale[this.SALES_VOLUME_ID!]
      this.gridFormatted[i][j] = Math.floor(+sale[this.SALES_VOLUME_ID!]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      this.updateSum(i,j)
    }


  }

  updateSum(row: number, i: number) {
    let sum = 0, diff;
    for ( let j = 0; j < this.grid.length-1; j++ ) {
      sum += this.grid[j+1][i] | 0;
    }
    this.grid[0][i] = sum;
    this.gridFormatted[0][i] = Math.floor(sum).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    diff = this.grid[row][0] + this.grid[row][1] + this.grid[row][2] - this.grid[row][3];
    this.grid[row][3] += diff;
    this.grid[0][3] += diff;
    this.gridFormatted[row][3] = Math.floor(this.grid[row][3]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    this.gridFormatted[0][3] = Math.floor(this.grid[0][3]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return sum;
  }

  formatVolume(x: number) {
    return BasicWidget.format(x, 3);
  }
  changeRedistributed() {
    this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID] = !this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID]
    this.hasChanged = true;
  }

  changeTargetP2CD(newTargetP2cd: any) { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_VOLUME_ID] = +newTargetP2cd;
    this.hasChanged = true;
  }

  changeComment() { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_COMMENT_ID] = this.comment!.nativeElement.innerText;
    this.hasChanged = true;
  }

  changeLight(newLightValue: string) {
    this._pdv!.attribute('target')[this.TARGET_LIGHT_ID] = newLightValue
    this.hasChanged = true;
  }

  changeSales(i: number, j: number) { //careful : i and j seamingly inverted in the html
    if(Number.isNaN(+this.gridFormatted[i][j])) {
      this.gridFormatted[i][j] = Math.floor(this.grid[i][j]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      this.errorAdInput = true;
      return;
    }
    this.errorAdInput = false;
  
    this.grid[i][j] = +this.gridFormatted[i][j];
    this.gridFormatted[i][j] = Math.floor(+this.gridFormatted[i][j]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
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

  pdvFromPDVToList(pdv: PDV) { //suitable format to update back, DataExtractionHelper, and then the rest of the application
    let pdvAsList = []
    for(let field of DataExtractionHelper.getPDVFields()) {
      pdvAsList.push(pdv.attribute(field))
    }
    return pdvAsList;
  }

  updatePdv(pdv: PDV) { //Field that may be changed here : target.commentTargetP2CD, target.redistributed, target.greenLight, target.targetP2CD
    let newPdv = this.pdvFromPDVToList(pdv);
    console.log("[InfoBar] newPdv : ", newPdv)
    this.dataService.updatePdv(newPdv, InfoBarComponent.pdvId);
    this.hasChanged = false;
  }


}
