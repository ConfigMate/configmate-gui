package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// RulebookRequest represents the expected structure of the POST request body.
type RulebookRequest struct {
	Rulebook string `json:"rulebook"`
}

// Token represents the structure of the token_list in the response.
type Token struct {
	File   string `json:"file"`
	Row    int    `json:"row"`
	Col    int    `json:"col"`
	Length int    `json:"length"`
}

// RuleResponse represents the structure of each rule in the response body.
type RuleResponse struct {
	Passed          bool    `json:"passed"`
	ResponseComment string  `json:"result_comment"`
	TokenList       []Token `json:"token_list"`
}

func main() {
	http.HandleFunc("/api/check", checkHandler)

	// Set the port number
	port := "8080"
	fmt.Printf("ConfigMate is running on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func checkHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RulebookRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// For the sake of this example, let's create a mock response.
	// In a real-world scenario, you would perform some checks based on the rulebook file and populate the response accordingly.
	resp := []RuleResponse{
		{
			Passed:          true,
			ResponseComment: "Rule is being met",
			TokenList: []Token{
				{File: req.Rulebook, Row: 1, Col: 1, Length: 5},
				{File: req.Rulebook, Row: 2, Col: 3, Length: 7},
			},
		},
		{
			Passed:          false,
			ResponseComment: "Error: Rule is not being met",
			TokenList: []Token{
				{File: req.Rulebook, Row: 3, Col: 2, Length: 4},
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
