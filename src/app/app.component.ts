import { Component, OnDestroy, HostListener } from '@angular/core';
import { LocalStorageService } from './services/local-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy{
  
  constructor(private localStorage: LocalStorageService){}

  @HostListener('window:beforeunload')
  ngOnDestroy(): void {
    this.localStorage.handleDisconnect(!this.localStorage.getToken());
  }
  title = 'VisioFantasiapp';
}
