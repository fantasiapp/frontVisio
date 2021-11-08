import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, SimpleChanges, ViewChild } from '@angular/core';
import { LoggerService } from '../behaviour/logger.service';
import { FiltersStatesService } from '../filters/filters-states.service';
import { GridManager, Layout } from '../grid/grid-manager/grid-manager.component';
import { Navigation } from '../middle/Navigation';
import { DataService } from '../services/data.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TableComponent } from '../widgets/table/table.component';
import { SubscriptionManager, Updatable } from '../interfaces/Common';
import { CD } from '../middle/Descriptions';
import { TargetService } from '../widgets/description-widget/description-service.service';
import { Node } from '../middle/Node'

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
  providers: [Navigation, FiltersStatesService, LoggerService, TargetService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewComponent extends SubscriptionManager implements Updatable {
  @ViewChild(GridManager)
  gridManager!: GridManager;

  public layout: (Layout & {id: number}) | null = null;
  public node?: Node;

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService, private localStorageService: LocalStorageService) {
    super();
    this.subscribe(filtersService.state, ({node, dashboard}) => {
      if ( this.layout?.id !== dashboard.id ) {
        //console.log('[ViewComponent]: Layout(.id)=', dashboard.id ,'changed.');
        this.gridManager?.clear();
        this.layout = dashboard;
      }
      this.node = node;
    });

    this.subscribe(dataservice.update, () => {
      this.node = this.filtersService.tree!.follow(this.node!.path.map(level => level.id));
      //same node but of an updated tree, force the refresh
      this.refresh();
    });
  }

  ngOnInit() { this.filtersService.emitState(); }

  update() { this.gridManager.update(); }
  refresh() { this.gridManager.node = this.node; this.gridManager.refresh(); }

  ngOnChanges(changes: SimpleChanges) {
    console.log('view changes', changes);
  }

  get shouldComputeDescription(): boolean {
    return !!(this.layout && this.layout.description && this.layout.description.length);
  }

  get description(): string {
    return this.computeDescription(this.layout && this.layout.description || '');
  }

  mapIsVisible(val: boolean) {
    if ( val )
      this.gridManager.pause();
    else
      this.gridManager.interactiveMode();
  }

  onLayoutChange(layout: Layout) { }

  displayPDV(id: number) {
    let gridManager = this.gridManager!;
    if ( gridManager.loaded )
      (gridManager.instances[0] as TableComponent).displayInfobar(id);
    else this.subscribe(gridManager.state, state => {
      if ( !state.loaded ) return;
      let table = state.instances![0] as TableComponent;
      this.unsubscribe(gridManager.state);
      this.once(table.gridLoaded!, () => table.displayInfobar(id));
    });
  }

  private computeDescription(description: string | string[]): string {
    let isArray = Array.isArray(description),
      compute = isArray && description.length >= 1;
    if ( compute )
      return CD.computeDescription(this.filtersService.getState().node, description as string[]);

    return isArray ? description[0] : (description as string);
  }

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dataservice.endUpdateThread();
    this.dataservice.sendQueuedDataToUpdate();
    this.localStorageService.handleDisconnect();
  }
}