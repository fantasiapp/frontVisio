import { Component, AfterViewInit, ViewChild, ElementRef, Input, HostBinding } from '@angular/core';
import { AsyncSubject } from 'rxjs';
import { PDV } from '../middle/Slice&Dice';
type MarkerType = {
  position: google.maps.LatLng;
  icon?: google.maps.ReadonlyIcon;
  map?: google.maps.Map;
  title?: string;
};

function randomColor() {
  return '#'+((Math.random()*255)|0).toString(16)+((Math.random()*255)|0).toString(16)+((Math.random()*255)|0).toString(16);
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {
  @HostBinding('style.display')
  private get display() {
    return this.hidden ? 'none' : 'flex';
  }

  @ViewChild('mapContainer', {static: false})
  mapContainer?: ElementRef;

  private pdvs: PDV[] = [];
  private hidden: boolean = true;

  hide() { this.hidden = true; }
  show() { this.hidden = false; }

  map?: google.maps.Map;
  lat = 40.730610;
  lng = -73.935242;
  coordinates: google.maps.LatLng;
  ready: AsyncSubject<never> = new AsyncSubject<never>();

  constructor() {
    this.coordinates = new google.maps.LatLng(this.lat, this.lng);
  }

  ngAfterViewInit() {
    this.ready.next(0 as never);
    this.ready.complete();
  }
  
  setPDVs(pdvs: PDV[]) {
    this.pdvs = pdvs;
    this.map = new google.maps.Map(this.mapContainer!.nativeElement, {
      center: { lat: -34.397, lng: 150.644 },
      zoom: 8,
    });
    this.fromPDVs();
  };

  private addMarker(markerData: MarkerType): google.maps.Marker {
    let marker = new google.maps.Marker({
      ...markerData,
      map: this.map!,
      optimized: true
    });

    let title = markerData.title;
    if ( title )
      marker.addListener('click', () => {
        const info = new google.maps.InfoWindow({
          content: title as any
        })
        info.open(this.map, marker);
      });
    
    return marker;
  }

  private fromPDVs() {
    let markers: MarkerType[] = this.pdvs.map((pdv: PDV) => {
      return {
        position: new google.maps.LatLng(pdv.attribute('latitude'), pdv.attribute('longitude')),
        icon: this.createSVGIcon({
          fill: randomColor(),
        }),
        title: pdv.attribute('name')
      }
    });

    for ( let marker of markers )
      this.addMarker(marker);
  };

  private createSVGIcon(keys: any = {}) {
    let {
      width = 30,
      height = 30,
      strokeWidth = 1,
      fill="red",
      circleStroke='black',
      lineStroke='black'
    } = keys;
  
    return {
      url: 'data:image/svg+xml,' + encodeURIComponent(`
        <svg width='${width}' height='${height}' version='1.1' xmlns='http://www.w3.org/2000/svg'>
          ${
            keys.content ?
              keys.content :
            `<circle cy='10' cx='15' r='8' stroke='${circleStroke}' stroke-width='1' fill='${fill}'></circle>
            <line x1='15' y1='18' x2='15' y2='30' stroke='${lineStroke}' stroke-width='${strokeWidth}'></line>`
          }
        </svg>
      `),
      scaledSize: new google.maps.Size(width, height)
    };
  };
}