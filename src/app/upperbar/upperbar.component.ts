import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from './../filters/filters-states.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { range } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Component({
  selector: 'app-upperbar',
  templateUrl: './upperbar.component.html',
  styleUrls: ['./upperbar.component.css'],
})
export class UpperbarComponent implements OnInit {
  sldValue: number = 1;
  isFilterVisible = false;
  searchModel: string = '';
  searchDebounceId!: number;
  @Output() onChange: EventEmitter<any> = new EventEmitter<{ value: string }>();

  isSearchOpen = new BehaviorSubject(false);
  constructor(
    private router: Router,
    private filtersState: FiltersStatesService,
    private authService: AuthService,
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
}
