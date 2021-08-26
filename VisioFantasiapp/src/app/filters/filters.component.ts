import { FiltersStatesService } from './filters-states.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ThrowStmt } from '@angular/compiler';
import { Subject } from 'rxjs/internal/Subject';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
})
export class FiltersComponent implements OnInit {
  constructor(private filtersState: FiltersStatesService) {}
  blockList: string[] = [];
  levelName: string = '';
  superLevel: string = '';
  subLevel: string = '';
  ngOnInit(): void {
    this.blockToShow();
  }

  private blockToShow() {
    this.filtersState.currentStates.subscribe((val) => {
      (this.blockList = val.list),
        (this.levelName = val.levelName),
        (this.superLevel = val.superLevel),
        (this.subLevel = val.subLevel);
    });
  }

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateBlock( level : string) {
    this.filtersState.updateState(2021, level);
    this.blockToShow();
  }
}
