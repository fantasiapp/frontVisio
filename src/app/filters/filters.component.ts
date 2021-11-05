import { FiltersStatesService } from './filters-states.service';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest } from 'rxjs';
import { SubscriptionManager } from '../interfaces/Common';
import { Node } from '../middle/Node'
import Dashboard from '../middle/Dashboard';

interface listDash {
  name: string[];
  id: number[];
}
interface listLev {
  name: string[];
  id: number[];
  label: string[];
}
interface lev {
  name: string;
  id: number;
  label: string;
}
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiltersComponent extends SubscriptionManager {
  constructor(private filtersState: FiltersStatesService, private cd: ChangeDetectorRef) {
    super();
    this.subscribe(this.filtersState.filters, ({
      dashboard, path,
      listLevel, listDashboards,
      level, superLevel, subLevels
    }) => {
      this.level = level;
      this.dashboard = dashboard;
      this.path = path;
      this.superLevel = superLevel;
      this.listLevel = listLevel;
      this.listDashboard = listDashboards;
      this.viewList = !this.superLevel ?
        this.listDashboard : this.listLevel;
      this.currentSelection = !this.superLevel ?
        dashboard : level;
      this.subLevels = subLevels;
      this.isShowingDashboards = !this.superLevel;
      this.cd.markForCheck();
    });
  }

  level!: Node;
  dashboard!: Dashboard;
  currentSelection!: Node | Dashboard;
  levelLabel: string = '';
  superLevel: Node | null = null;
  subLevels: Node[] = [];
  path: Node[] = [];
  listLevel: Node[] = [];
  listDashboard: Dashboard[] = [];
  viewList: (Node | Dashboard)[] = []; //actually Node[] | Dashboard[]
  isShowingDashboards: boolean = true;

  ngOnInit(): void { this.filtersState.emitFilters(); }

  showSuper() {
    this.filtersState.updateState(undefined, undefined, true);
  }
  
  changeDashboard(e: Event) {
    let chosenDashboardId = (e.target as any).value;
    this.filtersState.updateState(undefined, chosenDashboardId, undefined);
  }

  updateState(
    levelId: number | undefined,
    dashboardId: number | undefined,
    superLev: boolean | undefined,
    close: boolean = false
  ) {
    if (levelId) {
      if (this.viewList === this.subLevels) {
        this.filtersState.updateState(levelId, undefined, undefined);
      } else if (this.viewList[0].name === this.listLevel[0].name) {
        this.filtersState.updateState(undefined, undefined, true, false);
        this.filtersState.updateState(levelId, undefined, undefined);
      }
    } else if (dashboardId)
      this.filtersState.updateState(undefined, dashboardId, undefined);
    
    if ( close ) this.close();
  }
  showSub() {
    this.isShowingDashboards = false;
    this.filtersState.updateState(this.subLevels[0].id, undefined, undefined)
  }
  close() {
    this.filtersState.filtersVisible.next(false);
  }

  canSub() { return this.filtersState.canSub(); }

  navigateUp(height: number) {
    this.filtersState.navigateUp(height);
  }
}
