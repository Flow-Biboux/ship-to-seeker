// Polyfills
import "./src/polyfills";

import { StyleSheet } from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { ProgressProvider } from "./src/xp/ProgressContext";
import { BG, seekerTheme } from "./src/theme";

const queryClient = new QueryClient();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ClusterProvider>
          <ConnectionProvider config={{ commitment: "processed" }}>
            <SafeAreaView edges={["top", "left", "right"]} style={styles.shell}>
              <PaperProvider theme={seekerTheme}>
                <ProgressProvider>
                  <AppNavigator />
                </ProgressProvider>
              </PaperProvider>
            </SafeAreaView>
          </ConnectionProvider>
        </ClusterProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: BG,
  },
});
