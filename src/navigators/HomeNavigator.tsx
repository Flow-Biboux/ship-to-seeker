import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import Feather from "@expo/vector-icons/Feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BuildPathScreen } from "../screens/BuildPathScreen";
import { DiagnosticsScreen } from "../screens/DiagnosticsScreen";
import { ExplainerScreen } from "../screens/ExplainerScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

/** Seeker gesture/nav bars sometimes report a 0 bottom inset and cover the labels. */
const MIN_TAB_BAR_BOTTOM_INSET = 24;

type TabName = "Diagnostics" | "Build Path" | "Explainer" | "Profile";

const TAB_ICONS: Record<TabName, React.ComponentProps<typeof Feather>["name"]> =
  {
    Diagnostics: "activity",
    "Build Path": "list",
    Explainer: "message-circle",
    Profile: "user",
  };

export function HomeNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, MIN_TAB_BAR_BOTTOM_INSET);

  return (
    <Tab.Navigator
      safeAreaInsets={{
        top: 0,
        right: insets.right,
        bottom: bottomInset,
        left: insets.left,
      }}
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
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
