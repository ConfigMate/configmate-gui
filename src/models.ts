interface Rulebook {
	name: string;
	description: string;
	files: string[];
	rules: Rule[];
}

interface Rule {
	description: string;
	checkName: string;
	args: string[];
}
