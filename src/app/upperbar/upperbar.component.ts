import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { range } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';



@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css']
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
  changeFont(){
    // this.onChange.emit({
    //   // value : this.onChange.value.username
    // })
    // console.debug("la valeur", )
    // const org = document.getElementById('org');
    // const ens = document.getElementById('ens');
    // if() {
    //   ens?.classList.remove('selected')
    //   org?.classList.add('selected')
    // } 
    // else{
    //   org?.classList.remove('selected')
    //   ens?.classList.add('selected')
    // }
  }
}
