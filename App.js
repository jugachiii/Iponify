import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

export default function App() {
  const [amount, setAmount] = useState("");
  const [funds, setFunds] = useState({ gym: 0, weekly: 0, protein: 0 });
  const [lastSavedDate, setLastSavedDate] = useState(null);
  const screenWidth = Dimensions.get("window").width;

  // Load saved funds when app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedFunds = await AsyncStorage.getItem("funds");
        const savedDate = await AsyncStorage.getItem("lastSavedDate");

        if (savedFunds) setFunds(JSON.parse(savedFunds));
        if (savedDate) setLastSavedDate(savedDate);
      } catch (error) {
        console.log("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  // Save funds + date
  const saveData = async (newFunds, today) => {
    try {
      await AsyncStorage.setItem("funds", JSON.stringify(newFunds));
      await AsyncStorage.setItem("lastSavedDate", today);
    } catch (error) {
      console.log("Error saving data:", error);
    }
  };

  const handleSave = () => {
    const today = new Date().toDateString();

    if (lastSavedDate === today) {
      Alert.alert("Oops!", "You can only save once today.");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number.");
      return;
    }

    let newFunds = {
      gym: funds.gym + (num * 45) / 110,
      weekly: funds.weekly + (num * 25) / 110,
      protein: funds.protein + (num * 40) / 110,
    };

    if (newFunds.weekly >= 100) {
      Alert.alert("Weekly Goal Reached!", "Weekly fund has been reset to ₱0.");
      newFunds.weekly = 0;
    }

    setFunds(newFunds);
    setLastSavedDate(today);
    saveData(newFunds, today);
    setAmount("");
    Alert.alert("Saved!", "Your savings have been updated.");
  };

  const data = [
    {
      name: "Gym",
      population: funds.gym,
      color: "blue",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      name: "Weekly",
      population: funds.weekly,
      color: "green",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
    {
      name: "Protein",
      population: funds.protein,
      color: "orange",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Replace text with logo */}
      <Image source={require("./assets/Iponify.png")} style={styles.logo} />

      <TextInput
        style={styles.input}
        placeholder="Enter amount saved"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Button
        title="Save"
        onPress={handleSave}
        disabled={lastSavedDate === new Date().toDateString()}
      />

      <Text style={styles.info}>
        Gym: ₱{funds.gym.toFixed(2)} | Weekly: ₱{funds.weekly.toFixed(2)} | Protein: ₱
        {funds.protein.toFixed(2)}
      </Text>

      <PieChart
        data={data}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  logo: {
    width: 280,
    height: 280,
    resizeMode: "contain",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    width: "80%",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    marginVertical: 15,
    fontSize: 16,
    fontWeight: "600",
  },
});
