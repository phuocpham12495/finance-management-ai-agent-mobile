import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';

export default function AddTransactionScreen() {
    const router = useRouter();
    const { session } = useAuth();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            supabase
                .from('categories')
                .select('*')
                .eq('user_id', session.user.id)
                .then(({ data }) => setCategories(data || []));
        }
    }, [session]);

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount))) {
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }
        setLoading(true);
        const { error } = await supabase.from('transactions').insert({
            user_id: session?.user?.id,
            amount: Number(amount),
            description,
            type,
            category_id: selectedCategory,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.back();
        }
        setLoading(false);
    };

    const filteredCategories = categories.filter(c => c.type === type);

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <Text className="text-2xl font-bold text-white mb-6 mt-4">Add Transaction</Text>

            <View className="flex-row items-center mb-6">
                <Text className="text-white text-lg mr-4">Income</Text>
                <Switch
                    value={type === 'expense'}
                    onValueChange={(val) => setType(val ? 'expense' : 'income')}
                    trackColor={{ false: '#22c55e', true: '#ef4444' }}
                />
                <Text className="text-white text-lg ml-4">Expense</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700"
                    placeholder="Amount (e.g. 50.00)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder="Description"
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                />

                <Text className="text-white mt-6 mb-2 font-semibold text-lg">Select Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {filteredCategories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`mr-3 px-4 py-2 rounded-full border ${selectedCategory === cat.id ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-gray-800'}`}
                        >
                            <Text className="text-white">{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        onPress={() => router.push('/category/manage')}
                        className="mr-3 px-4 py-2 rounded-full border border-dashed border-gray-400 bg-transparent"
                    >
                        <Text className="text-gray-400">+ New Category</Text>
                    </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                    className="w-full bg-blue-600 rounded-xl py-4 items-center mt-10"
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-lg">Save Transaction</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
