import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { getGeoTree, getTradeTree, PDV } from '../middle/Slice&Dice';
import { MapComponent } from '../map/map.component';
import {  Observable, Subscription } from 'rxjs';
import { DataService } from '../services/data.service';
import { LocalStorageService } from '../services/local-storage.service';
import { NavigationExtractionHelper, TradeExtrationHelper } from '../middle/DataExtractionHelper';


@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css'],
})
export class UpperbarComponent implements OnInit, OnDestroy {
  sldValue: number = 1;
  isFilterVisible = false;
  searchModel: string = '';
  searchDebounceId!: number;
  updating: boolean = false;
  @Output() onChange: EventEmitter<any> = new EventEmitter<{ value: string }>();

  @Output() mapVisible: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('map', {read: MapComponent, static: false})
  mapComponent?: MapComponent;

  isSearchOpen = new BehaviorSubject(false);

  private subscription?: Subscription;;
  constructor(
    private filtersState: FiltersStatesService,
    private dataService: DataService
  ) {
    this.subscription = this.filtersState.stateSubject.subscribe(({States}) => {
      this.sldValue = this.filtersState.navigation.tree?.type == NavigationExtractionHelper ? 1 : 0;
    });
  }
  shouldShowButtons = false;

  ngOnInit(): void {
    this.filtersState.filtersVisible.subscribe(
      (val) => (this.isFilterVisible = val)
    );
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
  showFilters() {
    this.isFilterVisible = !this.filtersState.filtersVisible.getValue();
    this.filtersState.filtersVisible.next(this.isFilterVisible);
  }
  updateSearchData(searchValue: string) {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
  }
  toggleSearch() {
    this.isSearchOpen.next(!this.isSearchOpen.getValue());
    this.isSearchOpen.subscribe((val) => (this.shouldShowButtons = val));
  }
  toggle() {
    this.sldValue = 1 - this.sldValue;
    this.filtersState.reset(
      this.sldValue ? getGeoTree() : getTradeTree()
    );
  }

  getName() {
    return PDV.geoTree.root.name || 'national';
  }

  onAnimationEnd() {
    this.updating = false;
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
      if ( this.filtersState.navigation.tree && this.filtersState.navigation.tree.type === TradeExtrationHelper )
        this.filtersState.reset(PDV.geoTree, false);      
      this.mapVisible.emit(true);
    } else {
      this.mapComponent?.hide();
      this.mapVisible.emit(false);
    }
  }

  updateData() {
    this.dataService.requestData();
  }

  //Baptise use this to switch to table and show pdv
  displayPDVOnMap(pdv: PDV) {
    this.mapComponent?.show();
    this.mapComponent?.focusPDV(pdv);
  }

  @Output()
  displayPDV = new EventEmitter<number>();
  
  displayPDVOnTable(pdv: PDV) {
    let transition = this.filtersState.gotoPDVsDashboard();
    if ( !transition ) {
      this.displayPDVOnMap(pdv);
    } else {
      this.displayPDV.emit(pdv.id);
    }
  }
}
