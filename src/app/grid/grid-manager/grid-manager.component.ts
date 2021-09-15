import { Component, ComponentFactoryResolver, OnInit, AfterViewInit, ViewChild, ViewContainerRef, ChangeDetectorRef, ComponentRef, HostBinding, Input, OnChanges, SimpleChange, SimpleChanges, Renderer2, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { GridArea } from '../grid-area/grid-area';
import { WidgetManagerService } from '../widget-manager.service';


type WidgetParams = [string, string, string, string[], string[], boolean];
export type Widget= [string, string, string, WidgetParams];
export interface Layout {
  grid: [string, string],
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

  @ViewChild('target', {read: ViewContainerRef})
  ref!: ViewContainerRef;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef, private widgetManager: WidgetManagerService) {
    
  }
  
  ngAfterViewInit() {
    this.createComponents();
  }

  ngOnChanges(changes: SimpleChanges) {
    let layoutChanges = changes['layout'];
    if ( layoutChanges && !layoutChanges.isFirstChange() ) {
      this.createComponents();
    }
  }

  private createComponents() {
    this.ref.clear();
    for ( let name of Object.keys(this.layout.areas) ) {
      let desc = this.layout.areas[name];
      if ( !desc ) continue; //unused field
      console.log(name, desc);
      let cls = this.widgetManager.findComponent(desc[2]);
      let factory = this.componentFactoryResolver.resolveComponentFactory<GridArea>(cls);
      let component = this.ref.createComponent(factory);
      component.instance.gridArea = name;
      
      
      /**** object properties *****/
      component.instance.properties.title = desc[0];
      component.instance.properties.description = desc[1];
      component.instance.properties.arguments = <WidgetParams>desc[3];
      /***************************/

      this.ref.insert(component.hostView);
    }

    //this is slow
    
    let d: any = new Date;
    this.cd.detectChanges();
    console.log('CD took', <any>new Date - d, 'ms');
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    while ( this.ref.length )
      this.ref.remove();
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
  template: `x`,
  areas: {'x': ['<title>', '<description>', 'default', [
    "segmentMarketing", "segmentCommercial", "dn",
    [], ["@other"], true
  ]]}
};