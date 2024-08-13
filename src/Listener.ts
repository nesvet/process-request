import { defaults } from "./defaults.js";
import { type Options, type RequestMessage, type ResponseMessage } from "./types";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RequestListenerHandler = (...rest: any[]) => any;

export type RequestListenerHandlers = Record<string, RequestListenerHandler>;

export type RequestListenerOptions = {
	handler?: RequestListenerHandler;
	handlers?: RequestListenerHandlers;
} & Options;


export class RequestListener {
	constructor(process: NodeJS.Process, options?: RequestListenerHandler | RequestListenerHandlers | RequestListenerOptions) {
		this.#process = process;
		
		const {
			requestHeader,
			responseHeader,
			handler,
			handlers
		} = {
			...defaults,
			...typeof options == "function" ?
				{ handler: options as RequestListenerHandler } :
				(
					options &&
					!("requestHeader" in options) &&
					!("responseHeader" in options) &&
					!("handler" in options) &&
					!("handlers" in options)
				) ?
					{ handlers: options as RequestListenerHandlers } :
					options
		} as RequestListenerOptions;
		
		this.#requestHeader = requestHeader!;
		this.#responseHeader = responseHeader!;
		
		this.#handler = handler;
		this.#handlers = handlers;
		
		this.#process.on("message", this.#handleRequest);
		
	}
	
	#process: NodeJS.Process;
	
	#requestHeader: string;
	#responseHeader: string;
	
	#handler?: RequestListenerHandler;
	#handlers?: RequestListenerHandlers;
	
	#handleRequest = async (message: RequestMessage) => {
		if (Array.isArray(message)) {
			const [ header, id, kind, ...restArgs ] = message;
			
			if (header === this.#requestHeader) {
				let result;
				let responseError = null;
				try {
					result =
						this.#handler ?
							await this.#handler(kind, ...restArgs) :
							await this.#handlers?.[kind](...restArgs);
				} catch (error) {
					responseError =
						error instanceof Error ?
							{ ...error, message: error.message } :
							error;
				}
				this.#process.send!([ this.#responseHeader, id, responseError, result ] as ResponseMessage);
			}
		}
		
	};
	
	
	static on(process: NodeJS.Process, options: RequestListenerHandler | RequestListenerHandlers | RequestListenerOptions) {
		return new RequestListener(process, options);
	}
	
}
