import { cmRequest, tokenResponse } from "./models";
import axios from 'axios';

async function sendRequest(url: string, filepath: string): Promise<tokenResponse> {
	let data: tokenResponse | null = null;
	const request: cmRequest = {
		specFilePath: filepath,
	};
	try {
		const response = await axios({
			method: 'post',
			url: url,
			data: request
		});
		
		data = response.data as tokenResponse;
	} catch (error) {
		console.error(error);
	}
	return data;
}

export const getSemanticTokens = async (filepath: string): Promise<tokenResponse | null> => {
	if (filepath.includes("file://"))
		filepath = filepath.replace("file://", "");
	const url: string = "http://localhost:10007/api/get_semantic_tokens";
	return await sendRequest(url, filepath);
}

