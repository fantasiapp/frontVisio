import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { LocalStorageService } from "../services/local-storage.service";
import { AuthService } from "../connection/auth.service";


@Injectable()
export class CachingInterceptor implements HttpInterceptor{ // Checks if it is necessary to ask for the data 

    constructor(private localStorageService: LocalStorageService) {}
    
    private cache: Map<HttpRequest<any>, HttpResponse<any>> = new Map()

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{

        if (!this.isCacheable(req)) {
            return next.handle(req);
        }

        if(this.localStorageService.getStayConnected()) {
            console.log("Data from cache")
            return of(new HttpResponse<any>({'body': this.localStorageService.getData()}));
        }
        return next.handle(req).pipe(
                tap(stateEvent => {
                    if(stateEvent instanceof HttpResponse) {
                        this.localStorageService.saveData(stateEvent.body)
                    }
                })
        )
    }    

    isCacheable(req: HttpRequest<any>) {
        if (req.method === 'GET' && req.urlWithParams.includes("action=dashboard")) {
            return true;
        }
        return false;
    }
    

    fetchData(
        req: HttpRequest<any>,
        next: HttpHandler): Observable<HttpEvent<any>> {
            return next.handle(req).pipe(
                tap(event => {
                    if (event instanceof HttpResponse) {
                        this.cache.set(req, event);
                    }
                })
            )
    }

    clearCache(): void {
        this.cache.clear()
    }

}



