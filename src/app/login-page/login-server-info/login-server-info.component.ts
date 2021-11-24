import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';

export const
  REQUEST_DATA = 1 << 1,
  CONNEXION_SUCESS = 1 << 2,
  CONNECTION_ERROR = 1 << 3;

@Component({
  selector: 'login-server-info',
  templateUrl: './login-server-info.component.html',
  styleUrls: ['./login-server-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginServerInfoComponent {
  readonly REQUEST_DATA = REQUEST_DATA;
  readonly CONNEXION_SUCESS = CONNEXION_SUCESS;
  readonly CONNECTION_ERROR = CONNECTION_ERROR

  _mode: number | null = null;

  constructor(private cd: ChangeDetectorRef) {}

  get mode() {
    return this._mode;
  }

  timeUntilReload: number | null = null;

  @Input()
  set mode(val: number | null) {
    this._mode = val;
    if ( this._mode == CONNECTION_ERROR ) {
      this.timeUntilReload = 5;
      setInterval(() => {
        this.timeUntilReload!--;
        this.cd.markForCheck();
        if ( !this.timeUntilReload )
          window.location.reload();
      }, 1000);
    }
  };


  ngOnInit() {

  }
}
