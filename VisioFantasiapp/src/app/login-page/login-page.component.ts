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

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent implements OnInit {
  private destroy$: Subject<void> = new Subject<void>();

  constructor(cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLoading(userName: string, password: string) {
    console.log("bonjour")
    this.authService.loginToServer(userName, password).subscribe((success) => {
      if (success) {
      }
      else{
        console.debug(userName, password)
      }
    });
  }
}
