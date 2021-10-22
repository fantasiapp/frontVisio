import { FiltersStatesService } from './../filters/filters-states.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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
  private destroy$: Subject<void> = new Subject<void>();
  private logInObserver = {
    next: (success: any) => { //a pu se connecter, l'utilisateur précédent était peut être différent
      if (success) {
        this.dataservice.BEFOREsendQueuedDataToUpdate();
        this.localStorageService.saveLastToken(this.authService.getAuthorizationToken())
        this.userValid = true;
        this.dataservice.requestData();
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
        setTimeout(() => elmt5?.classList.add('scale'), 900)
        setTimeout(() => {
          this.router.navigate([
            sessionStorage.getItem('originalPath') || 'logged',
          ]);
        }, 6000)
      }
    }
  }
  constructor(
    cdr: ChangeDetectorRef,
    private authService: AuthService,
    private dataservice: DataService,
    private localStorageService: LocalStorageService,
    private filtersStates : FiltersStatesService,
    private router: Router
  ) {}
  userValid = false;
  retry = true;
  alreadyConnected: boolean = false;
  stayConnected: boolean = false;

  ngOnInit(): void {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLoading(username: string, password: string, stayConnected: boolean) {
    console.log("user : ", username, "pass : ", password, "sc : ", stayConnected)
    this.stayConnected = stayConnected;
    this.authService
      .loginToServer(username, password)
      .subscribe(this.logInObserver);
  }

}
