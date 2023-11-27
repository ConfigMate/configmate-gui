import { TokenResponse, cmRequest, cmResponse } from "./models";
import axios from 'axios';

export const analyzeSpec = async(filepath: string, fileContents: string): Promise<cmResponse> => {
	const url: string = 'http://localhost:10007/api/analyze_spec';
	const content: number[] = readFile(fileContents);
	const data: cmRequest = {
		spec_file_path: filepath,
		spec_file_content: content
	};

	try {
		const response = await axios({
			method: 'post',
			url,
			data
		});

		// console.log(response.data);
		return Promise.resolve(response.data as cmResponse);
	} catch (error) {
		console.error(error);
		return Promise.reject(error);
	}
}

export const getSemanticTokens = async (fileContents: string): Promise<TokenResponse | null> => {
	const url: string = "http://localhost:10007/api/get_semantic_tokens";
	let result: TokenResponse | null = null;
	try {
		const data = { content: readFile(fileContents) };
		const response = await axios({ method: 'post', url, data });
		result = response.data as TokenResponse;
	} catch (error) {
		console.error(error);
	}
	return result;
}

const readFile = (fileContents: string): number[] => {
	// convert content to byte[]
	const contentBuffer = Buffer.from(fileContents, 'utf-8');
	return Array.from(contentBuffer);
}