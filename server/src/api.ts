import { cmRequest, tokenResponse } from "./models";
import axios from 'axios';

async function sendRequest(url: string, fileContents: string): Promise<tokenResponse> {
	// convert content to byte[]
	const contentBuffer = Buffer.from(fileContents, 'utf-8');
	const contentBytes = {
		content: Array.from(contentBuffer)
	}
	console.log(contentBytes);
	let data: tokenResponse | null = null;
	// const request = { content: contentBytes.data };
	try {
		const response = await axios({
			method: 'post',
			url: url,
			data: contentBytes
		});
		
		data = response.data as tokenResponse;
	} catch (error) {
		console.error(error);
	}
	return data;
}

export const getSemanticTokens = async (fileContents: string): Promise<tokenResponse | null> => {
	const url: string = "http://localhost:10007/api/get_semantic_tokens";
	// console.log(`Sending request to ${url} with filepath ${filepath}`);
	return await sendRequest(url, fileContents);
}