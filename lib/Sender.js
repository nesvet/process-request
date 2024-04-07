import { defaults } from "./defaults.js";


export class RequestSender {
	constructor(process, options) {
		this.process = process;
		
		const {
			requestHeader,
			responseHeader,
			uid
		} = {
			...defaults,
			...options
		};
		
		this.requestHeader = requestHeader;
		this.responseHeader = responseHeader;
		this.uid = uid;
		
		this.process.on("message", this.handleResponse);
		
	}
	
	requestsMap = new Map();
	
	send(...args) {
		return new Promise((resolve, reject) => {
			
			const id = this.uid();
			
			this.requestsMap.set(id, { resolve, reject });
			
			this.process.send([ this.requestHeader, id, ...args ]);
			
		});
	}
	
	handleResponse = message => {
		if (Array.isArray(message)) {
			const [ header, id, error, result ] = message;
			if (header === this.responseHeader) {
				const { resolve, reject } = this.requestsMap.get(id);
				
				this.requestsMap.delete(id);
				
				if (error) {
					const { message: errorMessage, ...restProps } = error;
					reject(Object.assign(new Error(errorMessage), restProps));
				} else
					resolve(result);
			}
		}
	};
	
	
	static on(process, options) {
		return new RequestSender(process, options);
	}
	
}
