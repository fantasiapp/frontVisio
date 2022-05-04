import {
  Component,
  OnInit,
  ViewChild,
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
import { BehaviorSubject, combineLatest, of, Subscription } from 'rxjs';
import { delay, take } from 'rxjs/operators';

import {
  REQUEST_DATA, CONNEXION_SUCESS, CONNECTION_ERROR
} from './login-server-info/login-server-info.component'
import { LoginFormComponent } from './login-form/login-form.component';
import { GoogleLoginProvider, SocialAuthService } from 'angularx-social-login';
import { local } from 'd3-selection';

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
  @ViewChild(LoginFormComponent)
  loginForm?: LoginFormComponent;

  connexionState = new Subject<number>();
  private subscription?: Subscription;
  private destroy$: Subject<void> = new Subject<void>();
  private logInObserver = {
    next: (success: any) => { //a pu se connecter avec Internet, l'utilisateur précédent était peut être différent
      if (success) {
        this.successLogin();
      }
    },
    error: (e: Error) => {
      this.loginForm?.handleError();
    }
  }
  constructor(
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private dataservice: DataService,
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}
  userValid = false;
  retry = true;
  alreadyConnected: boolean = false;
  stayConnected: boolean = false;
  serverIsLoading: boolean = false;

  successLogin() {
    let lastToken = this.localStorageService.getLastToken();
    let newToken = this.authService.getAuthorizationToken();
    this.localStorageService.setAlreadyConnected(true)
    if(lastToken) { //quick manip to fool the auth interceptor
      this.authService.token = lastToken;
      this.dataservice.sendQueuedDataToUpdate();
      this.authService.token = newToken;
    }
    this.localStorageService.saveLastToken(newToken)
    this.userValid = true;
    this.dataservice.requestData();
    this.connexionState.next(REQUEST_DATA);
    if(this.stayConnected) this.localStorageService.saveStayConnected(true);
    else this.localStorageService.removeStayConnected(); //au cas où
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
    this.dataservice.$serverLoading.subscribe((val: boolean) => this.serverIsLoading = val)
    this.dataservice.load.pipe(take(1)).subscribe(() => {
      this.connexionState.next(CONNEXION_SUCESS);
    })
    this.subscription = combineLatest([
      this.dataservice.load,
      of(null).pipe(delay(4000))
    ]).subscribe(() => {
      setTimeout(() => {
        this.router.navigate([
          sessionStorage.getItem('originalPath') || 'logged',
        ]);
      }, 1000);
    }, (err) => {
      console.log('error', err);
      this.connexionState.next(CONNECTION_ERROR);
    });
  }

  ngOnInit(): void {
    if(this.isAlreadyConnected()) return;
    else {
      if(this.authService.isStayConnected()) { //se connecte même sans internet, n'ira pas chercher les données au serveur,  l'utilisateur précédent est forcément le même
        LocalStorageService.getFromCache = true;
        this.userValid = true;
        this.authService.handleTokenSave();
        this.dataservice.requestData();
        this.router.navigate([
          sessionStorage.getItem('originalPath') || 'logged',
        ]);
        this.authService.isLoggedIn.next(true);
      }
    }
    this.serverIsLoading = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription?.unsubscribe();
  }

  isAlreadyConnected(): boolean {
    this.alreadyConnected = this.localStorageService.getAlreadyConnected();
    return this.alreadyConnected;
  }

  onLoading(username: string, password: string, stayConnected: boolean) {
    if(this.isAlreadyConnected()) return;
    //console.log("user : ", username, "pass : ", password, "sc : ", stayConnected)
    this.stayConnected = stayConnected;
    let auth = this.authService.loginToServer(username, password);
    auth.subscribe(this.logInObserver);
  }

  clickButtonLoginGoogle() {
    if(this.isAlreadyConnected()) return;
    this.socialAuthService.signIn(GoogleLoginProvider.PROVIDER_ID).then((userData) => {
      console.log("userData", userData);
      let auth = this.authService.loginWithGoogle(userData);
      auth.subscribe(this.logInObserver);

    });
    this.authService.isLoggedIn.next(true);
  }

  enableForceLogin() {
    this.alreadyConnected = false;
    this.localStorageService.handleDisconnect(true)
  }
  
}
