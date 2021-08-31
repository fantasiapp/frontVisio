import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';



@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css']
})

export class UpperbarComponent implements OnInit {
  isFilterVisible = false
  searchModel: string = '';
  searchDebounceId!: number; 
  isSearchOpen = new BehaviorSubject(false)
  constructor() { }
  shouldShowButtons = false
  ngOnInit(): void {
  }
  showFilters(){
    this.isFilterVisible = !this.isFilterVisible
  }
  updateSearchData(searchValue: string) {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
  }
  toggleSearch() {
    this.isSearchOpen.next(!this.isSearchOpen.getValue());
    this.isSearchOpen.subscribe((val) => this.shouldShowButtons = val)
  }
}
