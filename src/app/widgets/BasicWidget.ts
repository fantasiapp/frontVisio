import { Directive, ElementRef, OnDestroy } from "@angular/core";
import * as d3 from "d3";
import { combineLatest, Subscription } from "rxjs";
import { FiltersStatesService } from "../filters/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { SliceDice } from "../middle/Slice&Dice";

@Directive()
export abstract class BasicWidget extends GridArea implements OnDestroy {
  protected subscription: Subscription;
  protected path = {};
  protected ref: ElementRef;
  protected filtersService: FiltersStatesService;
  protected sliceDice: SliceDice;
  /* Styling */
  protected tileHeight: number = 16;

  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super();

    this.ref = ref; this.filtersService = filtersService; this.sliceDice = sliceDice;
    this.subscription = combineLatest([filtersService.$path, this.ready!]).subscribe(([path, _]) => {
      this.subscription.unsubscribe();
      this.path = path;
      //view is initialized
      this.subscription = filtersService.$path.subscribe(path => {
        if ( !BasicWidget.shallowObjectEquality(this.path, path) ) {
          this.path = path;
          this.updateGraph(this.updateData());
        }
      });
      this.start();
    });
  }

  private start(): void {
    let data = this.updateData();
    //used to wait for css to render components correctly <--> needs investigation   v
    requestAnimationFrame((_: any) => {
      this.updateGraph(data);
    });
  }

  /* In case of a library change, this is the method that should be changed         ^ */
  abstract updateGraph(data: any[]): void;

  updateData(): any[] {
    let args: any[] = this.properties.arguments;
    let data = this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5], false);
    return data;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
  }

  noData(content: ElementRef) {
    content.nativeElement.innerHTML = `
      <div class="nodata">Il n'y a pas de données.</div>
    `;
  }

  static shallowArrayEquality(obj: any[], other: any[]): boolean {
    let l = obj.length;
    if ( l != other.length ) return false;
    for ( let i = 0; i < l; i++ )
      if ( obj[i] != other[i] ) return false;
    return true;
  }

  static shallowObjectEquality(obj: {[key:string]:any}, other: {[key:string]: any}): boolean {
    let objKeys: string[] = Object.keys(obj),
      otherKeys: string[] = Object.keys(other);
    
    if ( !this.shallowArrayEquality(objKeys, otherKeys) ) return false;
    for ( let key of objKeys )
      if ( obj[key] != other[key] ) return false;
    
    return true;
  }

  static format(q: number, n: number = 3): string {
    q |= 0; //convert to int
    let base = Math.pow(10, n);
    let str = '';
    while (q >= base) {
      str = (q % base).toString().padStart(n, '0') + ' ' + str;
      q = (q / base) | 0;
    };
    if ( q ) str = q.toString() + ' ' + str;
    if ( !str ) str = '0';
    return str;
  }
};