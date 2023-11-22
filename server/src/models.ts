export interface cmRequest { 
	spec_file_path: string,
}

export interface cmResponseNode {
	passed: boolean,
	result_comment: string,
	token_list: Token[]
}

export interface Token {
	file: string,
	location: {
		start: {
			column: number,
			line: number
		},
		end: {
			column: number,
			line: number
		}
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
	files: {[key: string]: Config},
	rules: Rule[]
}

export interface Config {
	path: string,
	format: string
}
