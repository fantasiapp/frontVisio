import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css']
})
export class UpperbarComponent implements OnInit {
  isFilterVisible = false
  searchModel: string = '';
  searchDebounceId!: number; 
  constructor() { }

  ngOnInit(): void {
  }
  showFilters(){
    this.isFilterVisible = !this.isFilterVisible
  }
  updateSearchData(searchValue: string) {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
  }
}
