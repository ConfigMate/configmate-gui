package main

import (
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	args := os.Args[1:] // Get the arguments passed to the program

	// Get the directory where the executable is located
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error getting current directory:", err)
		os.Exit(1)
	}

	logFilePath := filepath.Join(dir, "configMateLog.txt") // Log file to write the arguments

	// Open the log file in append mode, create if it doesn't exist
	file, err := os.OpenFile(logFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error opening log file:", err)
		os.Exit(1)
	}
	defer file.Close()

	// Write the received arguments to the log file
	_, err = file.WriteString(fmt.Sprintf("Received Arguments: %v\n", args))
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error writing to log file:", err)
		os.Exit(1)
	}

	fmt.Println("ConfigMate Mock Program Executed")
}
