import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, HostBinding, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, Output } from '@angular/core';
import { BasicWidget } from 'src/app/widgets/BasicWidget';
import { EventEmitter } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { WidgetManagerService } from '../widget-manager.service';
import { BehaviorSubject } from 'rxjs';
import { Interactive } from 'src/app/interfaces/Common';
import { Node } from '../../middle/Node';
import { SliceDice } from 'src/app/middle/Slice&Dice';

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
  instances?: GridArea[];
};


@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
  providers: [WidgetManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridManager implements Interactive {
  //default layout

  //grid structure
  @HostBinding('style.grid-template-columns')
  private gridColumns: string = '';
  @HostBinding('style.grid-template-rows')
  private gridRows: string = '';
  @HostBinding('style.grid-template-areas')
  private gridAreaTemplate: string = '';

  get loaded() {
    return this.state.getValue().loaded;
  }

  private _layout?: Layout;
  get layout() { return this._layout; }

  @Input()
  set layout(layout: Layout | undefined) {
    this._layout = layout;
    this.computeLayout();
    this.layoutChanged.emit(this.layout);
    this.createComponents();
  }

  private _node?: Node;
  get node() { return this._node }
  @Input()
  set node(node: Node | undefined) {
    this._node = node;
    this.onPathChanged();
  }

  @Output()
  layoutChanged: EventEmitter<Layout> = new EventEmitter;

  instances: any[] = [];

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;

  state: BehaviorSubject<GridState> = new BehaviorSubject<GridState>({loaded: false});
  protected _paused: boolean = false;
  get paused() { return this._paused; }

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, private widgetManager: WidgetManagerService) {
    //console.debug('[GridManager]: On.')
  }
  
  ngAfterViewInit() {
    this.createComponents();
  }

  private createComponents() {
    if ( !this.ref || !this.layout ) return;
    this.clear();
    for ( let name of Object.keys(this.layout.areas) ) {
      let desc = this.layout.areas[name];
      if ( !desc ) throw '[GridManager -- createComponents]: Unknown component.';
      let cls = this.widgetManager.findComponent(desc[3]);
      let factory = this.componentFactoryResolver.resolveComponentFactory<GridArea>(cls);
      let component = this.ref.createComponent(factory);
      component.instance.gridArea = name;
      
      /**** object properties *****/
      //component.instance.properties.grid = this;
      component.instance.properties.title = desc[0];
      component.instance.properties.description = desc[1];
      component.instance.properties.unit = desc[2];
      component.instance.properties.arguments = <BasicWidgetParams>desc[4];
      /***************************/
      
      this.instances.push(component.instance);
      this.ref.insert(component.hostView);
    }
    this.cd.detectChanges();
    this.state.next({
      loaded: true,
      instances: this.instances
    });
  }

  onPathChanged() {
    if ( this._paused ) return;
    for ( let component of this.instances ) {
      component.onPathChanged(this.node);
      component.update();
    }
  }

  interactiveMode() {
    if ( !this._paused ) return;
    this._paused = false;
    this.onPathChanged();
  }

  pause() { this._paused = true; }

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

  /* = delete */
  reload() {
    this.clear();
    this.createComponents();
  }

  ngOnDestroy() {
    this.clear();
    this.state.complete();
  }

  private computeLayout() {
    if ( !this.layout ) return;
    this.gridColumns = 'repeat(' + this.layout.grid[1] + ', minmax(0, 1fr))';
    this.gridRows = 'repeat(' + this.layout.grid[0] + ', minmax(0, 1fr))';
    this.gridAreaTemplate = this.layout.template;
  }
}