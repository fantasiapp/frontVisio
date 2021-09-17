import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

import { HTTP_INTERCEPTORS } from "@angular/common/http";

@Injectable()
export class Interceptor implements HttpInterceptor{

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
            return next.handle(req);
    }

}