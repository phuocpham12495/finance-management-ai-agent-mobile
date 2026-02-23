import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/store/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { t, i18n } = useTranslation();
    const { session, user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [dob, setDob] = useState('');
    const [notifications, setNotifications] = useState(false);
    const [aiVoice, setAiVoice] = useState(false);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());

    useEffect(() => {
        if (user) {
            const metadata = user.user_metadata || {};
            setName(metadata.full_name || '');
            setAvatarUrl(metadata.avatar_url || '');

            if (metadata.dob) {
                setDob(metadata.dob);
                // Try to parse the saved string into a Date object for the picker
                const parsedDate = new Date(metadata.dob);
                if (!isNaN(parsedDate.getTime())) {
                    setDateValue(parsedDate);
                }
            }

            setNotifications(metadata.notifications_enabled === true);
            setAiVoice(metadata.ai_voice_enabled === true);
        }
    }, [user]);

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || dateValue;
        setShowDatePicker(Platform.OS === 'ios'); // Keep picker open on iOS until user closes it
        setDateValue(currentDate);

        // Format to YYYY-MM-DD
        if (selectedDate) {
            const formattedDate = currentDate.toISOString().split('T')[0];
            setDob(formattedDate);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setAvatarUrl(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: name,
                    avatar_url: avatarUrl,
                    dob: dob,
                    notifications_enabled: notifications,
                    ai_voice_enabled: aiVoice
                }
            });

            if (error) throw error;
            Alert.alert(t('common.success') || "Success", t('settings.profile_updated') || "Profile updated successfully!");
        } catch (e: any) {
            Alert.alert(t('common.error') || "Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
    };

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <View className="items-center mt-6 mb-8">
                <TouchableOpacity onPress={pickImage}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full mb-2 border-2 border-blue-500" />
                    ) : (
                        <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center mb-2 border-2 border-gray-600">
                            <Text className="text-4xl text-gray-400">👤</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} className="mb-4">
                    <Text className="text-blue-400 font-medium">{t('settings.change_photo') || 'Change Photo'}</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white mb-1">{name || t('settings.your_name') || 'Your Name'}</Text>
                <Text className="text-gray-400">{user?.email}</Text>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 space-y-4">
                <Text className="text-lg font-bold text-white mb-2">{t('settings.personal_info') || 'Personal Information'}</Text>

                <View className="mt-4">
                    <Text className="text-gray-400 mb-1 font-medium">{t('settings.full_name') || 'Full Name'}</Text>
                    <TextInput
                        className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700"
                        placeholder="John Doe"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View className="mt-4">
                    <Text className="text-gray-400 mb-1 font-medium">{t('settings.dob') || 'Date of Birth'}</Text>
                    <TouchableOpacity
                        className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-700"
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text className={dob ? "text-white" : "text-[#9ca3af]"}>
                            {dob || "YYYY-MM-DD"}
                        </Text>
                    </TouchableOpacity>
                    {/* ... picker code ... */}
                </View>
            </View>

            {/* Language Settings */}
            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6">
                <Text className="text-lg font-bold text-white mb-4">{t('settings.language')}</Text>
                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => i18n.changeLanguage('en')}
                        className={`flex-1 py-3 items-center rounded-xl mr-2 ${i18n.language === 'en' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <Text className="text-white font-bold">{t('settings.english')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => i18n.changeLanguage('vi')}
                        className={`flex-1 py-3 items-center rounded-xl ml-2 ${i18n.language === 'vi' ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <Text className="text-white font-bold">{t('settings.vietnamese')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-bold text-white">{t('settings.notifications') || 'Reminder Notifications'}</Text>
                    <Text className="text-sm text-gray-400 mt-1">{t('settings.notifications_sub') || 'Receive alerts for your budget'}</Text>
                </View>
                <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#374151', true: '#3b82f6' }}
                />
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-bold text-white">{t('settings.ai_voice') || 'AI Voice Response'}</Text>
                    <Text className="text-sm text-gray-400 mt-1">{t('settings.ai_voice_sub') || 'Hear the AI agent talk back to you'}</Text>
                </View>
                <Switch
                    value={aiVoice}
                    onValueChange={setAiVoice}
                    trackColor={{ false: '#374151', true: '#3b82f6' }}
                />
            </View>

            <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className="bg-blue-600 w-full py-4 rounded-xl items-center mb-4"
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">{t('settings.save') || 'Save Changes'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500/20 border border-red-500 w-full py-4 rounded-xl items-center mb-10"
            >
                <Text className="text-red-500 font-bold text-lg">{t('settings.logout')}</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}
