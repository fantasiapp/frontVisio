import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, ComponentRef, HostBinding, Input, OnChanges, SimpleChange, SimpleChanges, Renderer2, ViewEncapsulation } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { WidgetManagerService } from '../widget-manager.service';


type WidgetParams = [string, string, string, string];
export interface Layout {
  grid: [string, string],
  template: string;
  areas: {[key:string]: WidgetParams | null}
};


@Component({
  selector: 'grid-manager',
  templateUrl: './grid-manager.component.html',
  styleUrls: ['./grid-manager.component.css'],
  providers: [WidgetManagerService]
})
export class GridManager implements OnInit, AfterViewInit, OnChanges {
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

  //children
  private componentRefs: ComponentRef<any>[] = [];

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, private widgetManager: WidgetManagerService) { }
  
  ngAfterViewInit() {
    this.createComponents();
  }

  ngOnChanges(changes: SimpleChanges) {
    let layoutChanges = changes['layout'];
    if ( layoutChanges && !layoutChanges.isFirstChange() )
      this.createComponents();
  }

  /* Same layout but different widgets can cause performance issues */
  private createComponents() {    
    this.ref.clear();
    for ( let name of Object.keys(this.layout.areas) ) {
      let desc = this.layout.areas[name];
      if ( !desc ) continue; //unused field
      let cls = this.widgetManager.findComponent(desc[2]);
      let factory = this.componentFactoryResolver.resolveComponentFactory<GridArea>(cls);
      let component = this.ref.createComponent(factory);
      component.instance.gridArea = name;
      
      /**** object properties *****/
      component.instance.properties.title = desc[0];
      component.instance.properties.description = desc[1];

      this.ref.insert(component.hostView);
      this.componentRefs.push(component);
    }
    this.cd.detectChanges();
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    for ( let componentRef of this.componentRefs )
      componentRef.destroy();
    this.componentRefs.length = 0;
  }

  private computeLayout() {
    this.gridColumns = 'repeat(' + this.layout.grid[1] + ', 1fr)';
    this.gridRows = 'repeat(' + this.layout.grid[0] + ', 1fr)';
    this.gridAreaTemplate = this.layout.template;
  }
}


/******** DEFAULTS *********/

const defaultLayout: Layout = {
  grid: ['1', '1'],
  template: `x`,
  areas: {'x': ['<title>', '<description>', 'default', 'empty']}
};