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
    private dataService: DataService,
    private localStorageService: LocalStorageService
  ) {
    this.subscription = this.filtersState.stateSubject.subscribe(({States}) => {
      this.sldValue = this.filtersState.tree?.type == NavigationExtractionHelper ? 1 : 0;
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
    return new Observable<string>((observer) => {
      this.filtersState.$load.subscribe(_ => {
        observer.next(PDV.geoTree.root.name || 'national');
      });
    });
  }

  onAnimationEnd() {
    this.updating = false;
  }

  get switchIsVisible() {
    return this.mapComponent?.shown ? false : true;
  }

  toggleMap() {
    if ( !this.mapComponent?.shown ) {
      this.mapComponent!.show();
      if ( this.filtersState.tree && this.filtersState.tree.type === TradeExtrationHelper )
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
}
