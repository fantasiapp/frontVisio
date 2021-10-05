import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';
import { Observable } from 'rxjs';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DataExtractionHelper from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'map-filters',
  templateUrl: './map-filters.component.html',
  styleUrls: ['./map-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapFiltersComponent {
  @HostBinding('class.opened')
  opened: boolean = false;

  criteriaNames = ['clientProspect', 'ciblage', 'pointFeu', 'segmentMarketing', 'segmentCommercial', 'industrie', 'enseigne', 'agent', 'dep', 'bassin'];
  criteriaPrettyNames = ['Client / Prospect', 'Ciblage', 'Point Feu', 'Segment Marketing', 'Segment Portefeuille', 'Industriel', 'Enseigne', 'Secteur', 'Département', 'Bassin'];

  @Input()
  path: any = {};

  @Input()
  PDVNumber: number = 0;

  @Output()
  criteriaChange = new EventEmitter<any>();

  private criteriaResult = this.criteriaNames.map(() => []);

  constructor(private ref: ElementRef, private filtersState: FiltersStatesService, private cd: ChangeDetectorRef) {
    console.log('[MapFiltersComponent]: On.');
  }

  trackById(index: number, couple: any) {
    return couple[0];
  }

  trackByIndex(index: number, _: any) {
    return index;
  }

  loadCriterion(criterion: string, path: any): Observable<[string, any][]> {
    //use pretty prints on path slice
    let obversable: Observable<[string, any][]> = new Observable((observer) => {
      this.filtersState.$load.subscribe(() => {
        let criterionPretty = this.criteriaPrettyNames[this.criteriaNames.indexOf(criterion)];
        if ( criterionPretty && path[criterionPretty] !== undefined )
          return observer.next([
            path[criterionPretty], DataExtractionHelper.get(criterion)[path[criterionPretty]]
          ]);
  
        let data = DataExtractionHelper.get(criterion) || {};
        let entries = Object.entries<any>(data);
        return observer.next(entries)
      });
    });

    return obversable;
  }

  someCriteriaChange(idx: number, criteria: any) {
    this.criteriaResult[idx] = criteria;
    let result = this.criteriaResult.reduce((acc: any[][], el: any[]) => acc.concat([el]), []);
    this.criteriaChange.emit(result);
  }

  updateOptions(index: number) {

  }
}