import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, HostBinding, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, Output } from '@angular/core';
import { BasicWidget } from 'src/app/widgets/BasicWidget';
import { EventEmitter } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { WidgetManagerService } from '../widget-manager.service';

type WidgetParams = [string, string, string, string[], string[], boolean];
export type Widget= [string, string, string, string, WidgetParams];
export interface Layout {
  grid: [string, string];
  description: string;
  template: string;
  areas: {[key:string]: Widget | null}
};

//If you have time, try to use template inside the html file
//ngFor grid areas and ngComponentOutlet, it can remove the need for requestAnimationFrame
@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
  providers: [WidgetManagerService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridManager implements AfterViewInit, OnChanges {
  //default layout
  private $layout: Layout = defaultLayout;

  //grid structure
  @HostBinding('style.grid-template-columns')
  private gridColumns: string = '';
  @HostBinding('style.grid-template-rows')
  private gridRows: string = '';
  @HostBinding('style.grid-template-areas')
  private gridAreaTemplate: string = '';


  get layout(): Layout {
    return this.$layout;
  }

  @Input()
  set layout(layout: Layout | null) {
    this.$layout = layout || defaultLayout;
    this.computeLayout();
  }

  @Output()
  layoutChanged: EventEmitter<Layout> = new EventEmitter;

  instances: any[] = [];

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, private widgetManager: WidgetManagerService) {
    console.log('[GridManager]: On.')
  }
  
  ngAfterViewInit() {
    this.createComponents();
  }

  ngOnChanges(changes: SimpleChanges) {
    let layoutChanges = changes['layout'];
    if ( layoutChanges && !layoutChanges.isFirstChange() ) {
      this.createComponents();
      this.layoutChanged.emit(this.$layout);
    }
  }

  private createComponents() {
    this.ref.clear();
    this.instances.length = 0;
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
      component.instance.properties.arguments = <WidgetParams>desc[4];
      /***************************/
      
      this.instances.push(component.instance);
      this.ref.insert(component.hostView);
    }
    this.cd.detectChanges();
  }

  interactiveMode() {
    for ( let i = 0; i < this.instances.length; i++ ) {
      let widget = this.instances[i] as any;
      if ( widget && widget instanceof BasicWidget )
        (widget as BasicWidget).interactiveMode();
    }
  }

  pause() {
    for ( let i = 0; i < this.instances.length; i++ ) {
      let widget = this.instances[i] as any;
      if ( widget && widget instanceof BasicWidget )
        (widget as BasicWidget).pause();
    }
  }

  clear() {
    while ( this.ref.length )
      this.ref.remove();
    
    this.instances.length = 0;
  }

  reload() {
    this.clear();
    this.createComponents();
  }

  update() {
    for ( let component of this.instances )
      component.update();
  }

  ngOnDestroy() {
    this.clear();
  }

  private computeLayout() {
    this.gridColumns = 'repeat(' + this.layout.grid[1] + ', minmax(0, 1fr))';
    this.gridRows = 'repeat(' + this.layout.grid[0] + ', minmax(0, 1fr))';
    this.gridAreaTemplate = this.layout.template;
  }
}


/******** DEFAULTS *********/

const defaultLayout: Layout = {
  grid: ['1', '1'],
  description: 'default dashboard',
  template: `x`,
  areas: {'x': ['<title>', '<description>', 'm','default', [
    "segmentMarketing", "segmentCommercial", "dn",
    [], ["@other"], true
  ]]}
};