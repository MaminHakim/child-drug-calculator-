package main

import (
	"medicine/backend/database"
	"medicine/backend/handlers"
	"medicine/backend/middleware"
	"medicine/backend/repositories"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Initialize database
	database.InitDB()

	// Initialize repositories
	drugRepository := repositories.NewDrugRepository()

	// Initialize handlers
	drugHandler := handlers.NewDrugHandler(*drugRepository)
	userHandler := handlers.NewUserHandler()
	authHandler := handlers.NewAuthHandler()

	// Setup routes
	r := mux.NewRouter()
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

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	// Start server
	http.ListenAndServe(":8080", handler)
}
