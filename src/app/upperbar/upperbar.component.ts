import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { getGeoTree, getTradeTree, PDV } from '../middle/Slice&Dice';

import {
  trigger,
  state,
  style,
  animation,
  transition,
  animate
} from '@angular/animations';
import { SliceDice } from '../middle/Slice&Dice';
import { MapComponent } from '../map/map.component';
import { combineLatest } from 'rxjs';
import { BasicWidget } from '../widgets/BasicWidget';


@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css'],

  animations: [
    //here go animation triggers
    trigger('openClose', [
      state('open', style({
        width: '150px'
      })),
      state('closed', style({
        width:  '0px'
      })),
      transition('closed => open', [
        animate('.4s ease-out')
      ])
    ])
  ]
})
export class UpperbarComponent implements OnInit {
  sldValue: number = 1;
  isFilterVisible = false;
  searchModel: string = '';
  searchDebounceId!: number;
  @Output() onChange: EventEmitter<any> = new EventEmitter<{ value: string }>();

  @ViewChild('map', {read: MapComponent, static: false})
  mapComponent?: MapComponent;

  private path: any = {};

  isSearchOpen = new BehaviorSubject(false);
  constructor(
    private filtersState: FiltersStatesService,
    private authService: AuthService,
    private sliceDice: SliceDice
  ) {}
  shouldShowButtons = false;

  ngOnInit(): void {
    this.filtersState.filtersVisible.subscribe(
      (val) => (this.isFilterVisible = val)
    );

    this.filtersState.$path.subscribe(
      (path) => {
        if ( BasicWidget.shallowObjectEquality(this.path, path) )
          return;
        
        this.path = path;
        if ( this.mapComponent?.shown ) {
          this.mapComponent!.removeMarkers();
          this.mapComponent!.setPDVs(
            PDV.sliceTree(this.path, this.filtersState.tree == getGeoTree())[0]
          );
        }
      }
    );
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
  logOut() {
    this.authService.logoutFromServer();
  }
  toggle() {
    this.sldValue = 1 - this.sldValue;
    this.sliceDice.geoTree = this.sldValue ? true : false;
    this.filtersState.reset(
      this.sldValue ? getGeoTree() : getTradeTree()
    );
  }

  toggleMap() {
    if ( !this.mapComponent?.shown ) {
      this.mapComponent!.removeMarkers();
      this.mapComponent!.show();
      this.mapComponent!.setPDVs(
        PDV.sliceTree(this.path, this.filtersState.tree == getGeoTree())[0]
      );
    } else {
      this.mapComponent?.hide();
    }
  }
}
