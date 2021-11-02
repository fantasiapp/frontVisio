import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/connection/auth.service';
import { SubscriptionManager } from 'src/app/interfaces/Common';
import { Params } from 'src/app/middle/DataExtractionHelper';
import { PDV } from 'src/app/middle/Slice&Dice';
import { DataService } from 'src/app/services/data.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountInfoComponent extends SubscriptionManager {
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

  constructor(private auth: AuthService, private dataService: DataService, private localStorageService: LocalStorageService) {
    super();
  }

  ngOnInit() {
    this.subscribe(this.mouseEvent.pipe(debounceTime(0)), (dropped) => {
      let dropdownStyle = this.dropdown!.nativeElement.style;
      if ( dropped && !this.dropped ) {
        dropdownStyle.visibility = 'visible';
        dropdownStyle.opacity = 1;
      } else if ( !dropped && this.dropped ) {
        dropdownStyle.opacity = 0;
      }
      
      this.dropped = dropped;
    });
  }

  get username() {
    return this.clearSpace(this.auth.getUser().name || Params.pseudo);
  }

  get profileType() {
    return Params.rootLabel;
  }

  private clearSpace(name: string) {
    let l = name.split(' ');
    if ( l.length < 2 ) return name;
    return l.slice(0, -1).join(' ');
  }


  get ADStatus(): boolean {
    return Params.isAdOpen;
  }
  
  get appVersion(): string {
    return Params.softwareVersion;
  }

  get refValue(): string {
    return Params.referentielVersion;
  }

  get lastUpdateDate(): string {
    let date = this.dataService.getLastUpdateDate();
    return date.toUTCString().split(',')[1].slice(1, 12) + ' à ' + date.toTimeString().slice(0, 5).replace(':', 'h');
  }

  logout() {
    this.localStorageService.removeStayConnected();
    this.auth.logoutFromServer();
  }
}
