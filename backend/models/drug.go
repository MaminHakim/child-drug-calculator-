package models

import (
	"encoding/json"

	"gorm.io/gorm"
)

type Drug struct {
	gorm.Model
	Name          string `json:"name"`
	Dosages       string `json:"dosages" gorm:"type:json"`       // ذخیره به صورت JSON
	Concentration string `json:"concentration" gorm:"type:json"` // ذخیره به صورت JSON
	Indication    string `json:"indication"`
	UsageTime     string `json:"usageTime"`
	DosesPerDay   int    `json:"dosesPerDay"`
}

// تبدیل JSON به آرایه برای Dosages
func (d *Drug) GetDosages() ([]float64, error) {
	var dosages []float64
	if err := json.Unmarshal([]byte(d.Dosages), &dosages); err != nil {
		return nil, err
	}
	return dosages, nil
}

// تبدیل آرایه به JSON برای Dosages
func (d *Drug) SetDosages(dosages []float64) error {
	data, err := json.Marshal(dosages)
	if err != nil {
		return err
	}
	d.Dosages = string(data)
	return nil
}

// تبدیل JSON به آرایه برای Concentration
func (d *Drug) GetConcentration() ([]float64, error) {
	var concentration []float64
	if err := json.Unmarshal([]byte(d.Concentration), &concentration); err != nil {
		return nil, err
	}
	return concentration, nil
}

// تبدیل آرایه به JSON برای Concentration
func (d *Drug) SetConcentration(concentration []float64) error {
	data, err := json.Marshal(concentration)
	if err != nil {
		return err
	}
	d.Concentration = string(data)
	return nil
}
