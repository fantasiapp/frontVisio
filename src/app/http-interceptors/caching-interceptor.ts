import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { LocalStorageService } from "../services/local-storage.service";

@Injectable()
export class CachingInterceptor implements HttpInterceptor{ //set default headers on outgoing requests with the authentification token

    constructor(private localStorageService: LocalStorageService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (isCacheable(req)){
            console.log("Cacheable request intercepted")
            const storedData = localStorage[JSON.stringify(req)];
            return storedData ? of(storedData) : fetchData(req, next)   
        }
        
        return next.handle(req); // Upgrade to cache the response
     
    }

}

function isCacheable(req: HttpRequest<any>) {
    if (req.method === 'GET' || req.method === 'POST') {
        return true;
    }
    return false;
}

function fetchData(
    req: HttpRequest<any>,
    next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            tap(event => {
                if (event instanceof HttpResponse) {
                    localStorage[JSON.stringify(req)] = JSON.stringify(event);
                }
            })
        )
}

function clearCache(): void {
    localStorage.clear()
}