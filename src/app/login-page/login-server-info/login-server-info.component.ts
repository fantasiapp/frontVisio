import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export const
  AUTHENTIFICATION_STARTED = 1 << 1,
  CONNEXION_SUCESS = 1 << 2,
  CONNECTION_ERROR = 1 << 3;

@Component({
  selector: 'login-server-info',
  templateUrl: './login-server-info.component.html',
  styleUrls: ['./login-server-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginServerInfoComponent {
  readonly AUTHENTIFICATION_STARTED = AUTHENTIFICATION_STARTED;
  readonly CONNEXION_SUCESS = CONNEXION_SUCESS;
  readonly CONNECTION_ERROR = CONNECTION_ERROR

  @Input()
  mode: number | null = AUTHENTIFICATION_STARTED;
  constructor() {

  }

  ngOnInit() {

  }
}
