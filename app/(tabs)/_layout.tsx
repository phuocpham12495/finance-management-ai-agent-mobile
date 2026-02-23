import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6', // blue-500
        tabBarStyle: {
          backgroundColor: '#1f2937', // gray-800
          borderTopColor: '#374151', // gray-700
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#111827', // gray-900
        },
        headerTintColor: '#fff',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              size={size}
              color={focused ? "#3b82f6" : "#9ca3af"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.transactions'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={size}
              color={focused ? "#10b981" : "#9ca3af"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: t('tabs.budgets'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={focused ? "#f59e0b" : "#9ca3af"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: t('tabs.ai_agent'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={focused ? "#8b5cf6" : "#9ca3af"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={focused ? "#ef4444" : "#9ca3af"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
