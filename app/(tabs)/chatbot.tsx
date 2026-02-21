import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/store/AuthContext';
import { supabase } from '@/src/services/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function ChatbotScreen() {
    const { session } = useAuth();
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: "Hello! I'm your AI financial assistant. You can tell me things like 'I spent $25 on coffee today' or ask 'What is my total balance?'" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string, name: string, type: string }[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            supabase
                .from('categories')
                .select('id, name, type')
                .eq('user_id', session.user.id)
                .then(({ data }) => setCategories(data || []));
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const catsStr = categories.map(c => `ID: ${c.id}, Name: ${c.name}, Type: ${c.type}`).join('\n');

            const prompt = `
You are a financial AI assistant. The user will tell you about a transaction.
You need to extract:
1. amount (number, positive)
2. description (string)
3. type ('income' or 'expense')
4. category_id (string, MUST match one of the IDs below based on the best fit for the description, or null if no fit)

Available Categories:
${catsStr}

Respond strictly with ONLY a valid JSON object containing amount, description, type, category_id, and NOTHING ELSE (no markdown code blocks, just raw JSON). Example: {"amount":15,"description":"lunch","type":"expense","category_id":"123"}
User input: "${userMsg}"
`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            let parsed;
            try {
                parsed = JSON.parse(responseText.trim().replace(/```json/g, '').replace(/```/g, ''));
            } catch (e) {
                // If it fails, maybe it returned a conversational response instead
                if (responseText.includes("amount")) {
                    throw new Error("Failed to parse AI response as JSON: " + responseText);
                } else {
                    // conversational response fallback
                    setMessages(prev => [...prev, { role: 'assistant', text: responseText }]);
                    setLoading(false);
                    return;
                }
            }

            const { amount, description, type, category_id } = parsed;

            if (!amount || !description || !type) {
                throw new Error("AI could not extract enough transaction information.");
            }

            // Insert into Supabase
            const { error } = await supabase.from('transactions').insert({
                user_id: session?.user?.id,
                amount: Number(amount),
                description,
                type,
                category_id: category_id || null,
            });

            if (error) throw error;

            setMessages(prev => [...prev, { role: 'assistant', text: `Successfully logged ${type} of $${amount} for "${description}".` }]);

        } catch (e: any) {
            setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${e.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-900"
            keyboardVerticalOffset={90}
        >
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 20 }}>
                {messages.map((m, idx) => (
                    <View key={idx} className={`mb-4 max-w-[80%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-blue-600 self-end rounded-tr-sm' : 'bg-gray-800 border border-gray-700 self-start rounded-tl-sm'}`}>
                        <Text className="text-white text-base">{m.text}</Text>
                    </View>
                ))}
                {loading && (
                    <View className="bg-gray-800 border border-gray-700 self-start rounded-2xl rounded-tl-sm p-4 mb-4">
                        <ActivityIndicator color="#3b82f6" />
                    </View>
                )}
            </ScrollView>

            <View className="p-4 bg-gray-800 border-t border-gray-700 flex-row items-center">
                <TextInput
                    className="flex-1 bg-gray-900 text-white rounded-full px-4 py-3 border border-gray-700 mr-2"
                    placeholder="Type a message..."
                    placeholderTextColor="#9ca3af"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={loading || !input.trim()}
                    className={`bg-blue-600 w-12 h-12 rounded-full items-center justify-center ${(!input.trim() || loading) && 'opacity-50'}`}
                >
                    <Text className="text-white font-bold">↑</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
