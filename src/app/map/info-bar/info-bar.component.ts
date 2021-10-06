import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
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

  industryIdToIndex : {[industryId: number]: number} = {}
  productIdToIndex : {[productId: number]: number} = {}


  get pdv() {
    return this._pdv;
  }

  private _pdv: PDV | undefined;
  redistributed?: boolean;

  getName(name: string) {
    return DataExtractionHelper.getNameOfRegularObject(name, this._pdv!.attribute(name));
  }

  constructor(private ref: ElementRef, private dataService: DataService, private filtersState: FiltersStatesService) {
    console.log('[InfobarComponent]: On');
    
    filtersState.$load.subscribe(() => {
      this.industries = PDV.getIndustries() as string[];
      this.products = PDV.getProducts() as string[];
      this.products.splice(3, this.products.length, 'P2CD')
      this.grid = new Array(this.industries.length + 1);
      for ( let i = 0; i < this.grid.length; i++ )
        this.grid[i] = new Array(this.products.length).fill(0);
      for(let i = 0; i<this.industries.length; i++)
        this.industryIdToIndex[+DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('industrie'), this.industries[i])!] = i+1; //first row already used
      for(let i = 0; i<this.products.length-1; i++)
        this.productIdToIndex[+DataExtractionHelper.getKeyByValue(DataExtractionHelper.get('produit'), this.products[i])!] = i;
      console.log("1 : ", this.industryIdToIndex)
      console.log("2 : ", this.productIdToIndex)
    });

    
  }

  //make variable
  getSalesVolumes() {
    return (this.pdv ? Object.entries(this.pdv.displayIndustrieSaleVolumes()) : []).filter(entry => entry[1] != 0);
  }

  quit(save: boolean) {
    this.quiting = false;
    let fn: any;
    this.ref!.nativeElement.addEventListener('transitionend', fn = (_: any) => {
      this.ref!.nativeElement.removeEventListener('transitionend', fn);
    });
    this.pdv = undefined;

    if(save) this.updatePdv(this._pdv!)

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
      console.log("update ", this.industryIdToIndex[sale[this.SALES_INDUSTRY_ID!]], this.productIdToIndex[sale[this.SALES_PRODUCT_ID!]])
      this.grid[this.industryIdToIndex[sale[this.SALES_INDUSTRY_ID!]]][this.productIdToIndex[sale[this.SALES_PRODUCT_ID!]]] = +sale[this.SALES_VOLUME_ID!]
      this.updateSum(this.industryIdToIndex[sale[this.SALES_INDUSTRY_ID!]], this.productIdToIndex[sale[this.SALES_PRODUCT_ID!]])
    }


  }

  updateSum(row: number, i: number) {
    let sum = 0, diff;
    for ( let j = 0; j < this.grid.length-1; j++ ) {
      sum += this.grid[j+1][i] | 0;
    }
    this.grid[0][i] = sum;
    diff = this.grid[row][0] + this.grid[row][1] + this.grid[row][2] - this.grid[row][3];
    this.grid[row][3] += diff;
    this.grid[0][3] += diff;
    return sum;
  }

  changeRedistributed() {
    this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID] = !this._pdv!.attribute('target')[this.TARGET_REDISTRIBUTED_ID]
  }

  changeTargetP2CD(newTargetP2cd: any) { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_VOLUME_ID] = +newTargetP2cd;
    console.log("this : ", this._pdv!.attribute('target'))
  }

  changeComment(newComment: string) { //PB : newValue isn't a number
    this._pdv!.attribute('target')[this.TARGET_COMMENT_ID] = newComment;
  }

  changeLight(newLightValue: string) {
    this._pdv!.attribute('target')[this.TARGET_LIGHT_ID] = newLightValue
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
    this.dataService.updatePdv(newPdv);
  }


}
