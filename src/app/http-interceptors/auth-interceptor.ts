import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

import { AuthService } from "../connection/auth.service";

import { HTTP_INTERCEPTORS } from "@angular/common/http";

@Injectable()
export class AuthInterceptor implements HttpInterceptor{ //set default headers on outgoing requests with the authentification token

    constructor( private auth: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const authToken = this.auth.getAuthorizationToken();

        // Clone the request and set the new header in one step.
        const authReq = req.clone({ setHeaders: { Authorization: authToken } });
        
        return next.handle(authReq);
    }

}