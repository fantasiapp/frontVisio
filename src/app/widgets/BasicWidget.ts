import { ChangeDetectorRef, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, HostListener, Inject, Injector, ViewChild, ViewContainerRef } from "@angular/core";
import { Chart, DataItem, DataRow } from "billboard.js";
import * as d3 from "d3";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { FiltersStatesService } from "../services/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { Updatable, Utils } from "../interfaces/Common";
import { Node } from "../middle/Node";
import { SliceDice } from "../middle/Slice&Dice";
import { SequentialSchedule } from "./Schedule";
import { TooltipItem, TooltipComponent } from "./tooltip/tooltip.component";

@Directive()
export abstract class BasicWidget extends GridArea implements Updatable {
  @ViewChild('content', {read: ElementRef})
  protected content!: ElementRef;

  @ViewChild('tooltips', {read: ViewContainerRef})
  tooltipsVcref!: ViewContainerRef;

  //Essential services to compute the widget
  protected ref: ElementRef;
  protected filtersService: FiltersStatesService;
  protected sliceDice: SliceDice;
  protected cd: ChangeDetectorRef;
  //The actual graph
  protected chart: Chart | null = null;
  /* for processing @sum and similar */
  protected dynamicDescription: boolean = false;
  /* order animation */
  protected schedule: SequentialSchedule = new SequentialSchedule;
  // Keep a list of active tooltips in the same order in the view
  // This is new, try to clean more code
  protected tooltips: {[key: string]: ComponentRef<TooltipComponent>} = {};
  
  constructor(protected injector: Injector) {
    super();
    this.ref = injector.get(ElementRef);
    this.filtersService = injector.get(FiltersStatesService);
    this.sliceDice = injector.get(SliceDice);
    this.cd = injector.get(ChangeDetectorRef);
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
    let oldIds = (this.chart?.data() || []).map(datum => datum.id);
    this.clearTooltips();
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
    let data = this.sliceDice.getWidgetData(...this.getDataArguments());

    if ( this.dynamicDescription ) {
      this.properties.description = Utils.format(data.sum, 3, this.properties.unit.toLowerCase() == 'pdv') + ' ' + this.properties.unit;
      this.setSubtitle(this.properties.description);
    }; return data;
  }
  
  setTitle(title: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) h2').text(title);
  }
  
  setSubtitle(subtitle: string) {
    d3.select(this.ref.nativeElement).select('div:nth-of-type(1) p').text(subtitle);
  }

  //I don't think using injectors here will impact performance in any way
  protected addTooltipAt(items: TooltipItem[], id: string, left: number = 0, top: number = 0) {
    let componentFactoryResolver = this.injector.get(ComponentFactoryResolver);
    let factory = componentFactoryResolver.resolveComponentFactory(TooltipComponent),
      component = this.tooltipsVcref.createComponent(factory);
    
    component.instance.contents = items;
    component.instance.setPosition({left, top})
    this.tooltipsVcref.insert(component.hostView);
    if ( this.tooltips[id] ) throw "[BasicWidget]-addTooltipAt: Adding tooltip to the same element " + id + '.';
    else this.tooltips[id] = component;
    this.injector.get(ChangeDetectorRef).detectChanges();
    return component;
  }
  
  protected addMultipleTooltipsAt(items: TooltipItem[], ids: string[], left: number = 0, top: number = 0) {
    let tooltip = this.addTooltipAt(items, ids[0], left, top);
    for ( let item of items )
      this.tooltips[item.title] = tooltip;
    return tooltip;
  }

  protected removeTooltip(id: string) {
    let tooltip = this.tooltips[id];
    if ( !tooltip ) return false;

    for ( let id of Object.keys(this.tooltips) ) {
      if ( this.tooltips[id] == tooltip )
        delete this.tooltips[id];
    }
    this.tooltipsVcref.remove(this.tooltipsVcref.indexOf(tooltip.hostView)); 
    this.injector.get(ChangeDetectorRef).detectChanges();
    return true;
  }

  protected clearTooltips() {
    while ( this.tooltipsVcref.length )
      this.tooltipsVcref.remove();
    this.tooltips = {};
    this.injector.get(ChangeDetectorRef).detectChanges();
  }

  protected makeTooltip(item: DataItem): TooltipItem | null {
    if ( !item.value ) return null;
    return {
      color: this.chart!.color(item.id),
      title: item.id,
      body: `: ${Utils.format(item.value, 3, this.properties.unit.toLowerCase() == 'pdv')} ${this.properties.unit}`
    }
  }

  //subclasses with specialize if needed
  protected onDataClicked(items: DataItem[]) {
    let event = BasicWidget.lastClickEvent! as PointerEvent;
    let tooltips: TooltipItem[] = [],
      deleted = [];

    for ( let item of items ) {
      if ( this.tooltips[item.id] ) { this.removeTooltip(item.id); deleted.push(item.id); }
      let tooltip = this.makeTooltip(item);
      if ( tooltip ) tooltips.push(tooltip);
    }

    if ( !tooltips.length ) return;
    else if ( tooltips.length == 1 ) {
      //add only if elements isnt deleted
      if ( !deleted.includes(items[0].id) )
        this.addTooltipAt(tooltips, items[0].id, event.clientX, event.clientY);
    }
    else this.addMultipleTooltipsAt(tooltips, items.map(item => item.id), event.clientX, event.clientY);
  }

  //wrapper around the ugly setTimeout here
  //The library calls onclick multiple times if an object
  //is on the interaction boundary of another so track the calls
  private tooltipClicked: any = null;
  private tooltipDelay: number = 0;
  private tooltipQueue: DataItem[] = [];

  protected toggleTooltipOnClick(item: DataItem) {
    if ( this.tooltipClicked !== null )
      clearTimeout(this.tooltipClicked);

    this.tooltipQueue.push(item);
    this.tooltipClicked = setTimeout(() => {
      this.onDataClicked(this.tooltipQueue);
      this.tooltipClicked = null;
      this.tooltipQueue.length = 0;
    }, this.tooltipDelay);
  }

  protected checkData(data: any) {
    let res = BasicWidget.checkData(data);
    if ( res && this.content )
      this.noData(this.content);

    return res;
  }
  
  update() {
    this.clearTooltips();
    let data = this.updateData();
    if ( this.checkData(data) ) { return }
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
    this.chart?.destroy(); this.chart = null;
    d3.select(content.nativeElement).selectChildren('*').remove();
    content.nativeElement.innerHTML = `
      <div class="nodata">Il n'y a pas de données.</div>
    `;
    this.chart = null;
  }
  
  static legendItemHeight: number = 12;
  static getLegendItemHeight(width: number) {
    if ( width < 1366 )
      return 12;
    else if ( width < 1500 )
      return 14;
    else
      return 16;
  }

  private static resizeSubject = new Subject<never>();
  static lastClickEvent: Event | null = null;
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

    window.addEventListener('click', (e: Event) => {
      BasicWidget.lastClickEvent = e;
      e.stopPropagation();
    })

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
