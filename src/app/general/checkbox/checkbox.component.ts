import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { AuthService } from 'src/app/connection/auth.service';
import { LocalStorageService } from 'src/app/services/local-storage.service';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.css']
})
export class CheckboxComponent implements OnInit {
  
  @Input()  value: boolean = false;
  @Output() valueChange = new EventEmitter<boolean>();

  changeValue(): void {
    this.valueChange.emit(!this.value);
    this.authService.setStayConnected(!this.value)
    }
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
  }

}

