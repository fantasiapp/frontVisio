import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { AuthService } from "../connection/auth.service";


@Injectable()
export class ErrorInterceptor implements HttpInterceptor{

    constructor(private auth: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
            
            // if(req.urlWithParams.includes("action=update")) {
            //   console.log("Update intercepted in Error Interceptor : ", req)
            //   return of(new HttpResponse<any>());
            // }

            return next.handle(req).pipe(
                catchError((error: HttpErrorResponse) => {
                  let errorMsg = '';
                  this.auth.errorCode = error.status;
                  if (error.error instanceof ErrorEvent) {
                    console.log('Client-side error');
                    errorMsg = `Error: ${error.error.message}`;
                  }
                  else {
                    console.log('Server-side error');
                    errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
                  }
                  console.log(errorMsg);
                  return throwError(errorMsg);
                })
              );
    }

}