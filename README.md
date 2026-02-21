# FinanceAI: Personal iOS/Android Finance Manager

Welcome to **FinanceAI**, a next-gen React Native mobile application designed for seamless, intelligent personal finance tracking. 

Built with Expo, NativeWind, Supabase, and the Google Gemini API, this application acts as your smart financial companion allowing you to manage your budget and ask questions using natural language.

---

## 🌟 Key Features

### 🤖 Intelligent AI Chatbot (Gemini)
*   **Auto-Logging**: Chat with the AI! Instead of manually tapping out form fields, simply tell the app *"I spent $15 on a burger for lunch"* or *"I just got my $2000 salary!"* and the AI will extract the amount, description, and automatically match it to the correct custom category before saving it to your database.
*   **Dynamic NLP Summaries**: Ask the AI questions like *"How much did I spend last month?"* or *"Give me my balance from January 1st to January 15th."* The AI will intelligently query your actual database records and furnish a conversational, friendly response packed with emojis.

### 📊 Beautiful Analytics Dashboard
*   **Real-time Breakdown**: Visualize your expense habits with vibrant, animated pie charts.
*   **Filters**: Slice your financial data by "All", "Daily", "Monthly", "Yearly", or use a precision interactive "Custom" dual date picker.
*   **Summary Cards**: Instant visibility into your Total Balance, Total Income, and Total Expenses.

### 💼 Smart Transaction & Category Management
*   **Full CRUD Support**: Add, Edit, or Delete any transaction in seconds.
*   **Custom Categories**: Create, rename, edit and delete your own individualized income and expense categories (with built-in duplicate name prevention!).

### 👤 Profile Customization
*   **Personalization**: Adjust your display name, Date of Birth (using an intuitive DateTime picker), and toggle notification settings.
*   **Avatars**: Directly upload profile pictures from your local device's photo library via `expo-image-picker`.

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
Create a root level file named `.env` based off `.env.example` and populate it with your specific API keys:

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

---

## 🛠️ Technology Stack
*   **Frontend**: React Native, Expo, Expo Router
*   **Styling**: NativeWind (Tailwind CSS for React Native)
*   **Backend & Auth**: Supabase
*   **Artificial Intelligence**: Google Generative AI SDK (`gemini-2.5-flash`)
*   **Charts**: `react-native-chart-kit`
*   **UI Components**: `expo-image-picker`, `@react-native-community/datetimepicker`
