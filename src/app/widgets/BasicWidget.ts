import { Directive, ElementRef, ViewChild } from "@angular/core";
import { Chart } from "billboard.js";
import * as d3 from "d3";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { FiltersStatesService } from "../services/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { Updatable } from "../interfaces/Common";
import { Node } from "../middle/Node";
import { SliceDice } from "../middle/Slice&Dice";
import { SequentialSchedule } from "./Schedule";

@Directive()
export abstract class BasicWidget extends GridArea implements Updatable {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

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
  }

  onReady() {
    this.onPathChanged(this.filtersService.getState().node);
    this.start();
  }

  protected onPathChanged(node: Node) {  }
  
  ngOnInit() {
    if ( this.properties.description == '@sum' )
      this.dynamicDescription = true;
  }
  
  start(): void {
    let data = this.updateData();
    if ( this.checkData(data) ) return;
    requestAnimationFrame((_: any) => {
      this.createGraph(data);
    });
  }
  
  abstract createGraph(data: any, opt?: {}): void;
  
  updateGraph({data}: any): void {
    let newIds = data.map((d: any[]) => d[0]);
    let oldIds = Object.keys(this.chart?.xs() || {});
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
  
  getDataArguments(): [string, string, string, string[], string[], string, boolean, boolean] {
    let args: any[] = this.properties.arguments;
    return [args[0], args[1], args[2], args[3], args[4], args[5], false, false];
  }
  
  updateData(): {} {
    this.chart && this.chart.tooltip && this.chart.tooltip.hide();
    let data = this.sliceDice.getWidgetData(...this.getDataArguments());

    if ( this.dynamicDescription ) {
      this.properties.description = BasicWidget.format(data.sum, 3, this.properties.unit.toLowerCase() == 'pdv') + ' ' + this.properties.unit;
      this.setSubtitle(this.properties.description);
    }; return data;
  }
  
  setTitle(title: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) h2').text(title);
  }
  
  setSubtitle(subtitle: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) p').text(subtitle);
  }

  protected checkData(data: any) {
    let res = BasicWidget.checkData(data);
    if ( res && this.content )
      this.noData(this.content);

    return res;
  }
  
  update() {
    let data = this.updateData(), res;
    if ( res = this.checkData(data) ) { this.chart?.destroy(); this.chart = null; return }
    if ( this.chart )
      this.updateGraph(data);
    else
      this.createGraph(data);
  }
  
  ngOnDestroy() {
    super.ngOnDestroy();
    d3.select(this.ref.nativeElement).selectAll('.bb-tooltip-container > *').remove();
    if ( this.ref )
      d3.select(this.ref.nativeElement).selectAll('div > *').remove();
    this.chart?.destroy();
  }
  
  noData(content: ElementRef) {
    console.log('[BasicWidget -- noData]: No data is supplied, this is most probably a error.');
    d3.select(content.nativeElement).selectChildren('*').remove();
    content.nativeElement.innerHTML = `
      <div class="nodata">Il n'y a pas de données.</div>
    `;
    this.chart = null;
  }
  
  static legendItemHeight: number = 12;
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

  static format(q: number, n: number = 3, integer: boolean = false): string {
    let p = Math.round(q);
    let base = Math.pow(10, n);
    let str = '';
    
    if ( Math.floor(q) == 0 )
      return integer ? p.toString() : q.toFixed(Math.min(3, this.firstDigit(q))).toString();

    while (p >= base) {
      str = (p % base).toString().padStart(n, '0') + ' ' + str;
      p = (p / base) | 0;
    };
    if ( p ) str = p.toString() + ' ' + str;
    if ( !str ) str = '0';

    return str.trim();
  }

  static convert(str: string): number {
    return +(str.replace(/\s+/g, '').replace(/\,/g, '.'));
  }

  private static resizeSubject = new Subject<never>();
  private static onResize = () => {
    BasicWidget.legendItemHeight = BasicWidget.getLegendItemHeight(window.innerWidth);
  }
  static globalEvents() {
    window.addEventListener('load', (e: Event) => {
      this.onResize();
    });

    window.addEventListener('resize', (e: Event) => {
      BasicWidget.resizeSubject.next();
    });

    BasicWidget.resizeSubject.pipe(debounceTime(100)).subscribe(() => {
      BasicWidget.onResize();
    });
  }
  
  static checkData({data}: any) {
    if ( !(data.length - 1) || !(data[0].length - 1) ) {
      //for 2D data
      return true;
    } else {
      //for 1D data
      let sum = data.sum || data.reduce((acc: number, d: any[]) => acc + d[1], 0);
      if ( !data.length || !sum ) {
        return true;
      } return false;
    }
  }
};

BasicWidget.globalEvents();