import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BudgetsScreen() {
    const { t } = useTranslation();
    const { session } = useAuth();

    const [budgets, setBudgets] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            // Fetch categories (expense only)
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('type', 'expense');
            setCategories(catData || []);

            // Fetch budgets
            const { data: budgetData } = await supabase
                .from('budgets')
                .select('*, categories(name)')
                .eq('user_id', session.user.id);

            // Fetch current month's expenses for each budgeted category
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const budgetsWithProgress = await Promise.all((budgetData || []).map(async (b: any) => {
                const { data: expData } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('user_id', session.user.id)
                    .eq('category_id', b.category_id)
                    .eq('type', 'expense')
                    .gte('transaction_date', startOfMonth);

                const totalSpent = expData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
                return { ...b, spent: totalSpent };
            }));

            setBudgets(budgetsWithProgress);
        } catch (error) {
            console.error('Error fetching budget data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [session]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSaveBudget = async () => {
        if (!amount || isNaN(Number(amount))) {
            Alert.alert(t('common.error'), t('budgets.error_amount'));
            return;
        }
        if (!selectedCategory) {
            Alert.alert(t('common.error'), t('budgets.error_category'));
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('budgets')
                    .update({ amount: Number(amount) })
                    .eq('id', isEditing);
                if (error) throw error;
                Alert.alert(t('common.success'), t('budgets.success_update'));
            } else {
                // Check if budget already exists for this category
                const existing = budgets.find(b => b.category_id === selectedCategory);
                if (existing) {
                    Alert.alert(t('common.error'), 'A budget for this category already exists. Edit the existing one instead.');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase
                    .from('budgets')
                    .insert({
                        user_id: session?.user?.id,
                        category_id: selectedCategory,
                        amount: Number(amount),
                        period: 'monthly'
                    });
                if (error) throw error;
                Alert.alert(t('common.success'), t('budgets.success_add'));
            }

            setAmount('');
            setSelectedCategory(null);
            setIsEditing(null);
            fetchData();
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(t('common.error'), t('budgets.delete_confirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('budgets').delete().eq('id', id);
                    if (!error) fetchData();
                }
            }
        ]);
    };

    const startEdit = (budget: any) => {
        setIsEditing(budget.id);
        setAmount(budget.amount.toString());
        setSelectedCategory(budget.category_id);
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-gray-900 justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-900 p-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
            <Text className="text-2xl font-bold text-white mb-6 mt-4">{t('budgets.title')}</Text>

            {/* Budget Form */}
            <View className="bg-gray-800 p-4 rounded-xl mb-8 border border-gray-700">
                <Text className="text-white font-semibold mb-4">{isEditing ? t('budgets.edit_budget') : t('budgets.add_budget')}</Text>

                <TextInput
                    className="bg-gray-900 text-white p-4 rounded-xl mb-4 border border-gray-700"
                    placeholder={t('budgets.amount')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text className="text-gray-400 mb-2">{t('budgets.category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`mr-2 px-4 py-2 rounded-full border ${selectedCategory === cat.id ? 'bg-blue-600 border-blue-600' : 'bg-gray-700 border-gray-600'}`}
                            disabled={!!isEditing} // Can't change category when editing
                        >
                            <Text className="text-white">{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="flex-row">
                    <TouchableOpacity
                        onPress={handleSaveBudget}
                        className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold">{isEditing ? t('common.save') : t('common.add')}</Text>
                    </TouchableOpacity>
                    {isEditing && (
                        <TouchableOpacity
                            onPress={() => { setIsEditing(null); setAmount(''); setSelectedCategory(null); }}
                            className="bg-gray-700 px-6 py-3 rounded-xl items-center ml-2"
                        >
                            <Text className="text-white font-bold">{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Budgets List */}
            <View className="mb-20">
                {budgets.length === 0 ? (
                    <Text className="text-gray-400 italic text-center mt-10">{t('budgets.no_budgets')}</Text>
                ) : (
                    budgets.map(budget => {
                        const percent = Math.min((budget.spent / budget.amount) * 100, 100);
                        const isOver = budget.spent > budget.amount;

                        return (
                            <View key={budget.id} className="bg-gray-800 p-5 rounded-2xl mb-4 border border-gray-700">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View>
                                        <Text className="text-white font-bold text-lg">{budget.categories?.name}</Text>
                                        <Text className="text-gray-400">
                                            {t('dashboard.monthly')} • ${budget.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row">
                                        <TouchableOpacity onPress={() => startEdit(budget)} className="p-2">
                                            <Ionicons name="pencil" size={20} color="#3b82f6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(budget.id)} className="p-2">
                                            <Ionicons name="trash" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View className="h-3 bg-gray-900 rounded-full overflow-hidden mb-3">
                                    <View
                                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </View>

                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">
                                        {t('dashboard.spent')}: <Text className={isOver ? 'text-red-400' : 'text-white'}>${budget.spent.toFixed(2)}</Text>
                                    </Text>
                                    <Text className="text-gray-400 text-sm">
                                        {isOver ? t('budgets.over_budget') : `${t('budgets.remaining')}: $${(budget.amount - budget.spent).toFixed(2)}`}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}
