import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddOrEditTransactionScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const isEdit = id !== 'add' && id !== undefined;

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const { t } = useTranslation();
    const [budgets, setBudgets] = useState<any[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            // Fetch categories
            supabase
                .from('categories')
                .select('*')
                .eq('user_id', session.user.id)
                .then(({ data }) => setCategories(data || []));

            // Fetch transaction details if editing
            if (isEdit) {
                supabase
                    .from('transactions')
                    .select('*')
                    .eq('id', id)
                    .single()
                    .then(({ data, error }) => {
                        if (data) {
                            setAmount(data.amount?.toString() || '');
                            setDescription(data.description || '');
                            setType(data.type);
                            setSelectedCategory(data.category_id);
                        }
                        setFetching(false);
                    });
            }

            // Fetch budgets
            supabase
                .from('budgets')
                .select('*, categories(name)')
                .eq('user_id', session.user.id)
                .then(({ data }) => setBudgets(data || []));
        }
    }, [session, id, isEdit]);

    const handleSave = async () => {
        if (!amount || isNaN(Number(amount))) {
            Alert.alert(t('common.error'), t('transactions_screen.error_amount'));
            return;
        }
        setLoading(true);
        let error;

        if (isEdit) {
            const { error: updateError } = await supabase.from('transactions').update({
                amount: Number(amount),
                description,
                type,
                category_id: selectedCategory,
            }).eq('id', id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('transactions').insert({
                user_id: session?.user?.id,
                amount: Number(amount),
                description,
                type,
                category_id: selectedCategory,
            });
            error = insertError;
        }

        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            router.back();
        }
        setLoading(false);
    };

    const filteredCategories = categories.filter(c => c.type === type);

    if (fetching) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <Stack.Screen options={{ title: isEdit ? t('transactions_screen.edit_title') : t('transactions_screen.add_title') }} />

            <View className="flex-row items-center mb-6">
                <Text className="text-white text-lg mr-4">{t('dashboard.income')}</Text>
                <Switch
                    value={type === 'expense'}
                    onValueChange={(val) => setType(val ? 'expense' : 'income')}
                    trackColor={{ false: '#22c55e', true: '#ef4444' }}
                />
                <Text className="text-white text-lg ml-4">{t('dashboard.expense')}</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700"
                    placeholder={t('transactions_screen.amount_placeholder')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder={t('transactions_screen.description_placeholder')}
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                />

                <Text className="text-white mt-6 mb-2 font-semibold text-lg">{t('transactions_screen.select_category')}</Text>
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
                        <Text className="text-gray-400">{t('transactions_screen.manage_category')}</Text>
                    </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                    className="w-full bg-blue-600 rounded-xl py-4 items-center mt-10"
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-lg">{isEdit ? t('transactions_screen.update_transaction') : t('transactions_screen.save_transaction')}</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
