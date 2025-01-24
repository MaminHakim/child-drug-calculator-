package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `json:"username" gorm:"unique"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
	Role     string `json:"role"`
}
