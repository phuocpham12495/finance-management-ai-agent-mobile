# Fixing Android Build Failures (EAS Build)

This document provides a guide for troubleshooting and fixing common Android build issues in this project, specifically focusing on environment variables and EAS configuration.

## 🚀 Common Issue: Missing Environment Variables

The most common reason for build failures in this project is missing environment variables in the EAS build environment. If the application requires variables like Supabase URL or Gemini API keys, they **must** be explicitly provided to EAS.

### 1. The `EXPO_PUBLIC_` Prefix
All environment variables in Expo must start with `EXPO_PUBLIC_` to be accessible in the application code.

### 2. Updating `eas.json` (Quick Fix/Testing)
You can define environment variables directly in the `env` section of a build profile in `eas.json`.

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "...",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "...",
        "EXPO_PUBLIC_GEMINI_API_KEY": "..."
      }
    }
  }
}
```

### 3. Using EAS Secrets (Recommended for Security)
For sensitive keys (like API keys), it's better to use EAS Secrets:
1. Run `eas secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value your-key-here`
2. Or go to the **Expo Dashboard > Project > Secrets** and add them there.
3. EAS will automatically inject these into the build environment.

---

## 🛠 Troubleshooting Steps

### 1. Check Build Logs
If a build fails, find the log URL in the terminal or run:
```bash
eas build:list --platform android --limit 1
```

### 2. Verify Prebuild
Run a local prebuild to check for configuration errors in `app.json` or `package.json`:
```bash
npx expo prebuild --platform android --no-install
```

### 3. Google Services
If you add Firebase features later, ensure `google-services.json` is in the project root and mentioned in `app.json`:
```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

## 📋 Build Commands
- **Preview (APK):** `eas build -p android --profile preview`
- **Production (AAB):** `eas build -p android --profile production`
- **List Builds:** `eas build:list`
