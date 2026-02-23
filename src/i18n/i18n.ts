import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

const RESOURCES = {
    en: { translation: en },
    vi: { translation: vi },
};

const LANGUAGE_KEY = 'user-language';

const languageDetectorPlugin = {
    type: 'languageDetector' as const,
    async: true,
    init: () => { },
    detect: async function (callback: (lang: string) => void) {
        try {
            // get stored language from Async storage
            const savedDataJSON = await AsyncStorage.getItem(LANGUAGE_KEY);
            const lng = savedDataJSON ? savedDataJSON : null;
            if (lng) {
                callback(lng);
                return;
            }

            // if no language is saved, use device language
            // Using Locales object for newer expo-localization, fallback to first locale
            const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
            callback(deviceLang);
        } catch (error) {
            console.log('Error reading language', error);
            callback('en');
        }
    },
    cacheUserLanguage: async function (lng: string) {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lng);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n
    .use(initReactI18next)
    .use(languageDetectorPlugin)
    .init({
        resources: RESOURCES,
        compatibilityJSON: 'v4',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false, // Disable suspense for React Native
        },
    });

export default i18n;
