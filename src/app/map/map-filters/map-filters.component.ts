import { ChangeDetectionStrategy, Component, HostBinding, Input, Output, EventEmitter, ElementRef, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
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

  criteriaNames = ['clientProspect', 'ciblage', 'pointFeu', 'segmentMarketing', 'segmentCommercial', 'industrie', 'enseigne', 'agent', 'dep', 'bassin'];
  criteriaPrettyNames = ['Client / Prospect', 'Ciblage', 'Point Feu', 'Segment Marketing', 'Segment Portefeuille', 'Industriel', 'Enseigne', 'Secteur', 'Département', 'Bassin'];

  @Input()
  path: any = {};

  @Input()
  PDVNumber: number = 0;

  @Output()
  criteriaChange = new EventEmitter<any>();

  constructor(private ref: ElementRef, private cd: ChangeDetectorRef) {
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

  loadCriterion(criterion: string, path: any): [string, any][] {
    //use pretty prints on path slice
    let criterionPretty = this.criteriaPrettyNames[this.criteriaNames.indexOf(criterion)];
    if ( criterionPretty && path[criterionPretty] !== undefined ) {
      return [['0', DataExtractionHelper.get(criterion)[path[criterionPretty]]]];
    }

    let data = DataExtractionHelper.get(criterion) || {};
    let entries = Object.entries<any>(data);
    return ([['0', 'Tous']] as [string, any][]).concat(entries);
  }

  updateOptions(index: number) {

  }
}