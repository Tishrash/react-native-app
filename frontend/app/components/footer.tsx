import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import Animated, { useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated";

const Footer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get current page
  const scaleValue = useSharedValue(1);

  const handleNavigation = (screen: string, path: string) => {
    scaleValue.value = 1.2; // Scale effect on tap
    scaleValue.value = withTiming(1, { duration: 200 });
    router.push(path);
  };

  const tabs = [
    { name: "Tishan", icon: "chatbubbles", path: "/feedback/Home" },
    { name: "Tanishka", icon: "speedometer", path: "/tire_quality_assesment/page1" },
    { name: "Akila", icon: "construct", path: "/damage_detection/page1" },
    { name: "Yasith", icon: "search", path: "/market_identification/page1" },
  ];

  return (
    <View style={styles.footer}>
      {tabs.map((item, index) => {
        const isActive = pathname === item.path;
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scale: isActive ? scaleValue.value : 1 }],
        }));

        return (
          <TouchableOpacity key={index} onPress={() => handleNavigation(item.name, item.path)} style={styles.footerButton}>
            <Animated.View style={animatedStyle}>
              <Ionicons
                name={item.icon as any}
                size={28}
                color={isActive ? "#007bff" : "gray"} // Highlight active tab
              />
            </Animated.View>
            <Text style={[styles.footerText, isActive && { color: "#007bff" }]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
  },
  footerButton: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },
});

export default Footer;