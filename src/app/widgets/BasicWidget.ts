import { ChangeDetectorRef, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, HostListener, Inject, Injector, ViewChild, ViewContainerRef } from "@angular/core";
import { Chart, DataItem, DataRow } from "billboard.js";
import * as d3 from "d3";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { FiltersStatesService } from "../services/filters-states.service";
import { GridArea } from "../grid/grid-area/grid-area";
import { Dict, Updatable, Utils } from "../interfaces/Common";
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
  protected sliceDice: SliceDice;
  protected cd: ChangeDetectorRef;
  //The actual graph
  protected chart: Chart | null = null;
  /* for processing @sum and similar */
  private dynamicDescription: boolean = false;
  /* order animation */
  protected schedule: SequentialSchedule = new SequentialSchedule;
  // Keep a list of active tooltips in the same order in the view
  // This is new, try to clean more code
  protected tooltips: {[key: string]: ComponentRef<TooltipComponent>} = {};
  
  constructor(protected injector: Injector) {
    super();
    this.ref = injector.get(ElementRef);
    this.sliceDice = injector.get(SliceDice);
    this.cd = injector.get(ChangeDetectorRef);
  }

  protected onPathChanged(node: Node) {  }
  
  ngOnInit() {
    if ( this.properties.description == '@sum' )
      this.dynamicDescription = true;
    
    this.ref.nativeElement.addEventListener('click', (e: PointerEvent) => {
      this.onClick(e);
    });
  }

  protected onClick(e: PointerEvent) {
    let ref = this.ref.nativeElement as HTMLElement;
    if ( ! this.ref.nativeElement.querySelector('.bb-main').contains(e.target) )
      this.clearTooltips();
  }
  
  start(): void {
    let data = this.updateData();
    if ( this.checkData(data) ) return;
    requestAnimationFrame((_: any) => {
      this.createGraph(data);
    });
  }
  
  abstract createGraph(data: any, opt?: Dict): void;
  
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
    
    if ( this.tooltips[id] ) throw "[BasicWidget]-addTooltipAt: Adding tooltip to the same element " + id + '.';
    else this.tooltips[id] = component;
    component.instance.contents = items;
    component.instance.setPosition({left, top})
    this.tooltipsVcref.insert(component.hostView);
    this.injector.get(ChangeDetectorRef).detectChanges();
    return component;
  }
  
  protected addMultipleTooltipsAt(items: TooltipItem[], ids: string[], left: number = 0, top: number = 0) {
    let tooltip = this.addTooltipAt(items, ids[0], left, top);
    for ( let item of items )
      this.tooltips[item.id] = tooltip;
    return tooltip;
  }

  protected removeTooltip(id: string) {
    let tooltip = this.tooltips[id];
    if ( !tooltip ) return false;

    tooltip.instance.removeItem(id);
    delete this.tooltips[id];
    if ( tooltip.instance.empty ) {
      this.tooltipsVcref.remove(this.tooltipsVcref.indexOf(tooltip.hostView)); 
      this.injector.get(ChangeDetectorRef).detectChanges();
    }
    
    return true;
  }

  protected clearTooltips() {
    while ( this.tooltipsVcref.length )
      this.tooltipsVcref.remove();
    this.tooltips = {};
    this.injector.get(ChangeDetectorRef).detectChanges();
  }

  protected makeTooltip(item: DataItem, id?: string): TooltipItem | null {
    if ( !item.value ) return null;
    return {
      color: this.chart!.color(item.id),
      id: id || this.createTooltipId(item),
      title: item.id,
      body: `: ${Utils.format(item.value, 3, this.properties.unit.toLowerCase() == 'pdv')} ${this.properties.unit}`
    }
  }

  //subclasses with specialize if needed
  protected onDataClicked(items: DataItem[]) {
    items = items.filter(item => item.value);
    let event = BasicWidget.lastClickEvent! as PointerEvent;
    let tooltips: TooltipItem[] = [],
      deleted: string[] = [],
      ids = items.map(item => this.createTooltipId(item));

    for ( let i = 0; i < items.length; i++ ) {
      let item = items[i], id = ids[i], tooltip;
      if ( this.tooltips[id] ) { this.removeTooltip(id); deleted.push(id); }
      tooltip = this.makeTooltip(item, id);
      if ( tooltip ) tooltips.push(tooltip);
    }

    tooltips = tooltips.filter(tooltip => !deleted.includes(tooltip.id));
    ids = ids.filter(id => !deleted.includes(id));
    if ( !tooltips.length ) return;
    else if ( tooltips.length == 1 )
      this.addTooltipAt(tooltips, ids[0], event.clientX, event.clientY);
    else this.addMultipleTooltipsAt(tooltips, ids, event.clientX, event.clientY);
  }

  protected createTooltipId(item: DataItem) {
    return item.id + '#' + (item.x || 0);
  }

  //wrapper around the ugly setTimeout here
  //The library calls onclick multiple times if an object
  //is on the interaction boundary of another so track the calls
  private tooltipTimoutId: any = 0;
  private tooltipQueue: DataItem[] = [];

  protected toggleTooltipOnClick(item: DataItem) {
    this.tooltipQueue.push(item);
    if ( !this.tooltipTimoutId ) {
      this.tooltipTimoutId = setTimeout(() => {
        this.onDataClicked(this.tooltipQueue);
        this.tooltipQueue.length = 0;
        this.tooltipTimoutId = null;
      }, 0);
    }
  }

  protected checkData(data: any) {
    let res = BasicWidget.checkData(data);
    if ( res && this.content ) {
      this.noData(this.content);
      this.chart = null;
    }

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
    //remove click listener
  }
  
  noData(content: ElementRef) {
    console.log('[BasicWidget -- noData]: No data is supplied, this is most probably a error.');
    this.chart?.destroy(); this.chart = null;
    d3.select(content.nativeElement).selectChildren('*').remove();
    content.nativeElement.innerHTML = `
      <div class="nodata">Il n'y a pas de données.</div>
    `;
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
