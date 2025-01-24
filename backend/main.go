package main

import (
	"log"
	"medicine/backend/database"
	"medicine/backend/handlers"
	"medicine/backend/middleware"
	"medicine/backend/repositories"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Initialize database
	database.InitDB()
	log.Println("✅ Database connection established")

	// Initialize repositories
	drugRepository := repositories.NewDrugRepository()
	log.Println("📚 Repositories initialized")

	// Initialize handlers
	drugHandler := handlers.NewDrugHandler(*drugRepository)
	userHandler := handlers.NewUserHandler()
	authHandler := handlers.NewAuthHandler()
	log.Println("🛠 Handlers initialized")

	// Setup routes
	r := mux.NewRouter()

	// Logging middleware
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			log.Printf("📥 %s %s %s", r.Method, r.URL.Path, r.RemoteAddr)
			next.ServeHTTP(w, r)
			log.Printf("📤 %s %s completed in %v", r.Method, r.URL.Path, time.Since(start))
		})
	})

	// Routes
	r.HandleFunc("/api/login", authHandler.Login).Methods("POST")
	r.HandleFunc("/api/drugs", middleware.AuthMiddleware(drugHandler.GetDrugs)).Methods("GET")
	r.HandleFunc("/api/drugs", middleware.AdminMiddleware(drugHandler.AddDrug)).Methods("POST")
	r.HandleFunc("/api/drugs/{id}", middleware.AdminMiddleware(drugHandler.EditDrug)).Methods("PUT")
	r.HandleFunc("/api/drugs/{id}", middleware.AdminMiddleware(drugHandler.DeleteDrug)).Methods("DELETE")
	r.HandleFunc("/api/users", middleware.AdminMiddleware(userHandler.GetUsers)).Methods("GET")
	r.HandleFunc("/api/users", middleware.AdminMiddleware(userHandler.AddUser)).Methods("POST")
	r.HandleFunc("/api/users/{username}", middleware.AdminMiddleware(userHandler.UpdateUser)).Methods("PUT")
	r.HandleFunc("/api/users/{username}", middleware.AdminMiddleware(userHandler.DeleteUser)).Methods("DELETE")
	r.HandleFunc("/api/users/{username}/reset-password", middleware.AdminMiddleware(userHandler.ResetPassword)).Methods("PUT")

	log.Println("🛣 Routes registered")

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://74.243.209.111"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	// Server configuration
	server := &http.Server{
		Addr:         ":8080",
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	log.Printf("🚀 Server starting on port %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}
