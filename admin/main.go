package main

import (
	"github.com/gin-contrib/multitemplate"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func createMyRender() multitemplate.Renderer {
	r := multitemplate.NewRenderer()
	r.AddFromFiles("index", "templates/master.html", "templates/index.html")
	r.AddFromFiles("userIndex", "templates/master.html", "templates/users/index.html")
	r.AddFromFiles("userCreate", "templates/master.html", "templates/users/create.html")
	r.AddFromFiles("userDelete", "templates/master.html", "templates/users/delete.html")
	return r
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	// Set up Multitemplate
	r.HTMLRender = createMyRender()

	// Authorized group (uses gin.BasicAuth() middleware)
	username := getEnv("BASIC_AUTH_USERNAME", "username")
	password := getEnv("BASIC_AUTH_PASSWORD", "password")
	authorized := r.Group("/", gin.BasicAuth(gin.Accounts{
		username: password,
	}))

	authorized.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "index", nil)
	})

	u := authorized.Group("/users")
	{
		u.GET("/index", func(c *gin.Context) {
			users := UserIndex()
			c.HTML(http.StatusOK, "userIndex", gin.H{
				"users": users,
			})
		})

		u.GET("/create", func(c *gin.Context) {
			c.HTML(http.StatusOK, "userCreate", nil)
		})

		u.POST("/create", func(c *gin.Context) {
			var json map[string]interface{}
			if err := c.ShouldBindJSON(&json); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
			email, ok := json["email"].(string)
			if !ok {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Please enter a valid email address",
				})
			}
			success, message := UserCreate(email)
			c.JSON(http.StatusOK, gin.H{
				"success": success,
				"message": message,
			})
		})

		u.GET("/delete", func(c *gin.Context) {
			c.HTML(http.StatusOK, "userDelete", nil)
		})

		u.POST("/delete", func(c *gin.Context) {
			var json map[string]interface{}
			if err := c.ShouldBindJSON(&json); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": err.Error(),
				})
				return
			}
			email, ok := json["email"].(string)
			if !ok {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Please enter a valid email address",
				})
			}
			success, message := UserDelete(email)
			c.JSON(http.StatusOK, gin.H{
				"success": success,
				"message": message,
			})
		})
	}

	return r
}

func main() {
	port := getEnv("PORT", "8080")
	r := setupRouter()
	r.Run(":" + port)
}
