import { type ChildProcess } from "child_process";


export type Process = ChildProcess & Required<Pick<NodeJS.Process, "send">>

export type Options = {
	requestHeader?: string,
	responseHeader?: string,
	uid?: () => string
};

export type RequestMessage = [
	header: string,
	id: string,
	kind: string,
	...unknown[]
];

export type ResponseMessage = [
	header: string,
	id: string,
	error: { message: string, [key: string]: unknown } | string,
	result: unknown
];
