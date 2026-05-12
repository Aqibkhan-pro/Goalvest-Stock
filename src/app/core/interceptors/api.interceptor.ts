import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export const apiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const modifiedReq = req.clone({
    setHeaders: { 'Accept': 'application/json' }
  });

  return next(modifiedReq).pipe(
    timeout(15000),
    catchError(err => {
      console.warn(`[API] Request failed: ${req.url}`, err.status ?? err.message);
      return throwError(() => err);
    })
  );
};
