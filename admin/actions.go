package main

import (
	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"firebase.google.com/go/db"
	"fmt"
	"golang.org/x/net/context"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"log"
	"strings"
	"time"
)

// Paid user is a json-serializable type.
type User struct {
	UID        string `json:"uid,omitempty"`
	Identifier string `json:"identifier,omitempty"`
	Providers  string `json:"providers,omitempty"`
	CreatedAt  string `json:"created_at,omitempty"`
	SignedIn   string `json:"signed_in,omitempty"`
	IsPaid     bool   `json:"is_paid,omitempty"`
}

// Paid user is a json-serializable type.
type PaidUser struct {
	Uid      string `json:"uid,omitempty"`
	Email    string `json:"email,omitempty"`
	IsPaid   bool   `json:"isPaid"`
	PaidAt   int64  `json:"paidAt"`
	UnPaidAt int64  `json:"unPaidAt"`
}

var (
	ctx        context.Context
	clientDb   *db.Client
	clientAuth *auth.Client
)

func init() {
	ctx = context.Background()
	// Initialize the app with a custom auth variable, limiting the server's access
	conf := &firebase.Config{
		DatabaseURL: getEnv("FIREBASE_DATABASE_URL", "https://firechrome-37475.firebaseio.com"),
	}
	opt := option.WithCredentialsFile("./service_account.json")
	// Create new Firebase application
	app, err := firebase.NewApp(ctx, conf, opt)
	if err != nil {
		log.Fatalf("Error initializing app: %v", err)
		return
	}

	// Init database client
	clientDb, err = app.Database(ctx)
	if err != nil {
		log.Fatalln("Error initializing database client:", err)
	}

	// Get an auth client from the firebase.App
	clientAuth, err = app.Auth(ctx)
	if err != nil {
		log.Fatalf("Error getting Auth client: %v\n", err)
	}
}

func UserIndex() []*User {
	ref := clientDb.NewRef("paid_users")
	var paidUsers map[string]interface{}
	if err := ref.Get(ctx, &paidUsers); err != nil {
		log.Fatalln("Error reading from database:", err)
	}
	log.Println(paidUsers)

	data := make([]*User, 0)
	pager := iterator.NewPager(clientAuth.Users(ctx, ""), 100, "")
	for {
		var users []*auth.ExportedUserRecord
		nextPageToken, err := pager.NextPage(&users)
		if err != nil {
			log.Fatalf("Paging error: %v\n", err)
		}
		for _, u := range users {
			createdAt := time.Unix(u.UserMetadata.CreationTimestamp*int64(time.Microsecond)/int64(time.Millisecond), 0)
			lastLoginAt := time.Unix(u.UserMetadata.LastLogInTimestamp*int64(time.Microsecond)/int64(time.Millisecond), 0)
			isPaid := false
			if paidUserI, ok := paidUsers[u.UID]; ok {
				isPaid, ok = paidUserI.(map[string]interface{})["isPaid"].(bool)
			}
			data = append(data, &User{
				UID:        u.UID,
				Identifier: u.Email,
				Providers:  u.ProviderID,
				CreatedAt:  createdAt.Format(time.RFC3339),
				SignedIn:   lastLoginAt.Format(time.RFC3339),
				IsPaid:     isPaid,
			})
		}
		if nextPageToken == "" {
			break
		}
	}
	return data
}

func UserCreate(email string) (bool, string) {
	email = strings.TrimSpace(email)
	u, err := clientAuth.GetUserByEmail(ctx, email)
	if err != nil {
		return false, fmt.Sprintf("Error getting user by email %s: %v\n", email, err)
	}
	log.Printf("Successfully fetched user data: uid=%v email=%v\n", u.UID, u.Email)

	// As an admin, the app has access to read and write all data, regradless of Security Rules
	ref := clientDb.NewRef("paid_users")
	paidUser := map[string]interface{}{
		"uid":    u.UID,
		"email":  u.Email,
		"isPaid": true,
		"paidAt": time.Now().UTC().Unix(),
	}
	err = ref.Child(u.UID).Update(ctx, paidUser)
	if err != nil {
		return false, fmt.Sprintf("Error setting value:", err)
	}
	return true, "Successfully added user"
}

func UserDelete(email string) (bool, string) {
	email = strings.TrimSpace(email)
	u, err := clientAuth.GetUserByEmail(ctx, email)
	if err != nil {
		return false, fmt.Sprintf("Error getting user by email %s: %v\n", email, err)
	}
	log.Printf("Successfully fetched user data: uid=%v email=%v\n", u.UID, u.Email)

	// As an admin, the app has access to read and write all data, regradless of Security Rules
	ref := clientDb.NewRef("paid_users")
	paidUser := map[string]interface{}{
		"uid":      u.UID,
		"email":    u.Email,
		"isPaid":   false,
		"unPaidAt": time.Now().UTC().Unix(),
	}
	err = ref.Child(u.UID).Update(ctx, paidUser)
	if err != nil {
		return false, fmt.Sprintf("Error setting value:", err)
	}
	return true, "Successfully removed user"
}
