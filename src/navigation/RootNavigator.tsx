import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import SetupGuideScreen from '../screens/SetupGuideScreen';
import { RoomId } from '../store/useHomeStore';

export type RootStackParamList = {
  BottomTabs: undefined;
  RoomDetail: { roomId: RoomId };
  SetupGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BottomTabs" component={BottomTabs} />
        <Stack.Screen
          name="RoomDetail"
          component={RoomDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="SetupGuide"
          component={SetupGuideScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
