# Firebase Chrome Extension

Listen to new data in Firebase and show chrome notifications

## Dependencies

```terminal
$ yarn install
```

## Environment Variables

If you do not have an `.env` file, you may have an `.env.example` file. This can just be copied using the following command

```terminal
$ cp .env.example .env
```

Setting the following configuration in `.env`:

```
API_KEY=
AUTH_DOMAIN=
DATABASE_URL=
PROJECT_ID=
STORAGE_BUCKET=
MESSAGING_SENDER_ID=
```

## Build

```terminal
$ yarn run build
```

## Load Extension

Load your extension on Chrome following:
 1. Access `chrome://extensions/`
 1. Check `Developer mode`
 1. Click on `Load unpacked extension`
 1. Select the `build` folder.
