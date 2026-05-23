import {
	type CallHandler,
	type ExecutionContext,
	HttpException,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { catchError, throwError } from "rxjs";
import { captureException } from "../../observability/sentry";

/**
 * Captura excecoes 5xx (nao-HttpException) e HttpExceptions com status >= 500
 * para o Sentry. Excecoes 4xx (validacao, auth) ficam de fora por design —
 * sao esperadas no fluxo normal e poluiriam o painel.
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return next.handle().pipe(
			catchError((error: unknown) => {
				const status = error instanceof HttpException ? error.getStatus() : 500;
				if (status >= 500) {
					const req = context.switchToHttp().getRequest<{
						url?: string;
						method?: string;
						user?: { id?: string };
					}>();
					captureException(error, {
						route: req?.url,
						method: req?.method,
						userId: req?.user?.id,
					});
				}
				return throwError(() => error);
			}),
		);
	}
}
