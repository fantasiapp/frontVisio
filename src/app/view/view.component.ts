import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoggerService } from '../behaviour/logger.service';
import { FiltersStatesService } from '../filters/filters-states.service';
import { GridManager, Layout } from '../grid/grid-manager/grid-manager.component';
import DataExtractionHelper from '../middle/DataExtractionHelper';
import { Navigation } from '../middle/Navigation';
import { DataService } from '../services/data.service';
import { LocalStorageService } from '../services/local-storage.service';
import { TableComponent } from '../widgets/table/table.component';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.css'],
  providers: [Navigation, FiltersStatesService, LoggerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnDestroy, AfterViewInit {

  public layout: (Layout & {id: number}) | null = null;
  private mapVisible: boolean = false;

  @ViewChild('gridManager', {static: false, read: GridManager})
  gridManager?: GridManager;
  stateSubscription: Subscription;
  updateSubscription: Subscription;
  loadSubscription?: Subscription;

  componentsLoaded: boolean = false;

  constructor(private filtersService: FiltersStatesService, private dataservice: DataService, private localStorageService: LocalStorageService) {
    this.stateSubscription = filtersService.stateSubject.subscribe(({States: {dashboard}}) => {
      if ( this.layout?.id !== dashboard.id ) {
        console.log('[ViewComponent]: Layout(.id)=', dashboard.id ,'changed.');
        this.gridManager?.clear();
        console.log('components unloaded')
        this.componentsLoaded = false;
        this.layout = dashboard;
      }
    });
    

    this.updateSubscription = dataservice.update.subscribe((_) => {
      this.refresh(); //seamless transition
    });
  }

  ngAfterViewInit() {
    this.loadSubscription = this.gridManager!.componentsLoaded.subscribe(() => {
      console.log('components loaded')
      this.componentsLoaded = true;
    });
  }

  computeDescription(description: string | string[]) {
    let compute = Array.isArray(description) && description.length >= 1;
    if ( compute )
      return DataExtractionHelper.computeDescription(this.filtersService.getPath(this.filtersService.stateSubject.value.States), description as string[]);
    return description[0] || description;
  }

  mapIsVisible(val: boolean) {
    if ( this.mapVisible = val )
      this.gridManager?.pause();
    else
      this.gridManager?.interactiveMode();
  }

  onLayoutChange(layout: Layout) {
    if ( this.mapVisible )
      this.gridManager?.pause();
    else
      this.gridManager?.interactiveMode();
  }

  update() {
    this.computeDescription(this.layout && this.layout.description || '');
    this.gridManager?.update();
  }

  refresh() {
    this.computeDescription(this.layout && this.layout.description || '');
    this.gridManager?.refresh();
  }

  @HostListener('window:beforeunload')
  disconnect() {
    this.stateSubscription.unsubscribe();
    this.updateSubscription.unsubscribe();
    this.loadSubscription?.unsubscribe();
    this.dataservice.endUpdateThread();
    this.dataservice.sendQueuedDataToUpdate();
    this.localStorageService.handleDisconnect();
  }

  private displayInfobarOnce(table: TableComponent, id: number) {
    let creationSubscription: Subscription | null = null;
    creationSubscription = table.gridLoaded!.subscribe(() => {
      table.displayInfobar(id);
      creationSubscription?.unsubscribe()
    });
  }


  displayPDV(id: number) {
    if ( this.componentsLoaded ) {
      (window as any).table = this.gridManager!.instances[0];
      this.gridManager!.instances[0].displayInfobar(id);
    } else {
      let subscription: Subscription | null = null;
      subscription = this.gridManager!.componentsLoaded.subscribe((instances) => {
        let table = instances[0] as TableComponent;
        this.displayInfobarOnce(table, id);
        subscription?.unsubscribe();
     });
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}