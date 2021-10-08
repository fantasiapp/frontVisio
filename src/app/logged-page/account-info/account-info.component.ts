import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of } from 'rxjs';
import { AuthService } from 'src/app/connection/auth.service';
import { FiltersStatesService } from 'src/app/filters/filters-states.service';
import { PDV } from 'src/app/middle/Slice&Dice';

@Component({
  selector: 'account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountInfoComponent {
  @HostListener('mouseover')
  openDropDown() {
    this.dropped = true;
    if ( this.dropdown )
      this.dropdown.nativeElement.style.display = 'block';
  }

  @HostListener('mouseout')
  closeDropDown() {
    this.dropped = false;
  }

  @HostListener('transitionend')
  onTransitionEnd() {
    if ( !this.dropped && this.dropdown ) {
      this.dropdown.nativeElement.style.display = 'none';
    }
  }

  @ViewChild('dropdown', {static: true, read: ElementRef})
  private dropdown?: ElementRef;

  @Input()
  name: string = '';
  dropped: boolean = false;

  constructor(private filtersService: FiltersStatesService, private auth: AuthService) { }

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
