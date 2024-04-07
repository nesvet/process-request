import { defaults } from "./defaults.js";


export class RequestListener {
	constructor(process, options) {
		this.process = process;
		
		let handler;
		let handlers;
		
		if (typeof options == "function") {
			handler = options;
			options = defaults;
		} else if (
			!("requestHeader" in options) &&
			!("responseHeader" in options) &&
			!("uid" in options) &&
			!("handler" in options) &&
			!("handlers" in options)
		) {
			handlers = options;
			options = defaults;
		} else
			({ handler, handlers } = options);
		
		const {
			requestHeader,
			responseHeader,
			uid
		} = options;
		
		this.requestHeader = requestHeader;
		this.responseHeader = responseHeader;
		this.uid = uid;
		
		this.handler = handler;
		this.handlers = handlers;
		
		this.process.on("message", this.handleRequest);
		
	}
	
	handleRequest = async message => {
		if (Array.isArray(message)) {
			const [ header, id, kind, ...restArgs ] = message;
			
			if (header === this.requestHeader) {
				let result;
				let error = null;
				try {
					result =
						this.handler ?
							await this.handler(kind, ...restArgs) :
							await this.handlers?.[kind](...restArgs);
				} catch ({ message: errorMessage, ...restProps }) {
					error = { message: errorMessage, ...restProps };
				}
				this.process.send([ this.responseHeader, id, error, result ]);
			}
		}
		
	};
	
	
	static on(process, options) {
		return new RequestListener(process, options);
	}
	
}
