package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type Drug struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	DosagePerKg   float64 `json:"dosagePerKg"`
	Concentration float64 `json:"concentration"`
	Indication    string  `json:"indication"`
}

type CalculationRequest struct {
	Weight  float64  `json:"weight"`
	DrugIDs []string `json:"drugIds"`
}

var drugs []Drug

func main() {
	r := mux.NewRouter()

	// Load drug data
	loadDrugs()

	// Routes
	r.HandleFunc("/api/drugs", searchDrugs).Methods("GET")
	r.HandleFunc("/api/calculate", calculateDose).Methods("POST")

	// CORS setup
	handler := cors.Default().Handler(r)

	log.Println("Server started on :8080")
	http.ListenAndServe(":8080", handler)
}

func loadDrugs() {
	file, err := os.Open("drugs.json")
	if err != nil {
		log.Fatal("Error opening drugs file:", err)
	}
	defer file.Close()

	err = json.NewDecoder(file).Decode(&drugs)
	if err != nil {
		log.Fatal("Error decoding drugs JSON:", err)
	}
}

func searchDrugs(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(r.URL.Query().Get("q"))
	var results []Drug

	for _, drug := range drugs {
		if strings.Contains(strings.ToLower(drug.Name), query) {
			results = append(results, drug)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func calculateDose(w http.ResponseWriter, r *http.Request) {
	var req CalculationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	results := make(map[string]float64)
	for _, drugID := range req.DrugIDs {
		for _, drug := range drugs {
			if drug.ID == drugID {
				results[drug.Name] = (req.Weight * drug.DosagePerKg) / drug.Concentration
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}
