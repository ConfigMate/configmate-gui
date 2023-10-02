export interface cmRequest { 
	rulebook: string,
}

export interface cmResponse {
	passed: boolean,
	response_comment: string,
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
	Description: string,
	CheckName: string,
	Args: string
}

export interface Rulebook {
	Name: string,
	Description: string,
	Files: string[],
	Rules: Rule[]
}