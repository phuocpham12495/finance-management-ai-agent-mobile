# Finance Management AI Agent Mobile

A React Native mobile application for personal finance management, powered by Supabase and the Gemini AI API.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Rename `.env.example` to `.env` and fill in your Supabase Anon Key.
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://emjnkvjhwspdarrppwcq.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start the App**
   ```bash
   npx expo start
   ```

## Features
- Supabase Authentication
- Dashboard with Financial Summaries
- Manage Transactions (Income / Expense)
- Custom Categories
- AI Chatbot Interface (Ready for Edge Function Integration)
