# Android Build Guide (APK)

This guide explains how to build a standalone Android APK for testing and distribution using **EAS Build**.

## 1. Install EAS CLI
First, install the EAS command-line tool globally if you haven't already:
```bash
npm install -g eas-cli
```

## 2. Login to Expo
Log in to your Expo account:
```bash
eas login
```

## 3. Configure EAS
Configure your project for EAS:
```bash
eas build:configure
```

## 4. Setup `eas.json` for APK
By default, EAS Build creates an Android App Bundle (`.aab`) for the Play Store. To generate a `.apk` file, ensure your `eas.json` contains a `preview` or `development` profile with `buildType` set to `apk`.

Create or update `eas.json` in your project root:
```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## 5. Build the APK
Run the following command to start the build process:
```bash
eas build -p android --profile preview
```

### What happens next?
1.  **Project Credentials**: EAS will ask if you want it to handle your Android Keystore. Type `Y` to let Expo manage it.
2.  **Wait**: The build happens on Expo's servers. It may take 10-20 minutes depending on the queue.
3.  **Download**: Once finished, the terminal will provide a URL to download your `.apk` file.

## 6. Local Build (Alternative)
If you have Android Studio and Java installed, you can build locally:
```bash
npx expo run:android --variant release
```
*Note: This requires a full Android development environment.*

## 💡 Tips
- **Google Services**: Ensure your `google-services.json` is correctly placed in the root if you are using Firebase features (Notifications, etc.).
- **Permissions**: Check `app.json` for any necessary android permissions (Microphone, Notifications).
