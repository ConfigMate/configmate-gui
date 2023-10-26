export interface cmRequest { 
	rulebook_path: string,
}

export interface cmResponse {
	passed: boolean,
	result_comment: string,
	token_list: Token[]
}

export interface Token {
	file: string,
	row: number,
	col: number,
	length: number
}

export interface Node {
	NameLocation: {
		Line: Number,
		Column: Number,
		Length: Number
	},
	ValueLocation: {
		Line: Number,
		Column: Number,
		Length: Number
	}
}

export interface Rule {
	description: string,
	checkName: string,
	args: string
}

export interface Rulebook {
	name: string,
	description: string,
	files: Configs,
	rules: Rule[]
}

export interface Config {
	path: string,
	format: string
}
export interface Configs {
	[key: string]: Config
}