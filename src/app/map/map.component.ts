import { Component, AfterViewInit, ViewChild, ElementRef, Input, HostBinding } from '@angular/core';
import { AsyncSubject } from 'rxjs';
import { PDV } from '../middle/Slice&Dice';
type MarkerType = {
  pdv: PDV;
  position: google.maps.LatLng;
  icon?: google.maps.ReadonlyIcon;
  map?: google.maps.Map;
  title?: string;
};

function randomColor() {
  return '#'+((Math.random()*256)|0).toString(16)+((Math.random()*256)|0).toString(16)+((Math.random()*256)|0).toString(16);
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

  selectedPDV?: PDV;
  private pdvs: PDV[] = [];
  private hidden: boolean = true;
  private markers: google.maps.Marker[] = [];

  hide() { this.hidden = true; }
  show() { this.hidden = false; }
  get shown() { return !this.hidden; }

  map?: google.maps.Map;
  ready: AsyncSubject<never> = new AsyncSubject<never>();

  constructor() {}

  ngAfterViewInit() {
    this.ready.next(0 as never);
    this.ready.complete();
  }
  
  setPDVs(pdvs: PDV[]) {
    this.pdvs = pdvs;
    if ( !this.map )
      this.createMap();
    this.addMarkersFromPDVs();
  };

  private createMap() {
    let zoom = 7;
    this.map = new google.maps.Map(this.mapContainer!.nativeElement, {
      center: { lat: 48.52, lng: 2.19 },
      zoom,
      minZoom: zoom - 1,
      maxZoom: zoom + 6,
      gestureHandling: 'auto',
      restriction: {
        latLngBounds: {
          north: 52,
          south: 40,
          east: 15,
          west: -10,
        }
      },

      disableDefaultUI: true,
      zoomControl: true,
      rotateControl: true,
      styles: [{
        featureType: 'poi.attraction',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.school',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.sports_complex',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.place_of_worship',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.medical',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'poi.government',
        elementType: 'all',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: "poi.park",
        elementType: "geometry.fill",
        stylers: [{ color: "#81D4A0" }],
      }, {
        featureType: 'transit',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{visibility: 'off'}]
      }, {
        featureType: "landscape.natural",
        elementType: "geometry",
        stylers: [{color: "#9ADCB2"}],
      }, {
        featureType: "landscape.natural.terrain",
        elementType: "geometry",
        stylers: [{color: "#EEECE4"}],
      }, {
        featureType: 'water',
        elementType: 'geometry.fill',
        stylers: [{color: '#79A8ED'}],
      }, {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{visibility: 'off'}],
      }, {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{color: "#FFE395"}],
      }, {
        featureType: 'road.arterial',
        elementType: 'all',
        stylers: [{visibility: 'off'}],
      }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{color: '#F2B508'}],
      }, {
        featureType: 'administrative.country',
        elementType: 'geometry',
        stylers: [{color: '#e25a63', weight: 10}],
      }]
    });
  }

  handleClick(pdv: PDV) {
    this.selectedPDV = pdv;
  }

  private addMarker(markerData: MarkerType): google.maps.Marker {
    let marker = new google.maps.Marker({
      ...markerData,
      map: this.map!,
      optimized: true
    });

    let name = markerData.title;
    if ( name ) {
      let content = document.createElement('div'),
        title = document.createElement('span'),
        button = document.createElement('img');
      
      content.classList.add('infowindow');
      title.classList.add('infowindow-title');
      button.classList.add('infowindow-button');
      button.src = 'assets/! icon.svg';
      
      title.innerText = name;
      button.innerText = '❓';
      button.addEventListener('click', () => {
        this.handleClick(markerData.pdv);
      });

      content.appendChild(title);
      content.appendChild(button);

      marker.addListener('click', () => {
        const info = new google.maps.InfoWindow({
          content      
        })
        info.open(this.map, marker);
      });
    }
    
    this.markers.push(marker);
    return marker;
  }

  removeMarkers() {
    for ( let marker of this.markers )
      marker.setMap(null); 
    this.markers.length = 0;
  }

  private addMarkersFromPDVs() {
    let markers: MarkerType[] = this.pdvs.map((pdv: PDV) => {
      return {
        position: new google.maps.LatLng(pdv.attribute('latitude'), pdv.attribute('longitude')),
        icon: MapComponent.icons[Math.random()*4|0],
        title: pdv.attribute('name'),
        pdv
      }
    });

    for ( let marker of markers )
      this.addMarker(marker);
  };

  private static createSVGIcon(keys: any = {}) {
    let {
      width = 30,
      height = 30,
      strokeWidth = 1,
      fill='red',
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

  static icons = ['#A61F7D', '#0056A6', '#67CFFE', '#888888'].map(color =>
    MapComponent.createSVGIcon({fill: color})
  );
}