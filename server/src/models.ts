export interface cmRequest {
	specFilePath: string,
}

export interface cmResponse {
	spec: {
		file: string,
		file_format: string,
		imports: {},
		fields: Field[],
		file_location: TokenLocation,
		file_format_location: TokenLocation,
		imports_alias_location: TokenLocation,
		imports_location: TokenLocation
	},
	spec_error: cmResponseNode[],
	check_results: checkResponseNode[]
}

export interface cmResponseNode {
	analyzer_msg: string,
	error_msgs: string[],
	token_list: TokenLocation[]
}

export interface checkResponseNode {
	status: number,
	result_comment: string,
	field: Field,
	check_num: number,
	token_list: Token[]
}

export interface tokenResponse {
	semantic_tokens: ParsedToken[]
	error: string
}

export interface ParsedToken {
	line: number,
	column: number,
	length: number,
	tokenType: string
}
export interface SemanticToken {
	line: number,
	startCharacter: number,
	length: number,
	tokenType: string,
	tokenModifiers: string[]
}

export interface Token {
	file: string,
	location: TokenLocation
}

export interface TokenLocation {
	start: {
		column: number,
		line: number
	},
	end: {
		column: number,
		line: number
	}
}

export interface Field {
	field: string,
	type: string,
	optional: boolean,
	default: string,
	notes: string,
	checks: Check[],
	field_location: TokenLocation,
	type_location: TokenLocation,
	optional_location: TokenLocation,
	default_location: TokenLocation,
	notes_location: TokenLocation,
}

export interface Check {
	check: string,
	location: TokenLocation
}