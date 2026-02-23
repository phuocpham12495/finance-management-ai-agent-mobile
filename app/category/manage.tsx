import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CategoryManageScreen() {
    const { session } = useAuth();
    const { t } = useTranslation();

    const [categories, setCategories] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const fetchCategories = async () => {
        if (session?.user?.id) {
            const { data } = await supabase.from('categories').select('*').eq('user_id', session.user.id);
            setCategories(data || []);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [session]);

    const handleAdd = async () => {
        if (!name.trim()) return;

        const isDuplicate = categories.some(cat => cat.name.toLowerCase() === name.trim().toLowerCase() && cat.type === type);
        if (isDuplicate) {
            Alert.alert(t('common.error'), t('categories_screen.error_exists', { name: name.trim(), type: t(`common.${type}`) }));
            return;
        }

        setLoading(true);
        const { error } = await supabase.from('categories').insert({
            user_id: session?.user?.id,
            name,
            type,
        });

        if (error) {
            Alert.alert(t('common.error'), error.message);
        } else {
            setName('');
            fetchCategories();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) {
            fetchCategories();
        }
    };

    const handleEdit = (cat: any) => {
        setEditingId(cat.id);
        setEditName(cat.name);
    };

    const handleUpdate = async (cat: any) => {
        if (!editName.trim()) { setEditingId(null); return; }

        const isDuplicate = categories.some(c => c.name.toLowerCase() === editName.trim().toLowerCase() && c.type === cat.type && c.id !== cat.id);
        if (isDuplicate) {
            Alert.alert(t('common.error'), t('categories_screen.error_exists_simple', { name: editName.trim(), type: t(`common.${cat.type}`) }));
            return;
        }

        const { error } = await supabase.from('categories').update({ name: editName.trim() }).eq('id', cat.id);
        if (!error) {
            fetchCategories();
        }
        setEditingId(null);
    };

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <Stack.Screen options={{ title: t('categories_screen.manage_title') }} />

            <View className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700">
                <Text className="text-white mb-3 font-semibold text-lg">{t('categories_screen.add_new')}</Text>
                <TextInput
                    className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 border border-gray-700 mb-3"
                    placeholder={t('categories_screen.name_placeholder')}
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                />
                <View className="flex-row space-x-2 mb-4">
                    <TouchableOpacity
                        onPress={() => setType('expense')}
                        className={`flex-1 py-2 items-center rounded-lg border ${type === 'expense' ? 'bg-red-500/20 border-red-500' : 'border-gray-600 bg-gray-900'}`}
                    >
                        <Text className={`${type === 'expense' ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{t('dashboard.expense')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setType('income')}
                        className={`flex-1 py-2 items-center rounded-lg border ml-2 ${type === 'income' ? 'bg-green-500/20 border-green-500' : 'border-gray-600 bg-gray-900'}`}
                    >
                        <Text className={`${type === 'income' ? 'text-green-400 font-bold' : 'text-gray-400'}`}>{t('dashboard.income')}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    onPress={handleAdd}
                    disabled={loading}
                    className="bg-blue-600 py-3 rounded-lg items-center"
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">{t('categories_screen.add_button')}</Text>}
                </TouchableOpacity>
            </View>

            <Text className="text-xl font-bold text-white mb-4">{t('categories_screen.existing_title')}</Text>
            {categories.map(cat => (
                <View key={cat.id} className="flex-row justify-between items-center bg-gray-800 p-4 rounded-xl mb-2 border border-gray-700">
                    {editingId === cat.id ? (
                        <View className="flex-1 mr-4">
                            <TextInput
                                className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 border border-blue-500"
                                value={editName}
                                onChangeText={setEditName}
                                autoFocus
                            />
                            <View className="flex-row mt-2">
                                <TouchableOpacity onPress={() => handleUpdate(cat)} className="mr-4">
                                    <Text className="text-blue-400 font-bold">{t('common.save')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingId(null)}>
                                    <Text className="text-gray-400 font-bold">{t('common.cancel')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View>
                                <Text className="text-white font-semibold text-lg">{cat.name}</Text>
                                <Text className={cat.type === 'income' ? 'text-green-500 text-sm' : 'text-red-500 text-sm'}>
                                    {(cat.type === 'income' ? t('dashboard.income') : t('dashboard.expense')).toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-row">
                                <TouchableOpacity onPress={() => handleEdit(cat)} className="mr-4">
                                    <Text className="text-blue-400 font-bold">{t('common.edit')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(cat.id)}>
                                    <Text className="text-red-500 font-bold">{t('common.delete')}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}
