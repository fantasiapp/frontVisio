import { Directive, ElementRef, Injectable, OnDestroy, OnInit } from "@angular/core";
import { Chart } from "billboard.js";
import * as d3 from "d3";
import { combineLatest, Subscription } from "rxjs";
import { FiltersStatesService } from "../filters/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { SliceDice } from "../middle/Slice&Dice";
import { SequentialSchedule } from "./Schedule";

@Directive()
export abstract class BasicWidget extends GridArea implements OnInit, OnDestroy {
  protected subscription?: Subscription;
  protected path = {};
  protected ref: ElementRef;
  protected filtersService: FiltersStatesService;
  protected sliceDice: SliceDice;
  protected chart: Chart | null = null;
  /* for processing @sum and similar */
  protected dynamicDescription: boolean = false;

  /* order animation */
  protected schedule: SequentialSchedule = new SequentialSchedule;
  
  constructor(ref: ElementRef, filtersService: FiltersStatesService, sliceDice: SliceDice) {
    super();
    this.ref = ref; this.filtersService = filtersService; this.sliceDice = sliceDice;
    this.subscription = combineLatest([filtersService.stateSubject, this.ready!]).subscribe(([{States}, _]) => {
      this.subscription!.unsubscribe();
      this.subscription = undefined;
      this.path = this.filtersService.getPath(States);
      this.onPathChanged();
      //view is initialized
      this.interactiveMode();
      this.start();
    });
  }
  
  interactiveMode() {
    if ( this.subscription ) return;
    this.subscription = this.filtersService.stateSubject.subscribe(({States}) => {
      let path = this.filtersService.getPath(States);
      if ( !BasicWidget.shallowObjectEquality(this.path, path) ) {
        this.path = path;
        this.onPathChanged();
        this.update();
      }
    });
  }

  protected onPathChanged() { }
  
  pause() {
    if ( !this.subscription ) return;
    this.subscription.unsubscribe();
    this.subscription = undefined;
  }
  
  ngOnInit() {
    if ( this.properties.description == '@sum' )
      this.dynamicDescription = true;
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
          this.schedule.next();
        }
      });
    });
  }
  
  getDataArguments(): [any, string, string, string, string[], string[], string, boolean, boolean] {
    let args: any[] = this.properties.arguments;
    return [this.path, args[0], args[1], args[2], args[3], args[4], args[5], false, false];
  }
  
  updateData(): {} {
    this.chart?.tooltip.hide();
    let data;
    //let pathId = this.sliceDice.pathId(this.path);
    //if ( this.savedData[pathId] ) {
  //  console.log('data already here')
  //  data = this.savedData[pathId]
  //} else {
    //  console.log('fetching data');
    data = this.sliceDice.getWidgetData(...this.getDataArguments());
    //  this.savedData[this.sliceDice.pathId(this.path)] = data;
    //}
    
    // ⚠️⚠️⚠️ find how to trigger change detection -- this works but doesn't use angular capabilities
    if ( this.dynamicDescription ) {
      this.properties.description = BasicWidget.format(data.sum, 3) + ' ' + this.properties.unit;
      this.setSubtitle(this.properties.description);
    }; return data;
  }
  
  setTitle(title: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) h2').text(title);
  }
  
  setSubtitle(subtitle: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) p').text(subtitle);
  }
  
  update() {
    this.updateGraph(this.updateData());
  }
  
  refresh() { //for transitions without animation
    this.update();
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
    d3.select(this.ref.nativeElement).selectAll('.bb-tooltip-container > *').remove();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
  }
  
  noData(content: ElementRef) {
    console.log('[BasicWidget -- noData]: No data is supplied, this is most probably a error.');
    d3.select(content.nativeElement).select('div > svg').remove();
    content.nativeElement.innerHTML = `
    <div class="nodata">Il n'y a pas de données.</div>
    `;
  }
  
  static legendItemHeight: number = BasicWidget.getLegendItemHeight(window.innerWidth);
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

  static getLegendItemHeight(width: number) {
    if ( width < 1366 )
      return 12;
    else if ( width < 1500 )
      return 14;
    else
      return 16;
  }

  static firstDigit(q: number) {
    return -Math.floor(Math.log10(q));
  }

  static format(q: number, n: number = 3): string {
    let p = Math.round(q);
    let base = Math.pow(10, n);
    let str = '';
    
    if ( Math.floor(q) == 0 )
      return q.toFixed(Math.min(3, this.firstDigit(q))).toString();

    while (p >= base) {
      str = (p % base).toString().padStart(n, '0') + ' ' + str;
      p = (p / base) | 0;
    };
    if ( p ) str = p.toString() + ' ' + str;
    if ( !str ) str = '0';

    return str;
  }
};

//perhaps will be useful
let timeoutId: any = null;
let windowResize = (e: Event) => {
  let width = window.innerWidth;
  BasicWidget.legendItemHeight = BasicWidget.getLegendItemHeight(width);
  timeoutId = null;
};

(window as any).addEventListener('resize', (e: Event) => {
  if ( timeoutId )
    clearTimeout(timeoutId);
  
  timeoutId = setTimeout(windowResize, 100, [e]);
});

(window as any).addEventListener('load', (e: Event) => {
  BasicWidget.legendItemHeight = BasicWidget.getLegendItemHeight(window.innerWidth);
})