import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { LocalStorageService } from "../services/local-storage.service";
import { DataService } from "../services/data.service";

/**
 * On login, and stayConnected, provides locally stored data
 */
@Injectable()
export class CachingInterceptor implements HttpInterceptor{

    constructor(private localStorageService: LocalStorageService, private dataService: DataService) {}
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{

        if (!this.isCacheable(req)) {return next.handle(req);}
        if(this.localStorageService.getStayConnected()) {
            if(!this.dataService.forceRequestData)
            return of(new HttpResponse<any>({'body': this.localStorageService.getData()}));
        }
        return next.handle(req).pipe(
                tap(stateEvent => {
                    if(stateEvent instanceof HttpResponse) {this.localStorageService.saveData(stateEvent.body)}
                })
        )
    }

    isCacheable(req: HttpRequest<any>) {
        if (req.method === 'GET' && req.urlWithParams.includes("action=dashboard")) {
            return true;
        }
        return false;
    }
}



