import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/src/services/supabase';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert('Signup Failed', error.message);
        } else {
            Alert.alert('Success', 'Account created successfully! Please check your email for verification.');
            router.replace('/(auth)/login');
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 justify-center bg-gray-900 p-6">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-white">Create Account</Text>
                <Text className="text-gray-400 mt-2">Join us to manage your finance</Text>
            </View>

            <View className="space-y-4">
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700"
                    placeholder="Email address"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    className="w-full bg-gray-800 text-white rounded-xl px-4 py-4 border border-gray-700 mt-4"
                    placeholder="Confirm Password"
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
                        <Text className="text-white font-semibold text-lg">Sign Up</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
                <Text className="text-gray-400">Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                        <Text className="text-blue-500 font-semibold">Sign In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}
