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
      transition('* => void', [animate(2000)]),
    ]),
  ],
})
export class LoginPageComponent implements OnInit {
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    cdr: ChangeDetectorRef,
    private authService: AuthService,
    private dataservice: DataService,
    private router: Router
  ) {}
  userValid = false;
  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLoading(username: string, password: string) {
    this.authService
      .loginToServer(username, password)
      .subscribe((success: any) => {
        if (success) {
          this.userValid = true
          this.dataservice.requestData();
          const elmt = document.getElementById('image-container')!;
          const elmt2 = document.getElementById('pentagon-image');
          const elmt3 = document.getElementById('logo-container');
          const elmt4 = document.getElementById('logo');
          elmt.classList.add('fadeOut');
          elmt3?.classList.add('translated');
          setTimeout(() => elmt2?.classList.add('fadeOut'), 2000);
          setTimeout(() => {elmt3?.classList.add('rotated')
          setTimeout(()=> elmt4?.classList.add('rotated'), 2400)}, 2000);
          setTimeout(() => {
            this.router.navigate([
              sessionStorage.getItem('originalPath') || 'logged',
            ]);
          }, 6000)
        }
      });
  }
}
