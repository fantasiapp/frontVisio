import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { range } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import {
  trigger,
  state,
  style,
  animation,
  transition,
  animate
} from '@angular/animations';


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
  isFilterVisible = false
  searchModel: string = '';
  searchDebounceId!: number; 
  @Output() onChange: EventEmitter<any> = new EventEmitter<{value: string;}>();

  isSearchOpen = new BehaviorSubject(false)
  constructor(private router: Router, private filtersState: FiltersStatesService){}
  shouldShowButtons = false
  ngOnInit(): void {
    this.filtersState.filtersVisible.subscribe((val) => this.isFilterVisible = val)
  }
  showFilters(){
    this.isFilterVisible = !this.filtersState.filtersVisible.getValue()
    this.filtersState.filtersVisible.next(this.isFilterVisible)
  }
  updateSearchData(searchValue: string) {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
  }
  toggleSearch() {
    this.isSearchOpen.next(!this.isSearchOpen.getValue());
    this.isSearchOpen.subscribe((val) => this.shouldShowButtons = val)
  }
  logOut(){
    this.router.navigate([
      sessionStorage.getItem('originalPath') || 'login',
    ]);
  }
}
