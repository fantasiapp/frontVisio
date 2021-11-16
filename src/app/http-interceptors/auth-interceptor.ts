import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";

import { AuthService } from "../connection/auth.service";

/**
 * Sets default headers on outgoing requests with the authentification token
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor{

    constructor( private auth: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authToken = this.auth.getAuthorizationToken();
        if (!req.url.includes('api-token-auth')) {
            const authReq = req.clone({ setHeaders: { Authorization: `Token ${authToken}` } });
            return next.handle(authReq);
        }
        if(this.auth.checkToken(authToken, req.body)) {
            return of({'token': authToken}) as Observable<any>;
        }
        return next.handle(req);
    }
}