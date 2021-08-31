import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs/internal/Subject';
import { AuthService } from 'src/app/connection/auth.service';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent implements OnInit {
  isStayConnected: boolean = false;
  @Input() errorConnection = true;
  @Output() onLogin = new EventEmitter<{
    username: string;
    password: string;
  }>();
  // @Input() badCredentials: boolean;
  // @Input() ready: boolean;

  loginForm = new FormGroup({
    username: new FormControl(''),
    password: new FormControl(''),
  });

  private destroy$: Subject<void> = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    cdr: ChangeDetectorRef, private authService: AuthService
  ) { }

  ngOnInit(): void {
  }

  handleLogin() {
    this.onLogin.emit({
      username: this.loginForm.value. username,
      password: this.loginForm.value.password,
    });
    setTimeout(() => {if (this.errorConnection){
      const input1 = document.getElementById('input-field1');
      const input2 = document.getElementById('input-field2');
      setTimeout(() => {
        input1?.classList.add('red-border')
        input2?.classList.add('red-border')
      })
      
    }
  }, 1000)
}
}
