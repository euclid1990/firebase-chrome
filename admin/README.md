# Firebase Admin SDK

## Quickstart

```
$ go get github.com/oxequa/realize
$ realize start --run main.go
```

## Heroku

- Create Heroku App
```
$ heroku create --app app_name
$ git remote add heroku https://git.heroku.com/app_name.git

- Include .gitignored compiled/secrets files in Heroku
```
$ git checkout -b heroku
... Modify .gitignore by remove service_account.json ...
$ git add service_account.json
$ git commit "Release v1"
```

- Deploy App
```
$ cd .. // You need perform deploy in root path of Project
$ git push --force heroku `git subtree split --prefix admin HEAD`:master
```
