import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV } from 'src/app/middle/Slice&Dice';

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

  constructor(private filtersService: FiltersStatesService, private auth: AuthService) {}

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

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getShortName() {
    let l = this.name.split(' ');
    if ( l.length < 2 ) return this.name;
    return l.slice(0, -1).join(' ');
  }

  getProfileType() {
    return new Observable((observer: Observer<string>) => {
      this.filtersService.$load.subscribe(_ => {
        observer.next(PDV.geoTree.root.label);
      });
    });
  }

  getADStatus() {
    return 'Fermée';
  }
  
  getAppVersion() {
    return '1.0.1';
  }

  getRefValue() {
    return '2.7.9';
  }

  getLastUpdateDate() {
    let date = new Date;
    return date.toUTCString().split(',')[1].slice(1, 12) + ' à ' + date.toTimeString().slice(0, 5).replace(':', 'h');
  }

  logout() {
    this.auth.logoutFromServer();
  }
}
