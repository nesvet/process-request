import { uid } from "@nesvet/n";
import { defaults } from "./defaults.js";
import { type Options, type RequestMessage, type ResponseMessage } from "./types";


export class RequestSender {
	constructor(process: NodeJS.Process, options?: Options) {
		this.#process = process;
		
		const {
			requestHeader,
			responseHeader,
			requestUid = uid
		} = {
			...defaults,
			...options
		};
		
		this.#requestHeader = requestHeader!;
		this.#responseHeader = responseHeader!;
		this.#uid = requestUid;
		
		this.#process.on("message", this.#handleResponse);
		
	}
	
	#process: NodeJS.Process;
	
	#requestHeader: string;
	#responseHeader: string;
	
	#uid: () => string;
	
	#requestsMap = new Map();
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	send(kind: string, ...args: any[]) {
		return new Promise((resolve, reject) => {
			
			const id = this.#uid();
			
			this.#requestsMap.set(id, { resolve, reject });
			
			this.#process.send!([ this.#requestHeader, id, kind, ...args ] as RequestMessage);
			
		});
	}
	
	#handleResponse = (message: ResponseMessage) => {
		if (Array.isArray(message)) {
			const [ header, id, error, result ] = message;
			if (header === this.#responseHeader) {
				const { resolve, reject } = this.#requestsMap.get(id);
				
				this.#requestsMap.delete(id);
				
				if (error) {
					const {
						message: errorMessage,
						...restErrorProps
					} = (typeof error == "object" && "message" in error) ? error : { message: error };
					reject(Object.assign(new Error(errorMessage), restErrorProps));
				} else
					resolve(result);
			}
		}
		
	};
	
	
	static on(process: NodeJS.Process, options: Options) {
		return new RequestSender(process, options);
	}
	
}
