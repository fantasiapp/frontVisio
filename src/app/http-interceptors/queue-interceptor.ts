import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { UpdateRequestQueueService } from '../services/update-request-queue.service';

@Injectable()
export class QueueInterceptor implements HttpInterceptor{

    constructor(private queueService: UpdateRequestQueueService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
            if(!navigator.onLine) {
                if(req.urlWithParams.includes("action=update") && req.method === "POST") {  
                    console.log("intercepted")
                    this.queueService.storeRequest(req.body);
                    return of();
                }
            } else {
                this.queueService.empty()
            }
            return next.handle(req);

    }

}