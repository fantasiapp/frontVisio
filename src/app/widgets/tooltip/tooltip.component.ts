import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding } from '@angular/core';

export interface TooltipItem {
  color: string;
  title?: string;
  id: string;
  body: string;
}

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {
  contents: TooltipItem[] = []
  private position: {left: number, top: number} = {left: 0, top: 0};

  @HostBinding('style.left')
  get left() { return this.position.left + 'px'; }

  @HostBinding('style.top')
  get top() { return this.position.top + 'px'; }

  constructor(private cd: ChangeDetectorRef) { }

  setPosition(position: {left: number, top: number}) {
    this.position = position;
  }

  addItem(item: TooltipItem) {
    this.contents.push(item);
    this.cd.markForCheck();
  }

  removeItem(id: string) {
    let index = -1;
    for ( let i = 0; i < this.contents.length; i++ )
      if ( this.contents[i].id == id ) {
        index = i;
        break;
      }
    
    if ( index < 0 ) return false;
    this.contents.splice(index, 1);
    this.cd.markForCheck();
    return true;
  }

  get empty() { return this.contents.length == 0; }
}
