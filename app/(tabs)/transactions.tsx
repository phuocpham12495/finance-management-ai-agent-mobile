import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/src/store/AuthContext';
import { supabase } from '@/src/services/supabase';
import { useRouter } from 'expo-router';

export default function TransactionsScreen() {
    const { session } = useAuth();
    const router = useRouter();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        setLoading(true);
        if (!session?.user?.id) return;

        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
          id, type, amount, description, transaction_date,
          categories(name)
        `)
                .eq('user_id', session.user.id)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    const { error } = await supabase.from('transactions').delete().eq('id', id);
                    if (!error) {
                        fetchTransactions();
                    } else {
                        Alert.alert("Error", error.message);
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    useEffect(() => {
        fetchTransactions();
    }, [session]);

    return (
        <ScrollView
            className="flex-1 bg-gray-900 p-4"
            refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransactions} tintColor="#fff" />}
        >
            <View className="flex-row justify-between items-center mb-6 mt-4">
                <Text className="text-2xl font-bold text-white">All Transactions</Text>
                <TouchableOpacity
                    onPress={() => router.push('/transaction/add')}
                    className="bg-blue-600 px-4 py-2 rounded-xl"
                >
                    <Text className="text-white font-medium">+ Add</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-20">
                {transactions.length === 0 && !loading ? (
                    <Text className="text-gray-400 italic text-center mt-10">No transactions recorded yet.</Text>
                ) : (
                    transactions.map(t => (
                        <View key={t.id} className="bg-gray-800 rounded-xl p-4 flex-row justify-between items-center mb-3">
                            <View className="flex-1 mr-4">
                                <Text className="text-white font-semibold text-lg">{t.description || (t.type === 'income' ? 'Income' : 'Expense')}</Text>
                                <Text className="text-gray-400">{t.categories?.name || 'Uncategorized'} • {new Date(t.transaction_date).toLocaleDateString()}</Text>
                            </View>
                            <View className="items-end">
                                <Text className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                                </Text>
                                <TouchableOpacity onPress={() => handleDelete(t.id)} className="mt-2 pl-4 py-1">
                                    <Text className="text-red-500 font-medium">Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}
