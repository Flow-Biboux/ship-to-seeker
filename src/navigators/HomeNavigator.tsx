import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { BuildPathScreen } from "../screens/BuildPathScreen";
import { DiagnosticsScreen } from "../screens/DiagnosticsScreen";
import { ExplainerScreen } from "../screens/ExplainerScreen";

const Tab = createBottomTabNavigator();

type TabName = "Diagnostics" | "Build Path" | "Explainer";

const TAB_ICONS: Record<TabName, React.ComponentProps<typeof Feather>["name"]> = {
  Diagnostics: "activity",
  "Build Path": "list",
  Explainer: "message-circle",
};

export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Feather
            name={TAB_ICONS[route.name as TabName]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Diagnostics" component={DiagnosticsScreen} />
      <Tab.Screen name="Build Path" component={BuildPathScreen} />
      <Tab.Screen name="Explainer" component={ExplainerScreen} />
    </Tab.Navigator>
  );
}
