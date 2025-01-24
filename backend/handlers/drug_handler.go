package handlers

import (
	"encoding/json"
	"fmt"
	"medicine/backend/models"
	"medicine/backend/repositories"
	"medicine/backend/services"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type DrugHandler struct {
	DrugService *services.DrugService
}

func NewDrugHandler(repo repositories.DrugRepository) *DrugHandler {
	return &DrugHandler{
		DrugService: services.NewDrugService(&repo),
	}
}

func (h *DrugHandler) GetDrugs(w http.ResponseWriter, r *http.Request) {
	drugs, err := h.DrugService.GetAllDrugs()
	if err != nil {
		http.Error(w, "خطا در دریافت داروها", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(drugs)
}

func (h *DrugHandler) AddDrug(w http.ResponseWriter, r *http.Request) {
	var drug models.Drug
	if err := json.NewDecoder(r.Body).Decode(&drug); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	if err := h.DrugService.AddDrug(drug); err != nil {
		http.Error(w, "خطا در افزودن دارو", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *DrugHandler) EditDrug(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "شناسه نامعتبر", http.StatusBadRequest)
		return
	}

	var drug models.Drug
	if err := json.NewDecoder(r.Body).Decode(&drug); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	drug.ID = uint(id)
	if err := h.DrugService.UpdateDrug(drug); err != nil {
		http.Error(w, "خطا در به‌روزرسانی دارو", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *DrugHandler) DeleteDrug(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "شناسه نامعتبر", http.StatusBadRequest)
		return
	}

	// چاپ مقدار id برای دیباگ
	fmt.Println("Deleting drug with ID:", id)

	if err := h.DrugService.DeleteDrug(uint(id)); err != nil {
		http.Error(w, "خطا در حذف دارو", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
