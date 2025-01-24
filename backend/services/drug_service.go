package services

import (
	"errors"
	"fmt"
	"medicine/backend/models"
	"medicine/backend/repositories"
)

type DrugService struct {
	repo *repositories.DrugRepository
}

func NewDrugService(repo *repositories.DrugRepository) *DrugService {
	return &DrugService{repo: repo}
}

func (s *DrugService) GetAllDrugs() ([]models.Drug, error) {
	return s.repo.FindAll()
}

func (s *DrugService) AddDrug(drug models.Drug) error {
	return s.repo.Save(&drug)
}

func (s *DrugService) UpdateDrug(drug models.Drug) error {
	return s.repo.Save(&drug)
}

func (s *DrugService) DeleteDrug(id uint) error {
	// چاپ مقدار id برای دیباگ
	fmt.Println("Deleting drug with ID:", id)

	// کد حذف دارو از دیتابیس
	if err := s.repo.DeleteDrug(id); err != nil {
		return err
	}
	return nil
}

func (s *DrugService) CalculateDose(weight float64, drugIDs []string, dosages map[string]float64) (map[string]map[string]interface{}, error) {
	results := make(map[string]map[string]interface{})
	for _, drugID := range drugIDs {
		drug, err := s.repo.FindByID(drugID)
		if err != nil {
			return nil, err
		}

		selectedDosage := dosages[drugID]
		concentration, err := drug.GetConcentration()
		if err != nil {
			return nil, err
		}

		if len(concentration) == 0 {
			return nil, errors.New("invalid concentration data")
		}
		concentrationSlice := concentration

		totalDose := (weight * selectedDosage * 5) / concentrationSlice[0]
		dosePerDose := totalDose / float64(drug.DosesPerDay)

		results[drug.Name] = map[string]interface{}{
			"totalDose":   totalDose,
			"dosePerDose": dosePerDose,
			"usageTime":   drug.UsageTime,
			"dosesPerDay": drug.DosesPerDay,
		}
	}
	return results, nil
}
