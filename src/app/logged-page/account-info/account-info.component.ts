import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { LoggerService } from 'src/app/behaviour/logger.service';
import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import DEH from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { DataService } from 'src/app/services/data.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountInfoComponent implements OnInit, OnDestroy {
  @HostListener('mouseover')
  openDropDown() {
    this.mouseEvent.next(true);
  }

  @HostListener('mouseout')
  closeDropDown() {
    this.mouseEvent.next(false);
  }

  @HostListener('transitionend')
  onTransitionEnd() {
    if ( !this.dropped )
      this.dropdown!.nativeElement.style.visibility = 'hidden';
  }

  @ViewChild('dropdown', {static: true, read: ElementRef})
  private dropdown?: ElementRef;

  @Input()
  name: string = '';
  dropped: boolean = false;
  private mouseEvent: Subject<boolean> = new Subject();
  private subscription!: Subscription;

  constructor(private auth: AuthService, private dataService: DataService, private localStorageService: LocalStorageService) {}

  ngOnInit() {
    this.subscription = this.mouseEvent.pipe(debounceTime(0)).subscribe(dropped => {
      let dropdownStyle = this.dropdown!.nativeElement.style;
      if ( dropped && !this.dropped ) {
        dropdownStyle.visibility = 'visible';
        dropdownStyle.opacity = 1;
      } else if ( !dropped && this.dropped ) {
        dropdownStyle.opacity = 0;
      }
      
      this.dropped = dropped;
    })
  }

  get username() {
    return DEH.get('params')['pseudo'];
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  clearSpace(name: string) {
    let l = name.split(' ');
    if ( l.length < 2 ) return name;
    return l.slice(0, -1).join(' ');
  }

  get profileType() {
    return PDV.geoTree.root.label;
  }

  getADStatus() {
    return DEH.get('params')['isAdOpen'];
  }
  
  getAppVersion() {
    return DEH.get('params')['softwareVersion'];
  }

  getRefValue() {
    return DEH.get('params')['referentielVersion'];
  }

  getLastUpdateDate() {
    let date = this.dataService.getLastUpdateDate();
    return date.toUTCString().split(',')[1].slice(1, 12) + ' à ' + date.toTimeString().slice(0, 5).replace(':', 'h');
  }

  logout() {
    this.localStorageService.removeStayConnected();
    this.auth.logoutFromServer();
  }
}
