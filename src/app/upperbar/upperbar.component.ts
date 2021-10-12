import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from './../filters/filters-states.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { getGeoTree, getTradeTree, PDV } from '../middle/Slice&Dice';

import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { SliceDice } from '../middle/Slice&Dice';
import { MapComponent } from '../map/map.component';
import { combineLatest, Observable } from 'rxjs';
import { BasicWidget } from '../widgets/BasicWidget';
import { DataService } from '../services/data.service';


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
  updating: boolean = false;
  @Output() onChange: EventEmitter<any> = new EventEmitter<{ value: string }>();

  @Output() mapVisible: EventEmitter<boolean> = new EventEmitter();

  @ViewChild('map', {read: MapComponent, static: false})
  mapComponent?: MapComponent;

  isSearchOpen = new BehaviorSubject(false);
  constructor(
    private filtersState: FiltersStatesService,
    private authService: AuthService,
    private sliceDice: SliceDice,
    private dataService: DataService,
    private cd: ChangeDetectorRef
  ) {}
  shouldShowButtons = false;

  ngOnInit(): void {
    this.filtersState.filtersVisible.subscribe(
      (val) => (this.isFilterVisible = val)
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

  toggleMap() {
    if ( !this.mapComponent?.shown ) {
      this.mapComponent!.show();
      this.mapVisible.emit(true);
    } else {
      this.mapComponent?.hide();
      this.mapVisible.emit(false);
    }
  }

  updateData() {
    this.dataService.requestUpdateData()
  }
}
