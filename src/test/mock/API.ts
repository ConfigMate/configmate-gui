import { cmRequest, cmResponse, Token } from "../../models"

export const req: cmRequest = {
	rulebook: "path/to/rulebook",
}

export const resp: cmResponse = {
	passed: false,
	result_comment: "failed blah blah",
	token_list: []
}