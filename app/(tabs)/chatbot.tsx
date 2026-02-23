import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useHeaderHeight } from '@react-navigation/elements';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatbotScreen() {
    const { session } = useAuth();
    const { t, i18n } = useTranslation();
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: t('chatbot.greeting') }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string, type: string }[]>([]);
    const [budgets, setBudgets] = useState<any[]>([]);
    const [aiVoiceEnabled, setAiVoiceEnabled] = useState(false);
    const [spentContext, setSpentContext] = useState<Record<string, number>>({});

    // Voice state
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            // Fetch categories
            supabase
                .from('categories')
                .select('id, name, type')
                .eq('user_id', session.user.id)
                .then(({ data }) => setCategories(data || []));

            // Fetch budgets and current month spending
            const fetchBudgetContext = async () => {
                const { data: bData } = await supabase
                    .from('budgets')
                    .select('*, categories(name)')
                    .eq('user_id', session.user.id);
                setBudgets(bData || []);

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                const { data: txData } = await supabase
                    .from('transactions')
                    .select('amount, category_id')
                    .eq('user_id', session.user.id)
                    .eq('type', 'expense')
                    .gte('transaction_date', startOfMonth);

                const spentMap: Record<string, number> = {};
                txData?.forEach(tx => {
                    if (tx.category_id) {
                        spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + Number(tx.amount);
                    }
                });
                setSpentContext(spentMap);
            };
            fetchBudgetContext();

            // Check voice preference
            supabase.auth.getUser().then(({ data }) => {
                setAiVoiceEnabled(data.user?.user_metadata?.ai_voice_enabled === true);
            });
        }
    }, [session]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is missing in .env");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash"
            }, { apiVersion: 'v1' });

            const catsStr = categories.map(c => `ID: ${c.id}, Name: ${c.name}, Type: ${c.type}`).join('\n');
            const budgetsStr = budgets.map(b => {
                const spent = spentContext[b.category_id] || 0;
                return `${b.categories?.name}: Limit $${b.amount}, Already Spent $${spent.toFixed(2)}`;
            }).join('\n');

            const today = new Date().toISOString().split('T')[0];
            const prompt = `
You are an upbeat, supportive Personal Finance Companion. Today's date is ${today}.
Listen to the user's message and determine their intent.

INTENTS:
1. "insert": Log a new transaction.
   - Requires: amount, description, type('income' | 'expense').
   - date: YYYY-MM-DD. Default to ${today}.
   - category_id: Match from local categories or null if unsure.
2. "query": Reporting on financial status.
   - Requires: startDate, endDate (YYYY-MM-DD).
   - category_name: (optional) Filter by a specific category name.
3. "tips": User wants advice on reducing expenses or general savings.
4. "ask_category": Use this if user wants to log something but didn't provide a category AND you can't confidently guess one.

CONTEXT:
Categories:
${catsStr}

User Budgets:
${budgetsStr}

RULES:
- If "insert" is chosen, calculate the date correctly (e.g., "yesterday" = ${new Date(Date.now() - 86400000).toISOString().split('T')[0]}).
- **BUDGET RULE**: ALWAYS check the new transaction amount against the "Already Spent" and "Limit" provided in CONTEXT.
  - If the new amount causes "Already Spent" to exceed "Limit", or if it was already exceeded, you MUST explicitly mention this in your 'reply' (e.g., "Note: This category is now over budget! ⚠️"). This is MANDATORY regardless of notification settings.
- If "query", provide a summary.
- If "tips", analyze their intent and suggest ways to save based on typical spending (e.g., eating out, subscriptions).

CRITICAL: Generate a conversational, friendly 'reply' string IN: ${i18n.language === 'vi' ? 'Vietnamese' : 'English'}. Include fun, context-aware emojis.

Respond strictly with ONLY a valid JSON object:
Insert: { "intent": "insert", "amount": 10, "description": "Coffee", "type": "expense", "category_id": "...", "date": "...", "reply": "... [mention budget status here if over limit]" }
Query: { "intent": "query", "startDate": "...", "endDate": "...", "category_name": "...", "reply": "..." }
Tips: { "intent": "tips", "reply": "..." }
Ask: { "intent": "ask_category", "reply": "I'd love to log that, but which category should I use? 🏷️" }

User input: "${userMsg}"
`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let parsed;
            try {
                parsed = JSON.parse(responseText.trim().replace(/```json/g, '').replace(/```/g, ''));
            } catch (e) {
                // If it fails, maybe it returned a conversational response instead
                if (responseText.includes("amount") || responseText.includes("intent")) {
                    // Try more aggressive cleanup for loose JSON
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        parsed = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error("Failed to parse AI response as JSON: " + responseText);
                    }
                } else {
                    // conversational response fallback
                    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
                    setLoading(false);
                    return;
                }
            }

            const { intent } = parsed;

            if (intent === 'query') {
                const { startDate, endDate, category_name } = parsed;
                if (!startDate || !endDate) {
                    throw new Error("Could not determine the date range for your query.");
                }

                let query = supabase
                    .from('transactions')
                    .select('*, categories(name)')
                    .eq('user_id', session?.user?.id)
                    .gte('transaction_date', startDate)
                    .lte('transaction_date', endDate)
                    .order('transaction_date', { ascending: false });

                if (category_name) {
                    query = query.ilike('categories.name', `%${category_name}%`);
                }

                const { data: txs, error: qErr } = await query;
                if (qErr) throw qErr;

                let summary = `${parsed.reply}\n\n📊 ${t('dashboard.recentTransactions')}:\n`;
                let inc = 0, exp = 0;
                txs?.forEach(tx => {
                    summary += `- ${tx.transaction_date}: ${tx.categories?.name || 'N/A'} - $${tx.amount} (${tx.description})\n`;
                    if (tx.type === 'income') inc += Number(tx.amount);
                    else exp += Number(tx.amount);
                });
                const bal = inc - exp;
                summary += `\n💚 ${t('dashboard.income')}: $${inc.toFixed(2)}\n🔴 ${t('dashboard.expense')}: $${exp.toFixed(2)}\n💼 ${t('dashboard.totalBalance')}: $${bal.toFixed(2)}`;

                setMessages(prev => [...prev, { role: 'assistant', text: summary }]);
                if (aiVoiceEnabled) {
                    Speech.speak(summary, { language: i18n.language === 'vi' ? 'vi-VN' : 'en-US' });
                }
            } else if (intent === 'insert') {
                const { amount, description, type, category_id, date, reply } = parsed;

                if (!amount || !description || !type) {
                    throw new Error("AI could not extract enough transaction information.");
                }

                const { error: iErr } = await supabase
                    .from('transactions')
                    .insert([{
                        user_id: session?.user?.id,
                        amount: Number(amount),
                        description,
                        type,
                        category_id,
                        transaction_date: date || today
                    }]);

                if (iErr) throw iErr;

                setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
                if (aiVoiceEnabled) {
                    Speech.speak(reply, { language: i18n.language === 'vi' ? 'vi-VN' : 'en-US' });
                }
            } else {
                // tips or ask_category
                setMessages(prev => [...prev, { role: 'assistant', text: parsed.reply }]);
                if (aiVoiceEnabled) {
                    Speech.speak(parsed.reply, { language: i18n.language === 'vi' ? 'vi-VN' : 'en-US' });
                }
            }

        } catch (e: any) {
            console.error("Chat error:", e);
            setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${e.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status === 'granted') {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });
                const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                setRecording(recording);
                setIsRecording(true);
            } else {
                Alert.alert("Permission Required", "Please allow microphone access to use voice chat.");
            }
        } catch (err) {
            console.error('Failed to start recording', err);
            setIsRecording(false);
        }
    }

    async function stopRecording() {
        setIsRecording(false);
        if (!recording) return;
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            if (uri) {
                setLoading(true);
                try {
                    const base64Audio = await FileSystem.readAsStringAsync(uri, {
                        encoding: 'base64',
                    });

                    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
                    if (!apiKey) throw new Error("API Key missing");
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash"
                    }, { apiVersion: 'v1' });

                    const result = await model.generateContent([
                        "Transcribe this audio message exactly. Respond with ONLY the transcription and nothing else.",
                        {
                            inlineData: {
                                data: base64Audio,
                                mimeType: "audio/aac"
                            }
                        }
                    ]);

                    const transcription = result.response.text().trim();
                    if (transcription) {
                        setInput(transcription);
                    }
                } catch (err: any) {
                    console.error("Transcription error detail:", err);
                    Alert.alert("Transcription Error", `Could not transcribe your voice: ${err.message || "Unknown error"}. Please try typing.`);
                } finally {
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error("Failed to stop recording", err);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
            className="flex-1 bg-gray-900"
            keyboardVerticalOffset={headerHeight}
        >
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 20 }}>
                {messages.map((m, idx) => (
                    <View key={idx} className={`mb-4 max-w-[80%] ${m.role === 'user' ? 'self-end' : 'self-start'}`}>
                        <View className={`rounded-2xl p-4 ${m.role === 'user' ? 'bg-blue-600 rounded-tr-sm' : 'bg-gray-800 border border-gray-700 rounded-tl-sm'}`}>
                            <Text className="text-white text-base">{m.text}</Text>
                        </View>
                    </View>
                ))}
                {loading && (
                    <View className="bg-gray-800 border border-gray-700 self-start rounded-2xl rounded-tl-sm p-4 mb-4">
                        <ActivityIndicator color="#3b82f6" />
                    </View>
                )}
            </ScrollView>

            <View
                className="p-4 bg-gray-900 border-t border-gray-800"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
                <View className="flex-row items-center space-x-2">
                    <TouchableOpacity
                        onPress={isRecording ? stopRecording : startRecording}
                        className={`w-12 h-12 rounded-full items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-gray-800'}`}
                    >
                        <Ionicons name={isRecording ? "stop" : "mic"} size={24} color="white" />
                    </TouchableOpacity>

                    <TextInput
                        className="flex-1 bg-gray-800 text-white rounded-2xl px-4 h-12 border border-gray-700"
                        placeholder={t('chatbot.placeholder') || "Chat with AI..."}
                        placeholderTextColor="#9ca3af"
                        value={input}
                        onChangeText={setInput}
                        multiline
                    />

                    <TouchableOpacity
                        onPress={handleSend}
                        className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center"
                        disabled={loading}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
