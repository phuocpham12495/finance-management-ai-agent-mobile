import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '@/src/store/AuthContext';
import { supabase } from '@/src/services/supabase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function ProfileScreen() {
    const { session, user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [dob, setDob] = useState('');
    const [notifications, setNotifications] = useState(false);

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
                    notifications_enabled: notifications
                }
            });

            if (error) throw error;
            Alert.alert("Success", "Profile updated successfully!");
        } catch (e: any) {
            Alert.alert("Error", e.message);
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
                    <Text className="text-blue-400 font-medium">Change Photo</Text>
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white mb-1">{name || 'Your Name'}</Text>
                <Text className="text-gray-400">{user?.email}</Text>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 space-y-4">
                <Text className="text-lg font-bold text-white mb-2">Personal Information</Text>

                {/* Removed Avatar URL manual input field */}

                <View className="mt-4">
                    <Text className="text-gray-400 mb-1 font-medium">Full Name</Text>
                    <TextInput
                        className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-700"
                        placeholder="John Doe"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View className="mt-4">
                    <Text className="text-gray-400 mb-1 font-medium">Date of Birth</Text>
                    <TouchableOpacity
                        className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-700"
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text className={dob ? "text-white" : "text-[#9ca3af]"}>
                            {dob || "YYYY-MM-DD"}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateValue}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()} // Can't pick future birthdates
                        />
                    )}
                </View>
            </View>

            <View className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-bold text-white">Reminder Notifications</Text>
                    <Text className="text-sm text-gray-400 mt-1">Receive alerts for your budget</Text>
                </View>
                <Switch
                    value={notifications}
                    onValueChange={setNotifications}
                    trackColor={{ false: '#374151', true: '#3b82f6' }}
                />
            </View>

            <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className="bg-blue-600 w-full py-4 rounded-xl items-center mb-4"
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500/20 border border-red-500 w-full py-4 rounded-xl items-center mb-10"
            >
                <Text className="text-red-500 font-bold text-lg">Logout</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}
