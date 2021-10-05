import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import * as d3 from 'd3';
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

  criteriaNames = ['segmentMarketing', 'segmentCommercial', 'enseigne', 'agent', 'dep', 'bassin'];
  criteriaPrettyNames = ['Segment Marketing', 'Segment Commercial', 'Enseigne', 'Agent', 'Département', 'Bassin'];

  @Input()
  PDVNumber: number = 0;

  @Output()
  criteriaChange = new EventEmitter<any>();

  constructor(private ref: ElementRef) {
    console.log('[MapFiltersComponent]: On.');
  }

  trackById(index: number, couple: any) {
    return couple[0];
  }

  trackByIndex(index: number, _: any) {
    return index;
  }

  updateCriteria(index: number) {
    let criteria = this.criteriaNames.reduce((acc: any[], item: string, idx: number) => {
      let sel = d3.select(this.ref.nativeElement).selectAll('select').nodes()[idx] as any,
        value = sel.value | 0, 
        res = value ? [[item, value]] : [];
      
      return acc.concat(res);
    }, []);

    console.log(criteria);
    this.criteriaChange.emit(criteria);
    return criteria;
  }

  loadCriterion(criterion: string): [string, any][] {
    let entries = Object.entries<any>(DataExtractionHelper.get(criterion));
    return ([['0', 'Tous']] as [string, any][]).concat(entries);
  }
}