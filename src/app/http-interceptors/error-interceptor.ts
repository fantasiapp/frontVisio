import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "../connection/auth.service";
import { DataService } from "../services/data.service";

/**
 * Handle http-errors, and define specific behaviours
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor{

    constructor(private auth: AuthService, private dataService: DataService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
            return next.handle(req).pipe(
                catchError((error: HttpErrorResponse) => {
                  let errorMsg = '';
                  this.auth.errorCode = error.status;
                  if (error.error instanceof ErrorEvent) {
                    //console.log('Client-side error');
                    errorMsg = `Error: ${error.error.message}`;
                  }
                  else {
                    //console.log('Server-side error');
                    errorMsg = `Error Code: ${error.status},  Message: ${error.message}`;
                  }
                  if(req.method === "POST" && req.urlWithParams.includes("action=update")) //not so clean
                      this.dataService.queueUpdate(req.body);
                  if(error.status === 401) { //Unauthorized
                    this.auth.logoutFromServer()
                  }
                  return throwError(errorMsg);
                })
              );
    }

}