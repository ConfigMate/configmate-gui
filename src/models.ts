export interface Rulebook {
	name: string;
	description: string;
	files: File[];
	rules: Rule[];
}

export interface Rule {
	description: string;
	checkName: string;
	args: string[];
}

export interface File {
	name: string;
	path: string;
}
