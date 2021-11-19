import { Component, ComponentFactoryResolver, ViewChild, ViewContainerRef, ChangeDetectorRef, HostBinding, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, Output } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { WidgetManagerService } from '../../services/widget-manager.service';
import {  Subject } from 'rxjs';
import { Interactive, SubscriptionManager } from 'src/app/interfaces/Common';
import { Node } from '../../middle/Node';
import { BasicWidget } from 'src/app/widgets/BasicWidget';

type BasicWidgetParams = [string, string, string, string[], string[], boolean];
export interface Layout {
  id: number;
  grid: [number, number];
  description: string | any[];
  template: string;
  areas: {[key:string]: any}
};

export type GridState = {
  loaded: boolean;
  instances?: BasicWidget[];
};

@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
  providers: [WidgetManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridManager extends SubscriptionManager implements Interactive {
  //default layout

  //grid structure
  @HostBinding('style.grid-template-columns')
  private gridColumns: string = '';
  @HostBinding('style.grid-template-rows')
  private gridRows: string = '';
  @HostBinding('style.grid-template-areas')
  private gridAreaTemplate: string = '';

  state: Subject<GridState> = new Subject<GridState>();

  protected _paused: boolean = false;
  get paused() { return this._paused; }

  @Input() layout?: Layout;
  @Input() node?: Node;
  @Output() layoutChanged: EventEmitter<Layout> = new EventEmitter;

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;

  instances: BasicWidget[] = [];

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, private widgetManager: WidgetManagerService) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    let layoutChanges = changes.layout,
      nodeChanges = changes.node;
    
    if ( layoutChanges ) {
      this.computeLayout();
      this.layoutChanged.emit(this.layout);
      this.createComponents();
    }

    if ( nodeChanges ) {
      if ( layoutChanges ) return; //items already displayed, no need to update right now
      this.onPathChanged();
    }
  }
  
  ngAfterViewInit() { this.createComponents(); }

  private computeLayout() {
    if ( !this.layout ) return;
    this.gridColumns = 'repeat(' + this.layout.grid[1] + ', minmax(0, 1fr))';
    this.gridRows = 'repeat(' + this.layout.grid[0] + ', minmax(0, 1fr))';
    this.gridAreaTemplate = this.layout.template;
  }

  private createComponents() {
    if ( !this.ref || !this.layout ) return;
    
    this.clear();
    let keys = Object.keys(this.layout.areas),
      n = keys.length;
    
    for ( let name of keys ) {
      let desc = this.layout.areas[name];
      if ( !desc ) throw '[GridManager -- createComponents]: Unknown component.';
      let cls = this.widgetManager.findComponent(desc[3]);
      let factory = this.componentFactoryResolver.resolveComponentFactory<BasicWidget>(cls);
      let component = this.ref.createComponent(factory),
        instance = component.instance;
      
      instance.gridArea = name;
      /**** object properties *****/
      instance.properties.title = desc[0];
      instance.properties.description = desc[1];
      instance.properties.unit = desc[2];
      instance.properties.arguments = <BasicWidgetParams>desc[4];
      /***************************/
      
      let self = this;
      this.instances.push(instance);
      this.ref.insert(component.hostView);
      this.once(instance.ready, function(this: BasicWidget) {
        instance.onPathChanged(self.node!);
        instance.start();
        if ( !(--n) )
          self.state.next({loaded: true, instances: self.instances})
      });
    }
    this.cd.detectChanges();
  }

  protected onPathChanged() {
    if ( this._paused ) return;
    for ( let component of this.instances ) {
      (component as any).onPathChanged(this.node); //override protected property
      component.update();
    }
  }

  pause() { this._paused = true; }
  interactiveMode() {
    if ( !this._paused ) return;
    this._paused = false;
    this.onPathChanged();
  }

  clear() {
    while ( this.ref.length )
      this.ref.remove();
    
    this.instances.length = 0;
    this.state.next({loaded: false});
  }

  update() {
    for ( let component of this.instances )
      component.update();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.clear();
    this.state.complete();
  } 
}