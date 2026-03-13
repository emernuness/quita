import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const status = exception.getStatus();
		const exceptionResponse = exception.getResponse();

		response.status(status).json({
			success: false,
			...(typeof exceptionResponse === "string"
				? { message: exceptionResponse }
				: exceptionResponse),
		});
	}
}
