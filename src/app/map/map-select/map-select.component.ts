import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'map-select',
  templateUrl: './map-select.component.html',
  styleUrls: ['./map-select.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSelectComponent {

  @Input()
  criterion = '';
  @Input()
  prettyCriterion = 'Secteur';
  @Input()
  criteria: [string, any][] | null = null;

  all: boolean = true;

  @Output()
  criteriaChange: EventEmitter<[string, any[]]|[]> = new EventEmitter();
  
  selection: (number|string)[] = [];

  constructor(private ref: ElementRef) { }

  @ViewChild('total', {static: false, read: ElementRef})
  private total?: ElementRef;

  trackById(index: number, couple: any) {
    return couple[0];
  }

  totalClicked(e: any) {
    d3.select(e.target).property('checked', true);
    if ( !this.all ) {
      this.all = true;
      this.selection = [];
      d3.select(this.ref.nativeElement).selectAll('input:checked').property('checked', false);
      this.emitSelection();
    }    
  }

  private emitSelection() {
    if ( this.selection.length )
      this.criteriaChange.emit([
        this.criterion, this.selection
      ])
    else
      this.criteriaChange.emit([]);
  }

  criterionClicked(e: any, idx: number) {
    let id = (this.criteria![idx][0] as any) | 0;
    
    if ( this.all  ) {
      this.all = false;
      this.selection = [id];
    } else {
      let index = this.selection.indexOf(id);
      if ( index < 0 )
        this.selection.push(id);
      else {
        this.selection.splice(index, 1);
        if ( !this.selection.length )
          this.all = true;
      }
    };
    
    if ( this.selection.length == this.criteria?.length ) {
      d3.select(this.ref.nativeElement).selectAll('input:checked').property('checked', false);
      this.all = true;
      this.selection.length = 0;
    }
    
    this.emitSelection();
  }
}
