import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MapIconBuilder } from '../map.component';

@Component({
  selector: 'map-legend',
  templateUrl: './map-legend.component.html',
  styleUrls: ['./map-legend.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapLegendComponent {

  constructor() {
    MapIconBuilder.onUpdate(() => {
      this.update();
    });
  }

  update() {
    console.log(MapIconBuilder.instance);
  }
}
