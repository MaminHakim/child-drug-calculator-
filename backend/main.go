package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.org/x/crypto/bcrypt"
)

// ساختارهای داده‌ای
type Drug struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	DosagePerKg   float64 `json:"dosagePerKg"`
	Concentration float64 `json:"concentration"`
	Indication    string  `json:"indication"`
	UsageTime     string  `json:"usageTime"`
}

type User struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
	Role     string `json:"role"`
}

type CalculationRequest struct {
	Weight  float64  `json:"weight"`
	DrugIDs []string `json:"drugIds"`
}

type AddDrugRequest struct {
	Name          string  `json:"name"`
	DosagePerKg   float64 `json:"dosagePerKg"`
	Concentration float64 `json:"concentration"`
	Indication    string  `json:"indication"`
	UsageTime     string  `json:"usageTime"`
}

type EditDrugRequest struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	DosagePerKg   float64 `json:"dosagePerKg"`
	Concentration float64 `json:"concentration"`
	Indication    string  `json:"indication"`
	UsageTime     string  `json:"usageTime"`
}

type AddUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"fullName"`
	Role     string `json:"role"`
}

type EditUserRequest struct {
	FullName string `json:"fullName"`
	Role     string `json:"role"`
}

var drugs []Drug
var users []User
var jwtKey = []byte("my_secret_key")

func main() {
	r := mux.NewRouter()

	// بارگذاری داده‌های اولیه
	loadDrugs()
	loadUsers()

	// تعریف مسیرها
	r.HandleFunc("/api/login", login).Methods("POST")
	r.HandleFunc("/api/drugs", authMiddleware(getDrugs)).Methods("GET")
	r.HandleFunc("/api/calculate", authMiddleware(calculateDose)).Methods("POST")
	r.HandleFunc("/api/drugs", adminMiddleware(addDrug)).Methods("POST")
	r.HandleFunc("/api/drugs/{id}", adminMiddleware(editDrug)).Methods("PUT")
	r.HandleFunc("/api/drugs/{id}", adminMiddleware(deleteDrug)).Methods("DELETE")
	r.HandleFunc("/api/users", adminMiddleware(getUsers)).Methods("GET")
	r.HandleFunc("/api/users", adminMiddleware(addUser)).Methods("POST")
	r.HandleFunc("/api/users/{username}", adminMiddleware(updateUser)).Methods("PUT")
	r.HandleFunc("/api/users/{username}", adminMiddleware(deleteUser)).Methods("DELETE")
	r.HandleFunc("/api/users/{username}/reset-password", adminMiddleware(resetPassword)).Methods("PUT")

	// پیکربندی CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	log.Println("سرور روی پورت 8080 راه‌اندازی شد")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// توایع مرتبط با داروها
func loadDrugs() {
	file, err := os.Open("drugs.json")
	if err != nil {
		log.Fatal("خطا در باز کردن فایل داروها:", err)
	}
	defer file.Close()

	if err := json.NewDecoder(file).Decode(&drugs); err != nil {
		log.Fatal("خطا در خواندن JSON داروها:", err)
	}
}

func saveDrugs() {
	file, err := os.Create("drugs.json")
	if err != nil {
		log.Fatal("خطا در ایجاد فایل داروها:", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(drugs); err != nil {
		log.Fatal("خطا در ذخیره داروها:", err)
	}
}

// توابع مرتبط با کاربران
func loadUsers() {
	file, err := os.Open("users.json")
	if err != nil {
		log.Fatal("خطا در باز کردن فایل کاربران:", err)
	}
	defer file.Close()

	if err := json.NewDecoder(file).Decode(&users); err != nil {
		log.Fatal("خطا در خواندن JSON کاربران:", err)
	}
}

func saveUsers() {
	file, err := os.Create("users.json")
	if err != nil {
		log.Fatal("خطا در ایجاد فایل کاربران:", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(users); err != nil {
		log.Fatal("خطا در ذخیره کاربران:", err)
	}
}

// سیستم احراز هویت
func login(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	for _, user := range users {
		if user.Username == creds.Username {
			if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(creds.Password)); err == nil {
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

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
				return
			}
		}
	}

	http.Error(w, "اعتبارسنجی نامعتبر", http.StatusUnauthorized)
}

// میدلورها
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "توکن احراز هویت وجود ندارد", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "توکن نامعتبر", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	}
}

func adminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "توکن نامعتبر", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["role"] != "admin" {
			http.Error(w, "دسترسی غیرمجاز", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// سایر توابع API
func getDrugs(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(drugs)
}

func calculateDose(w http.ResponseWriter, r *http.Request) {
	var req CalculationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	if req.Weight <= 0 || len(req.DrugIDs) == 0 {
		http.Error(w, "مقادیر ورودی نامعتبر", http.StatusBadRequest)
		return
	}

	results := make(map[string]map[string]interface{})
	for _, drugID := range req.DrugIDs {
		for _, drug := range drugs {
			if drug.ID == drugID {
				dose := (req.Weight * drug.DosagePerKg) / drug.Concentration
				results[drug.Name] = map[string]interface{}{
					"dose":      dose,
					"usageTime": drug.UsageTime,
				}
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func addDrug(w http.ResponseWriter, r *http.Request) {
	var req AddDrugRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	newDrug := Drug{
		ID:            strings.ToLower(strings.ReplaceAll(req.Name, " ", "-")),
		Name:          req.Name,
		DosagePerKg:   req.DosagePerKg,
		Concentration: req.Concentration,
		Indication:    req.Indication,
		UsageTime:     req.UsageTime,
	}

	drugs = append(drugs, newDrug)
	saveDrugs()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newDrug)
}

func editDrug(w http.ResponseWriter, r *http.Request) {
	var req EditDrugRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	for i, drug := range drugs {
		if drug.ID == req.ID {
			drugs[i] = Drug{
				ID:            req.ID,
				Name:          req.Name,
				DosagePerKg:   req.DosagePerKg,
				Concentration: req.Concentration,
				Indication:    req.Indication,
				UsageTime:     req.UsageTime,
			}
			saveDrugs()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(drugs[i])
			return
		}
	}

	http.Error(w, "دارو یافت نشد", http.StatusNotFound)
}

func deleteDrug(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	drugID := vars["id"]

	for i, drug := range drugs {
		if drug.ID == drugID {
			drugs = append(drugs[:i], drugs[i+1:]...)
			saveDrugs()
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "دارو یافت نشد", http.StatusNotFound)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func addUser(w http.ResponseWriter, r *http.Request) {
	var req AddUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "خطا در رمزنگاری پسورد", http.StatusInternalServerError)
		return
	}

	newUser := User{
		Username: req.Username,
		Password: string(hashedPassword),
		FullName: req.FullName,
		Role:     req.Role,
	}

	users = append(users, newUser)
	saveUsers()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newUser)
}

func updateUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	var req EditUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	for i, user := range users {
		if user.Username == username {
			users[i].FullName = req.FullName
			users[i].Role = req.Role
			saveUsers()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(users[i])
			return
		}
	}

	http.Error(w, "کاربر یافت نشد", http.StatusNotFound)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	for i, user := range users {
		if user.Username == username {
			users = append(users[:i], users[i+1:]...)
			saveUsers()
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	http.Error(w, "کاربر یافت نشد", http.StatusNotFound)
}

// reset password for user

func resetPassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	var req struct {
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "فرمت درخواست نامعتبر", http.StatusBadRequest)
		return
	}

	// پیدا کردن کاربر
	for i, user := range users {
		if user.Username == username {
			// هش کردن پسورد جدید
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
			if err != nil {
				http.Error(w, "خطا در رمزنگاری پسورد", http.StatusInternalServerError)
				return
			}

			// به‌روزرسانی پسورد کاربر
			users[i].Password = string(hashedPassword)
			saveUsers()

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{"message": "پسورد با موفقیت ریست شد"})
			return
		}
	}

	http.Error(w, "کاربر یافت نشد", http.StatusNotFound)
}
