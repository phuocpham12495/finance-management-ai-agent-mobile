import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { session, user } = useAuth();
  const router = useRouter();

  const userName = user?.user_metadata?.full_name || 'There';

  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'daily' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setDate(1))); // Default to 1st of month
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showPickerFor, setShowPickerFor] = useState<'start' | 'end' | null>(null);

  const fetchData = async () => {
    setLoading(true);
    if (!session?.user?.id) return;

    try {
      let query = supabase
        .from('transactions')
        .select(`
          id, type, amount, description, transaction_date,
          categories(name)
        `)
        .eq('user_id', session.user.id)
        .order('transaction_date', { ascending: false });

      if (timeframe !== 'all') {
        const now = new Date();
        let startDate = new Date();

        if (timeframe === 'custom') {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          query = query.gte('transaction_date', start.toISOString()).lte('transaction_date', end.toISOString());
        } else {
          if (timeframe === 'daily') {
            startDate.setHours(0, 0, 0, 0);
          } else if (timeframe === 'monthly') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
          } else if (timeframe === 'yearly') {
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
          }
          query = query.gte('transaction_date', startDate.toISOString());
        }
      }

      const { data: txData, error: txError } = await query;
      if (txError) throw txError;

      setTransactions(txData || []);

      let inc = 0, exp = 0;
      txData?.forEach(t => {
        if (t.type === 'income') inc += Number(t.amount);
        else if (t.type === 'expense') exp += Number(t.amount);
      });
      setSummary({ income: inc, expense: exp, balance: inc - exp });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, timeframe, customStartDate, customEndDate]);

  const categoryExpenses: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const cat = t.categories?.name || 'Uncategorized';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + Number(t.amount);
    }
  });

  const categoryIncomes: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'income') {
      const cat = t.categories?.name || 'Uncategorized';
      categoryIncomes[cat] = (categoryIncomes[cat] || 0) + Number(t.amount);
    }
  });

  const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
  const incomeColors = ["#22c55e", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];

  const pieData = Object.keys(categoryExpenses).map((catName, idx) => ({
    name: catName,
    population: categoryExpenses[catName],
    color: colors[idx % colors.length],
    legendFontColor: "#9ca3af",
    legendFontSize: 12
  })).sort((a, b) => b.population - a.population);

  const incomePieData = Object.keys(categoryIncomes).map((catName, idx) => ({
    name: catName,
    population: categoryIncomes[catName],
    color: incomeColors[idx % incomeColors.length],
    legendFontColor: "#9ca3af",
    legendFontSize: 12
  })).sort((a, b) => b.population - a.population);

  const chartConfig = {
    backgroundGradientFrom: "#1f2937",
    backgroundGradientTo: "#1f2937",
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    useShadowColorFromDataset: false
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-900 p-4"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#fff" />}
    >
      <View className="flex-row justify-between items-center mb-6 mt-2">
        <Text className="text-2xl font-bold text-white">{t('dashboard.hi') || 'Hi'} {userName} 👋</Text>
      </View>

      {/* Timeframe Filter */}
      <View className="mb-6 mt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
          {['all', 'daily', 'monthly', 'yearly', 'custom'].map(tf => (
            <TouchableOpacity
              key={tf}
              onPress={() => setTimeframe(tf as any)}
              className={`px-4 py-2 mr-2 rounded-full border ${timeframe === tf ? 'bg-blue-600 border-blue-600' : 'bg-gray-800 border-gray-700'}`}
            >
              <Text className="text-white capitalize font-medium">{t(`dashboard.${tf}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {timeframe === 'custom' && (
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={() => setShowPickerFor('start')} className="flex-1 bg-gray-800 p-3 rounded-lg border border-gray-700 mr-2">
              <Text className="text-gray-400 text-xs mb-1">{t('dashboard.start_date')}</Text>
              <Text className="text-white font-medium">{customStartDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPickerFor('end')} className="flex-1 bg-gray-800 p-3 rounded-lg border border-gray-700 ml-2">
              <Text className="text-gray-400 text-xs mb-1">{t('dashboard.end_date')}</Text>
              <Text className="text-white font-medium">{customEndDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showPickerFor && (
          <DateTimePicker
            value={showPickerFor === 'start' ? customStartDate : customEndDate}
            mode="date"
            display="default"
            maximumDate={showPickerFor === 'start' ? customEndDate : new Date()}
            minimumDate={showPickerFor === 'end' ? customStartDate : undefined}
            onChange={(event, selectedDate) => {
              const currentPicker = showPickerFor;
              setShowPickerFor(Platform.OS === 'ios' ? currentPicker : null);
              if (selectedDate) {
                if (currentPicker === 'start') setCustomStartDate(selectedDate);
                else setCustomEndDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      {/* Summary Cards */}
      <View className="mb-6 space-y-4">
        {/* Balance Card */}
        <View className="bg-blue-600 rounded-2xl p-6 shadow-lg">
          <Text className="text-blue-100 text-lg font-medium">{t('dashboard.totalBalance')} ({t(`dashboard.${timeframe}`)})</Text>
          <Text className="text-4xl font-bold text-white mt-1">${summary.balance.toFixed(2)}</Text>
        </View>

        <View className="flex-row space-x-4 mt-4">
          <View className="flex-1 bg-gray-800 rounded-2xl p-5 border border-gray-700 mr-2">
            <Text className="text-gray-400 text-sm font-medium">{t('dashboard.income')}</Text>
            <Text className="text-2xl font-bold text-green-400 mt-1">${summary.income.toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-gray-800 rounded-2xl p-5 border border-gray-700 ml-2">
            <Text className="text-gray-400 text-sm font-medium">{t('dashboard.expense')}</Text>
            <Text className="text-2xl font-bold text-red-400 mt-1">${summary.expense.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-between mb-8 space-x-4">
        <TouchableOpacity
          className="flex-1 bg-green-500 rounded-xl py-3 items-center mr-2"
          onPress={() => router.push('/transaction/add')}
        >
          <Text className="text-white font-semibold">+ {t('dashboard.income')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-red-500 rounded-xl py-3 items-center ml-2"
          onPress={() => router.push('/transaction/add')}
        >
          <Text className="text-white font-semibold">- {t('dashboard.expense')}</Text>
        </TouchableOpacity>
      </View>

      {/* Expense Chart */}
      {pieData.length > 0 && (
        <View className="mb-8 bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <Text className="text-white text-lg font-bold mb-4">{t('dashboard.expense_breakdown')}</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 60}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"}
            absolute
          />
        </View>
      )}

      {/* Income Chart */}
      {incomePieData.length > 0 && (
        <View className="mb-8 bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <Text className="text-white text-lg font-bold mb-4">{t('dashboard.income_breakdown')}</Text>
          <PieChart
            data={incomePieData}
            width={screenWidth - 60}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"0"}
            absolute
          />
        </View>
      )}

      {/* Transactions List */}
      <View className="mb-20">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-white">{t('dashboard.transactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions' as any)}>
            <Text className="text-blue-400">{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {transactions.length === 0 ? (
          <Text className="text-gray-400 italic">{t('dashboard.no_transactions')}</Text>
        ) : (
          transactions.slice(0, 5).map(t => (
            <View key={t.id} className="bg-gray-800 rounded-xl p-4 flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-white font-semibold text-lg">{t.description || (t.type === 'income' ? 'Income' : 'Expense')}</Text>
                <Text className="text-gray-400">{t.categories?.name || 'Uncategorized'} • {t.transaction_date}</Text>
              </View>
              <Text className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}${Number(t.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
