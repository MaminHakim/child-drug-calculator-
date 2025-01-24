package handlers

import (
	"encoding/json"
	"medicine/backend/database"
	"medicine/backend/models"
	"net/http"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("my_secret_key")

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	// پیدا کردن کاربر در دیتابیس
	var user models.User
	if err := database.DB.Where("username = ?", creds.Username).First(&user).Error; err != nil {
		http.Error(w, "کاربر یافت نشد", http.StatusUnauthorized)
		return
	}

	// بررسی رمز عبور
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err != nil {
		http.Error(w, "رمز عبور اشتباه است", http.StatusUnauthorized)
		return
	}

	// ایجاد توکن JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"role":     user.Role,
		"fullName": user.FullName,
	})

	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "خطا در ساخت توکن", http.StatusInternalServerError)
		return
	}

	// ارسال پاسخ
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}
