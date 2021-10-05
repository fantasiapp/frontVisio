import { Component, AfterViewInit, ViewChild, ElementRef, Input, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AsyncSubject, combineLatest } from 'rxjs';
import { FiltersStatesService } from '../filters/filters-states.service';
import { PDV } from '../middle/Slice&Dice';
import { BasicWidget } from '../widgets/BasicWidget';

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
  styleUrls: ['./map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements AfterViewInit {
  @HostBinding('style.display')
  private get display() {
    return this.hidden ? 'none' : 'flex';
  }

  @ViewChild('mapContainer', {static: false})
  mapContainer?: ElementRef;

  private _criteria: any[] = [];

  set criteria(value: any[]) {
    this.pdvs = PDV.sliceMap(this.path, this._criteria = value);
    this.update();
  }
  
  selectedPDV?: PDV;
  private hidden: boolean = true;
  private markers: google.maps.Marker[] = [];
  
  hide() { this.hidden = true; }
  show() { this.hidden = false; }
  get shown() { return !this.hidden; }
  
  map?: google.maps.Map;
  ready: AsyncSubject<never> = new AsyncSubject<never>();
  path: any = {};
  pdvs: PDV[] = [];
  infowindow: any = {};
  markerTimeout: any = 0;

  constructor(private filtersService: FiltersStatesService, private cd: ChangeDetectorRef) {
    combineLatest([filtersService.$path, this.ready]).subscribe(([path, _]) => {
      if ( !this.pdvs.length || !BasicWidget.shallowObjectEquality(this.path, path) ) {
        this.path = path;
        this.pdvs = PDV.sliceMap(path, this._criteria);
        this.update();
      } return true;
    }); this.initializeInfowindow();
  }

  initializeInfowindow() {
    let content = this.infowindow.content = document.createElement('div'),
      title = this.infowindow.title = document.createElement('span'),
      button = this.infowindow.button = document.createElement('img');
      
    content.classList.add('infowindow');
    title.classList.add('infowindow-title');
    button.classList.add('infowindow-button');
    button.src = 'assets/Point d\'info.svg';
    
    content.appendChild(title);
    content.appendChild(button);
    this.infowindow.element = new google.maps.InfoWindow();
  }

  ngAfterViewInit() {
    this.ready.next(0 as never);
    this.ready.complete();
  }

  update() {
    this.removeMarkers();
    if ( !this.map )
      this.createMap();
    this.addMarkersFromPDVs();
  }

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
    this.cd.detectChanges();
  }

  private addMarker(markerData: MarkerType): google.maps.Marker {
    let marker = new google.maps.Marker({
      ...markerData,
      optimized: true
    });

    let name = markerData.title;
    if ( name ) {
      let info = this.infowindow.element as google.maps.InfoWindow;
      marker.addListener('click', () => {
        info.close();
        this.infowindow.title.innerText = name;
        this.infowindow.button.onclick = () => { this.handleClick(markerData.pdv); }
        info.setContent(this.infowindow.content);
        info.open(this.map, marker);
      });
    }
    
    this.markers.push(marker);
    return marker;
  }

  displayMarkers() {
    let f: any, step = 2000, idx = 0;
    this.markerTimeout = setTimeout(f = () => {
      for ( let i = idx, l = Math.min(this.markers.length, idx+step); i < l; i++ )
        this.markers[i].setMap(this.map!);
      idx += step;
      if ( idx < this.markers.length )
        setTimeout(f, 0);
    }, this.markers.length > 2000 ? this.markers.length / 20 : 0);
    //if number is too big, wait for the animation
  }

  removeMarkers() {
    for ( let marker of this.markers )
      marker.setMap(null); 
    this.markers.length = 0;
    if ( this.markerTimeout ) {
      clearTimeout(this.markerTimeout);
      this.markerTimeout = 0;
    }
  }

  private adjustMap(markers:  MarkerType[]) {
    let center = [0, 0];
    markers.forEach((marker: MarkerType) => {
      let latlng = marker.position;
      center[0] += latlng.lat();
      center[1] += latlng.lng();
    });

    center[0] /= markers.length;
    center[1] /= markers.length;

    //calculate deviation, the bigger it is, the less the zoom
    let variance = [0, 0];

    markers.forEach((marker: MarkerType) => {
      let latlng = marker.position;
      variance[0] += Math.pow(latlng.lat() - center[0], 2);
      variance[1] += Math.pow(latlng.lng() - center[1], 2);
    });

    variance[0] /= (markers.length - 1);
    variance[1] /= (markers.length - 1);
    let std = Math.sqrt(variance[0] + variance[1]);
    let zoom = MapComponent.round(10.3 - 2.64*std + 0.42*std*std);

    this.map!.setZoom(zoom || 13);

    this.map!.panTo(
      new google.maps.LatLng(
        center[0] || 48.52,
        center[1] || 2.19
      )
    );
  }

  private addMarkersFromPDVs() {
    if ( !this.pdvs.length )
      return;
    
    let markers: MarkerType[] = this.pdvs.map((pdv: PDV) => {
      let lat = pdv.attribute('latitude'),
        lng = pdv.attribute('longitude'),
        industrie = pdv.property('industrie'),
        icon = MapComponent.icons[industrie] ? MapComponent.icons[industrie] : MapComponent.icons['default'];
      
      return {
        position: new google.maps.LatLng(lat, lng),
        icon,
        title: pdv.attribute('name'),
        pdv
      }
    });

    this.adjustMap(markers);

    for ( let marker of markers )
      this.addMarker(marker);
    
    this.displayMarkers();
  };

  static createSVGIcon(keys: any = {}) {
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
            <circle cy='10' cx='15' r='8' stroke='${circleStroke}' stroke-width='1' fill='${fill}'></circle>
            <line x1='15' y1='18' x2='15' y2='30' stroke='${lineStroke}' stroke-width='${strokeWidth}'></line>
        </svg>
      `),
      scaledSize: new google.maps.Size(width, height)
    };
  };

  static icons: any = {};

  static round(x: number, threshold: number = 0.5): number {
    let int = Math.floor(x),
      frac = x - int;
    if ( frac > threshold )
      return int + 1;
    return int;
  };
}

Object.entries({1: '#A61F7D', 3: '#0056A6', 6: '#67CFFE'})
  .reduce((acc: any, [key, color]) => {acc[key] = MapComponent.createSVGIcon({fill: color}); return acc;}, MapComponent.icons);

MapComponent.icons['default'] = MapComponent.createSVGIcon({fill: '#888888'});