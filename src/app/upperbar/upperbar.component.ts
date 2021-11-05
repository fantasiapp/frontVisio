import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { PDV } from '../middle/Slice&Dice';
import { MapComponent } from '../map/map.component';
import { DataService } from '../services/data.service';
import { Params } from '../middle/DataExtractionHelper';
import { SubscriptionManager } from '../interfaces/Common';


@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css'],
})
export class UpperbarComponent extends SubscriptionManager {
  sldValue: number = 1;
  isFilterVisible = false;
  searchModel: string = '';
  updating: boolean = false;
  @Output() onChange: EventEmitter<any> = new EventEmitter<{ value: string }>();
  @Output() mapVisible: EventEmitter<boolean> = new EventEmitter();
  
  @ViewChild('map', {read: MapComponent, static: false})
  mapComponent?: MapComponent;

  constructor(private filtersState: FiltersStatesService, private dataService: DataService) {
    super();
  }

  ngOnInit(): void {
    this.subscribe(this.filtersState.stateSubject, ({States}) => {
      this.sldValue = this.filtersState.tree?.hasTypeOf(PDV.geoTree) ? 1 : 0;
    });

    this.subscribe(this.filtersState.filtersVisible, (val) => {
      this.isFilterVisible = val;
    });
  }

  showFilters() {
    this.isFilterVisible = !this.filtersState.filtersVisible.getValue();
    this.filtersState.filtersVisible.next(this.isFilterVisible);
  }

  toggle() {
    this.sldValue = 1 - this.sldValue;
    this.filtersState.setTree(
      this.sldValue ? PDV.geoTree : PDV.tradeTree
    );
  }

  onAnimationEnd() { this.updating = false; }

  get name() {
    return Params.rootName || 'national';
  }

  get mapIsVisible() {
    return this.mapComponent?.shown ? true : false;
  }

  get hideIfMapIsVisible() {
    return this.mapIsVisible ? 'hidden' : 'visible';
  }

  toggleMap() {
    if ( !this.mapComponent?.shown ) {
      this.mapComponent!.show();
      // //Transition to PDV.geoTree
      // if ( this.filtersState.treeIs(PDV.tradeTree) )
      //   this.filtersState.reset(PDV.geoTree, false);      
      this.mapVisible.emit(true);
    } else {
      this.mapComponent?.hide();
      this.mapVisible.emit(false);
    }
  }

  updateData() {
    this.dataService.requestData();
  }

  @Output()
  displayPDV = new EventEmitter<number>();

  displayPDVOnMap(pdv: PDV) {
    this.mapComponent?.show();
    this.mapComponent?.focusPDV(pdv);
  }
  
  displayPDVOnTable(pdv: PDV) {
    if ( this.mapComponent?.shown )
      return this.displayPDVOnMap(pdv);
    
    let transition = this.filtersState.gotoPDVsDashboard();
    if ( !transition )
      this.displayPDVOnMap(pdv);
    else
      this.displayPDV.emit(pdv.id);
  }
}
