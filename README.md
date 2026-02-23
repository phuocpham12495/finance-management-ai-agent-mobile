# FinanceAI: Personal iOS/Android Finance Manager

Welcome to **FinanceAI**, a next-gen React Native mobile application designed for seamless, intelligent personal finance tracking. 

Built with Expo, NativeWind, Supabase, and the Google Gemini API, this application acts as your smart financial companion allowing you to manage your budget and ask questions using natural language.

---

## 🌟 Key Features

### 🤖 Intelligent AI Chatbot (Gemini)
*   **Auto-Logging**: Chat with the AI! Tell the app *"I spent $15 on a burger for lunch"* and the AI extracts the amount and category automatically.
*   **🎙️ Refined Voice Chat**: Tap the microphone icon to record. The AI transcribes your speech into the input field so you can **review or edit it** before sending!
*   **🔊 AI Voice Toggle**: Choose whether the AI speaks back to you via the **"AI Voice Response"** setting in your Profile.
*   **Dynamic NLP Summaries**: Ask questions like *"How much did I spend last month?"* and get conversational responses with real-time data.

### 📅 Smart Budgeting & Alerts
*   **Budget Tab**: Set monthly limits for specific categories and track your spending with visual progress bars.
*   **🔔 Push Notifications**: Receive immediate push alerts if an expense (logged via AI or manually) exceeds your budget threshold.
*   **AI Budget Guard**: The AI agent is context-aware and will always warn you in chat if you've crossed your budget limit.

### 📊 Beautiful Analytics Dashboard
*   **Real-time Breakdown**: Visualize your expense habits with vibrant pie charts.
*   **Filters**: Slice your financial data by "All", "Daily", "Monthly", "Yearly", or use a precision interactive "Custom" date picker.
*   **Summary Cards**: Instant visibility into Total Balance, Income, and Expenses.

### 👤 Profile & Localization
*   **Multi-language Support**: Seamlessly switch between **English** and **Vietnamese** across the entire app and AI chat.
*   **Avatars**: Upload profile pictures from your local device via `expo-image-picker`.
*   **Personalization**: Adjust display name, Date of Birth, and Toggle Preferences (Notifications, AI Voice).

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your local development machine:
*   [Node.js](https://nodejs.org/en/)
*   [Git](https://git-scm.com/)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)
*   A [Supabase](https://supabase.com/) Account (for database/auth backend)
*   A [Google AI Studio](https://aistudio.google.com/) Account (for the Gemini API Key)

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/finance-management-ai-agent-mobile.git
cd finance-management-ai-agent-mobile
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Variables
Create a root level file named `.env` and populate it with your specific API keys:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Start the Application
Boot up the Expo Metro bundler:
```bash
npx expo start --clear
```
Use the **Expo Go** app on your physical iOS/Android device to scan the generated QR code, or press `a` or `i` to launch in a local emulator!

### 6. Build Standalone APK
For instructions on how to build a standalone `.apk` file for Android, see the **[Android Build Guide](file:///d:/AI%20Agent%20Projects/Android%20Release/finance-management-ai-agent-mobile/ANDROID_BUILD_GUIDE.md)**.

---

## 🛠️ Technology Stack
*   **Frontend**: React Native, Expo, Expo Router
*   **Styling**: NativeWind (Tailwind CSS)
*   **Backend & Auth**: Supabase
*   **AI Engine**: Google Gemini API (`gemini-1.5-flash`)
*   **Audio & Voice**: `expo-speech`, `expo-av`, `expo-file-system`
*   **Notifications**: `expo-notifications`
*   **Charts**: `react-native-chart-kit`
*   **Localization**: `i18next`, `react-i18next`
