import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'map-select',
  templateUrl: './map-select.component.html',
  styleUrls: ['./map-select.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSelectComponent implements OnChanges {
  @Input() criterion = '';
  @Input() prettyCriterion = '';
  
  @Input()
  criteria: [number, any, number][] | null = null;
  @Output()
  criteriaChange: EventEmitter<[string, any[]]|[]> = new EventEmitter();

  get droppable() { return this.criteria && this.criteria.length > 1; }
  get deletable() { return this.selection.length > 0; }

  allSelected: boolean = true;
  selection: number[] = [];
  dropped = false;

  protected minHeight = 40; //height for title only
  protected contentPadding = 30;
  protected lineHeight = 30;

  @HostBinding('style.height')
  get height() {
    if ( this.dropped )
      return (this.minHeight + this.contentPadding + this.lineHeight * (this.criteria ? this.criteria.length+1 : 1)) + 'px';
    return this.minHeight + 'px';
  }

  constructor(private ref: ElementRef) { }

  totalClicked(e: any) {
    d3.select(e.target).property('checked', true);
    if ( !this.allSelected ) {
      this.allSelected = true;
      this.selection = [];
      d3.select(this.ref.nativeElement).selectAll('input:checked').property('checked', false);
      this.emitSelection();
    }
  }

  criterionClicked(e: any, idx: number) {
    let id = (this.criteria![idx][0] as any);
    
    if ( this.allSelected  ) {
      this.allSelected = false;
      this.selection = [id];
    } else {
      let index = this.selection.indexOf(id);
      if ( index < 0 )
        this.selection.push(id);
      else {
        this.selection.splice(index, 1);
        if ( !this.selection.length )
          this.allSelected = true;
      }
    };
    
    if ( this.selection.length == this.criteria?.length ) {
      d3.selectAll(
        d3.select(this.ref.nativeElement).selectAll('input').nodes().slice(1)
      ).property('checked', false);
      this.allSelected = true;
      this.selection.length = 0;
    }
    
    this.emitSelection();
  }

  reset() {
    d3.select(this.ref.nativeElement).selectAll('input:checked').property('checked', false);
    d3.select(this.ref.nativeElement).select('input').property('checked', this.allSelected = true);
    this.selection.length = 0;
  }  

  ngOnChanges(changes: SimpleChanges) {
    let criteriaChange = changes['criteria'];
    if ( !criteriaChange || criteriaChange.firstChange ) return;
    if ( !this.droppable ) { this.dropped = false; }
    let keys = this.criteria!.map(pair => pair[0]);
    let oldLength = this.selection.length;
    this.selection = this.selection.filter((e: number) => keys.includes(e));

    
    if ( !this.selection.length )
      this.allSelected = true;
    
    if ( this.selection.length != oldLength )
      this.emitSelection();
  }

  private emitSelection() {
    if ( this.selection.length )
      this.criteriaChange.emit([
        this.criterion, this.selection
      ])
    else
      this.criteriaChange.emit([]);
  }

  toggleDropdown(e: any) {
    if ( this.dropped )
      this.close();
    else
      this.open();
  }

  open() { this.dropped = true; }
  close() { this.dropped = false; }

  tryDelete() {
    if ( !this.deletable ) return;
    this.selection.length = 0;
    this.emitSelection();
  }
  
  trackById(index: number, couple: any) {
    return couple[0];
  }
}