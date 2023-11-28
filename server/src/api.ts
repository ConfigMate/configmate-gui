import { SemanticTokenResponse, cmRequest, cmResponse } from "./models";
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

		return Promise.resolve(response.data as cmResponse);
	} catch (error) {
		console.error(error);
		return Promise.reject(error);
	}
}

export const getSemanticTokens = async (fileContents: string): Promise<SemanticTokenResponse> => {
	const url: string = "http://localhost:10007/api/get_semantic_tokens";
	try {
		const data = { content: readFile(fileContents) };
		const response = await axios({ method: 'post', url, data });
		return Promise.resolve(response.data as SemanticTokenResponse);
	} catch (error) {
		console.error(error);
	}
}

const readFile = (fileContents: string): number[] => {
	// convert content to byte[]
	const contentBuffer = Buffer.from(fileContents, 'utf-8');
	return Array.from(contentBuffer);
}