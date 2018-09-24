package commands

import (
	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"firebase.google.com/go/db"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
	"golang.org/x/net/context"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"log"
	"os"
	"time"
)

// Paid user is a json-serializable type.
type PaidUser struct {
	Uid    string `json:"uid,omitempty"`
	Email  string `json:"email,omitempty"`
	IsPaid bool   `json:"isPaid"`
}

var (
	ctx        context.Context
	clientDb   *db.Client
	clientAuth *auth.Client
)

var rootCmd = &cobra.Command{
	Use:   "admin",
	Short: "The Firebase Admin SDK",
	Long: `The Admin SDK lets you interact with Firebase from privileged environments:
    - Read and write Realtime Database data.
    - Set a registered user as paid user.
    - Remove a registered user from paid user group.`,
}

var usersCmd = &cobra.Command{
	Use:   "users",
	Short: "List all users",
	Long:  `You dont need pass anything`,
	Run: func(cmd *cobra.Command, args []string) {
		table := tablewriter.NewWriter(os.Stdout)
		table.SetHeader([]string{"Identifier", "Providers", "Created", "Signed In", "User UID"})
		// Iterating by pages 100 users at a time.
		// Note that using both the Next() function on an iterator and the NextPage()
		// on a Pager wrapping that same iterator will result in an error.
		pager := iterator.NewPager(clientAuth.Users(ctx, ""), 100, "")
		for {
			var users []*auth.ExportedUserRecord
			nextPageToken, err := pager.NextPage(&users)
			if err != nil {
				log.Fatalf("Paging error: %v\n", err)
			}
			for _, u := range users {
				createdAt := time.Unix(u.UserMetadata.CreationTimestamp, 0)
				lastLoginAt := time.Unix(u.UserMetadata.LastLogInTimestamp, 0)
				table.Append([]string{u.Email, u.ProviderID, createdAt.Format(time.RFC3339), lastLoginAt.Format(time.RFC3339), u.UID})
			}
			if nextPageToken == "" {
				break
			}
		}
		table.Render()
	},
}

var addCmd = &cobra.Command{
	Use:   "add",
	Short: "Add paid user",
	Long:  `You need pass user uid to it`,
	PreRun: func(cmd *cobra.Command, args []string) {
		flagRequiredError := true
		cmd.Flags().VisitAll(func(flag *pflag.Flag) {
			if (flag.Name == "uid" || flag.Name == "email") && flag.Changed {
				flagRequiredError = false
			}
		})
		if flagRequiredError {
			log.Fatalln("Require at least 1 flag --uid or --email has been set")
		}
		return
	},
	Run: func(cmd *cobra.Command, args []string) {
		addRemove(cmd, true)
		log.Println("Successfully added user")
	},
}

var removeCmd = &cobra.Command{
	Use:   "remove",
	Short: "Remove paid user",
	Long:  `You need pass user uid to it`,
	PreRun: func(cmd *cobra.Command, args []string) {
		flagRequiredError := true
		cmd.Flags().VisitAll(func(flag *pflag.Flag) {
			if (flag.Name == "uid" || flag.Name == "email") && flag.Changed {
				flagRequiredError = false
			}
		})
		if flagRequiredError {
			log.Fatalln("Require at least 1 flag --uid or --email has been set")
		}
		return
	},
	Run: func(cmd *cobra.Command, args []string) {
		addRemove(cmd, false)
		log.Println("Successfully removed user")
	},
}

func addRemove(cmd *cobra.Command, isPaid bool) {
	uid := cmd.Flag("uid").Value.String()
	email := cmd.Flag("email").Value.String()

	if uid != "" {
		u, err := clientAuth.GetUser(ctx, uid)
		if err != nil {
			log.Fatalf("Error getting user by email %s: %v\n", email, err)
		}
		email = u.Email
		log.Printf("Successfully fetched user data: uid=%v email=%v\n", u.UID, u.Email)
	} else if email != "" {
		u, err := clientAuth.GetUserByEmail(ctx, email)
		if err != nil {
			log.Fatalf("Error getting user by email %s: %v\n", email, err)
		}
		uid = u.UID
		log.Printf("Successfully fetched user data: uid=%v email=%v\n", u.UID, u.Email)
	}

	// As an admin, the app has access to read and write all data, regradless of Security Rules
	ref := clientDb.NewRef("paid_users")
	paidUser := PaidUser{
		Uid:    uid,
		Email:  email,
		IsPaid: isPaid,
	}
	err := ref.Child(uid).Set(ctx, &paidUser)
	if err != nil {
		log.Fatalln("Error setting value:", err)
	}
}

func init() {
	// Define additional action commands
	rootCmd.AddCommand(usersCmd)
	rootCmd.AddCommand(addCmd)
	rootCmd.AddCommand(removeCmd)

	// Prepare flag for all commands
	addCmd.Flags().String("uid", "", "User UUID (Found at Authentication > Users)")
	addCmd.Flags().String("email", "", "User Email Identifier (Found at Authentication > Users)")
	removeCmd.Flags().String("uid", "", "User UUID (Found at Authentication > Users)")
	removeCmd.Flags().String("email", "", "User Email Identifier (Found at Authentication > Users)")

	ctx = context.Background()
	// Initialize the app with a custom auth variable, limiting the server's access
	conf := &firebase.Config{
		DatabaseURL: "https://firechrome-37475.firebaseio.com",
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
		log.Fatalf("error getting Auth client: %v\n", err)
	}
}

func execute() {
	if err := rootCmd.Execute(); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}

/*
func main() {
	execute()
}
*/
