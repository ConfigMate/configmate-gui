export interface Request { // ??
	Files: string[][],
	Rules: Rule[]
}

export interface Response {
	Nodes: Node[],
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
	},
	Error: Boolean
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