import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { RequestQueueService } from '../services/request-queue.service';

@Injectable()
export class QueueInterceptor implements HttpInterceptor{

    constructor(private queueService: RequestQueueService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
            if(req.urlWithParams.includes("action=update") && req.method === "POST") {  
                console.log("intercepted")
                return this.queueService.intercept(req, next);
            }

            return next.handle(req);
    }

}