import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'map-select',
  templateUrl: './map-select.component.html',
  styleUrls: ['./map-select.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSelectComponent implements OnChanges {

  @Input()
  criterion = '';
  @Input()
  prettyCriterion = '';
  @Input()
  criteria: [number, any, number][] | null = null;

  all: boolean = true;

  @Output()
  criteriaChange: EventEmitter<[string, any[]]|[]> = new EventEmitter();
  
  selection: number[] = [];

  @ViewChild('total', {static: false, read: ElementRef})
  private total?: ElementRef;

  constructor(private ref: ElementRef) { }

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
    let id = (this.criteria![idx][0] as any);
    
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
      d3.selectAll(
        d3.select(this.ref.nativeElement).selectAll('input').nodes().slice(1)
      ).property('checked', false);
      this.all = true;
      this.selection.length = 0;
    }
    
    this.emitSelection();
  }

  protected minHeight = 40; //height for title only
  protected contentPadding = 30;
  protected lineHeight = 30;
  dropped = false;

  @HostBinding('style.height')
  get height() {
    if ( this.dropped )
      return (this.minHeight + this.contentPadding + this.lineHeight * (this.criteria ? this.criteria.length+1 : 1)) + 'px';
    return this.minHeight + 'px';
  }

  toggleDropdown(e: any) {
    this.dropped = !this.dropped;
  }

  ngOnChanges(changes: SimpleChanges) {
    let criteriaChange = changes['criteria'];
    if ( !criteriaChange || criteriaChange.firstChange ) return;
    let keys = this.criteria!.map(pair => pair[0]);
    let oldLength = this.selection.length;
    this.selection = this.selection.filter((e: number) => keys.includes(e));
    
    if ( !this.selection.length )
      this.all = true;
    
    if ( this.selection.length != oldLength )
      this.emitSelection();
  }
}