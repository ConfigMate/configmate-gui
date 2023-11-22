import { TokenResponse, cmResponse } from "./models";
import axios from 'axios';

async function sendRequest(url: string, fileContents: string): Promise<TokenResponse> {
	// convert content to byte[]
	const contentBuffer = Buffer.from(fileContents, 'utf-8');
	const contentBytes = { content: Array.from(contentBuffer) };
	// console.log(contentBytes);
	let data: TokenResponse | null = null;
	// const request = { content: contentBytes.data };
	try {
		const response = await axios({
			method: 'post',
			url: url,
			data: contentBytes
		});
		
		data = response.data as TokenResponse;
	} catch (error) {
		console.error(error);
	}
	return data;
}

export const getSemanticTokens = async (fileContents: string): Promise<TokenResponse | null> => {
	const url: string = "http://localhost:10007/api/get_semantic_tokens";
	return await sendRequest(url, fileContents);
}

// export const analyzeSpec = async (fileContents: string): Promise<cmResponse | null> => {
// 	const url: string = "http://localhost:10007/api/analyze_spec";
// 	return await sendRequest(url, fileContents);
// }