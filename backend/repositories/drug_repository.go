package repositories

import (
	"fmt"
	"medicine/backend/database"
	"medicine/backend/models"
)

type DrugRepository struct{}

func NewDrugRepository() *DrugRepository {
	return &DrugRepository{}
}

func (r *DrugRepository) FindAll() ([]models.Drug, error) {
	var drugs []models.Drug
	result := database.DB.Find(&drugs)
	return drugs, result.Error
}

func (r *DrugRepository) FindByID(id string) (*models.Drug, error) {
	var drug models.Drug
	result := database.DB.First(&drug, "id = ?", id)
	return &drug, result.Error
}

func (r *DrugRepository) Save(drug *models.Drug) error {
	result := database.DB.Save(drug)
	return result.Error
}
func (r *DrugRepository) DeleteDrug(id uint) error {
	// چاپ مقدار id برای دیباگ
	fmt.Println("Deleting drug with ID:", id)

	// کد حذف دارو از دیتابیس
	result := database.DB.Delete(&models.Drug{}, id)
	return result.Error
}
func (r *DrugRepository) UpdateDrug(drug *models.Drug) error {
	result := database.DB.Save(drug)
	return result.Error
}
