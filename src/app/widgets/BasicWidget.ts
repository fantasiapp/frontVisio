import { Directive, ElementRef, OnDestroy } from "@angular/core";
import { Chart } from "billboard.js";
import * as d3 from "d3";
import { combineLatest, Subscription } from "rxjs";
import { FiltersStatesService } from "../filters/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { SliceDice } from "../middle/Slice&Dice";
import { SequentialSchedule } from "./Schedule";

@Directive()
export abstract class BasicWidget extends GridArea implements OnDestroy {
  protected subscription: Subscription;
  protected path = {};
  protected ref: ElementRef;
  protected filtersService: FiltersStatesService;
  protected sliceDice: SliceDice;
  protected chart: Chart | null = null;
  /* Styling */
  protected tileHeight: number = 16;
  protected dynamicDescription: boolean = false;

  /* order animation */
  protected schedule: SequentialSchedule = new SequentialSchedule;


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

  protected start(): void {
    let data = this.updateData();
    //used to wait for css to render components correctly <--> needs investigation   v
    requestAnimationFrame((_: any) => {
      this.createGraph(data);
    });
  }

  abstract createGraph(data: any, opt?: {}): void;

  updateGraph({data}: any): void {
    let newIds = data.map((d: any[]) => d[0]);
    let oldIds = Object.keys(this.chart!.xs());
    this.schedule.queue(() => {
      this.chart?.load({
        columns: data,
        unload: oldIds.filter(x => !newIds.includes(x)),
        done: () => {
          this.schedule.emit();
        }
      });
    });
  }

  updateData(): {} {
    this.chart?.tooltip.hide();
    let args: any[] = this.properties.arguments;
    let data = this.sliceDice.getWidgetData(this.path, args[0], args[1], args[2], args[3], args[4], args[5], false, this.properties.target !== undefined);
  
    // ⚠️⚠️⚠️ find how to trigger change detection -- this works but doesn't use angular capabilities
    if ( this.dynamicDescription || this.properties.description == '@sum' ) {
      this.dynamicDescription = true;
      this.properties.description = BasicWidget.format(data.sum, 3) + ' ' + this.properties.unit;
      d3.select(this.ref.nativeElement).select('div:nth-of-type(1) p').text(this.properties.description);
    };

    return data;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
    // if ( this.chart )
    //   this.chart.destroy();
  }

  noData(content: ElementRef) {
    console.log('[BasicWidget -- noData]: No data is supplied, this is most probably a error.');

    d3.select(content.nativeElement).select('div > svg').remove();
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
    let p = Math.round(q);
    let base = Math.pow(10, n);
    let str = '';

    if ( p == 0 )
      return q.toFixed(1).toString();

    while (p >= base) {
      str = (p % base).toString().padStart(n, '0') + ' ' + str;
      p = (p / base) | 0;
    };
    if ( p ) str = p.toString() + ' ' + str;
    if ( !str ) str = '0';

    return str;
  }
};