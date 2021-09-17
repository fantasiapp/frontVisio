import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

import { AuthService } from "../connection/auth.service";


@Injectable()
export class AuthInterceptor implements HttpInterceptor{ //set default headers on outgoing requests with the authentification token

    constructor( private auth: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (!req.url.includes('api-token-auth')) { //The auth.servcie request can't use a token in the header
            const authToken = this.auth.getAuthorizationToken();

            const authReq = req.clone({ setHeaders: { Authorization: `Token ${authToken}` } });
            
            return next.handle(authReq);
        }
        return next.handle(req);
    }

}