export interface cmRequest {
	spec_file_path: string,
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
	check_results: cmResponseNode[]
}
export interface cmResponseNode {
	analyzer_msg: string,
	error_msgs: string[],
	token_list: TokenLocation[]
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

interface Field {
	field: string,
	type: string,
	optional: boolean,
	default: string,
	notes: string,
	checks: [
		{
			check: string,
			location: TokenLocation
		}
	],
	field_location: TokenLocation,
	type_location: TokenLocation,
	optional_location: TokenLocation,
	default_location: TokenLocation,
	notes_location: TokenLocation,
}

export interface Rule {
	description: string,
	checkName: string,
	args: string
}

export interface Rulebook {
	name: string,
	description: string,
	files: { [key: string]: Config },
	rules: Rule[]
}

export interface Config {
	path: string,
	format: string
}
