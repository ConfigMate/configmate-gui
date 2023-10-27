import { cmRequest, cmResponseNode, Token } from "../../models"

export const req: cmRequest = {
	rulebook_path: "path/to/rulebook",
}

export const resp: cmResponseNode = {
	passed: false,
	result_comment: "failed blah blah",
	token_list: []
}