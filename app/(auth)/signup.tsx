import { supabase } from '@/src/services/supabase';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignupScreen() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert(t('common.error'), t('auth.passwordsNotMatch'));
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert(t('auth.signupFailed'), error.message);
        } else {
            Alert.alert(t('common.success'), t('auth.signupSuccess'));
            router.replace('/(auth)/login');
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 justify-center bg-gray-900 p-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-white">{t('auth.createAccount')}</Text>
                <Text className="text-gray-400 mt-2">{t('auth.signupSubtitle')}</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700"
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    className="w-full bg-blue-600 rounded-xl py-4 items-center mt-6"
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-semibold text-lg">{t('auth.signUp')}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-gray-400">{t('auth.haveAccount')} </Text>
                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                        <Text className="text-blue-500 font-semibold">{t('auth.signIn')}</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
