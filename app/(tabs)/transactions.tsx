import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function TransactionsScreen() {
    const { t } = useTranslation();
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
        Alert.alert(t('common.delete_transaction'), t('common.confirm_delete'), [
            { text: t('common.cancel'), style: "cancel" },
            {
                text: t('common.delete'),
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    const { error } = await supabase.from('transactions').delete().eq('id', id);
                    if (!error) {
                        fetchTransactions();
                    } else {
                        Alert.alert(t('common.error'), error.message);
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
                <Text className="text-2xl font-bold text-white">{t('dashboard.transactions')}</Text>
                <TouchableOpacity
                    onPress={() => router.push('/transaction/add')}
                    className="bg-blue-600 px-4 py-2 rounded-xl"
                >
                    <Text className="text-white font-medium">+ {t('common.add')}</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-20">
                {transactions.length === 0 && !loading ? (
                    <Text className="text-gray-400 italic text-center mt-10">{t('dashboard.no_transactions')}</Text>
                ) : (
                    transactions.map(tx => (
                        <View key={tx.id} className="bg-gray-800 rounded-xl p-4 flex-row justify-between items-center mb-3">
                            <View className="flex-1 mr-4">
                                <Text className="text-white font-semibold text-lg">{tx.description || (tx.type === 'income' ? 'Income' : 'Expense')}</Text>
                                <Text className="text-gray-400">{tx.categories?.name || 'Uncategorized'} • {new Date(tx.transaction_date).toLocaleDateString()}</Text>
                            </View>
                            <View className="items-end">
                                <Text className={`font-bold text-lg ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                                </Text>
                                <View className="flex-row mt-2">
                                    <TouchableOpacity onPress={() => router.push(`/transaction/${tx.id}` as any)} className="pl-4 py-1">
                                        <Text className="text-blue-400 font-medium">{t('common.edit')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(tx.id)} className="pl-4 py-1">
                                        <Text className="text-red-500 font-medium">{t('common.delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}
