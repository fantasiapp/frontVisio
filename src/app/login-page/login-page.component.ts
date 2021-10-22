import { FiltersStatesService } from './../filters/filters-states.service';
import {
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';
import { AuthService } from '../connection/auth.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { DataService } from '../services/data.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';
import { combineLatest, of, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
  animations: [
    trigger('fadeOut', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      state(
        '*',
        style({
          opacity: 1,
        })
      ),
      transition('* => void', [animate(0)]),
    ]),
  ],
})
export class LoginPageComponent implements OnInit {
  private subscription?: Subscription;
  private destroy$: Subject<void> = new Subject<void>();
  private logInObserver = {
    next: (success: any) => {
      if (success) {
        this.userValid = true;
        this.dataservice.requestData();
        if(this.stayConnected) this.localStorageService.saveToken(this.authService.getAuthorizationToken()); 
        const elmt = document.getElementById('image-container')!;
        const elmt2 = document.getElementById('pentagon-image');
        const elmt3 = document.getElementById('logo-container');
        const elmt4 = document.getElementById('logo');
        const elmt5 = document.getElementById('image-login')
        elmt.classList.add('fadeOut');
        elmt3?.classList.add('translated');
        setTimeout(() => elmt2?.classList.add('fadeOut'), 2000);
        setTimeout(() => {elmt3?.classList.add('rotated')
        setTimeout(()=> elmt4?.classList.add('rotated'), 2400)}, 2000);
        setTimeout(() => elmt5?.classList.add('scale'), 900);
        
        this.subscription = combineLatest([
          this.dataservice.load,
          of(null).pipe(delay(6000))
        ]).subscribe(() => {
          this.router.navigate([
            sessionStorage.getItem('originalPath') || 'logged',
          ]);
        });
      }
    }
  }
  constructor(
    private authService: AuthService,
    private dataservice: DataService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}
  userValid = false;
  retry = true;
  alreadyConnected: boolean = false;
  stayConnected: boolean = false;

  ngOnInit(): void {
    if(this.authService.isAlreadyConnected()){
      this.alreadyConnected = true;
    } else {
      if(this.authService.isStayConnected()) {
        LocalStorageService.getFromCache = true;
        this.userValid = true
        this.authService.handleTokenSave();
        this.dataservice.requestData();
        this.authService.isLoggedIn.next(true);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription?.unsubscribe();
  }

  onLoading(username: string, password: string, stayConnected: boolean) {
    console.log("user : ", username, "pass : ", password, "sc : ", stayConnected)
    this.stayConnected = stayConnected;
    if(this.localStorageService.getActiveToken()) this.alreadyConnected = true;
    else this.authService
      .loginToServer(username, password)
      .subscribe(this.logInObserver);
  }

}
