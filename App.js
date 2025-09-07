import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Vibration,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import Svg, { G, Path } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Custom Priority Selector
const PrioritySelector = ({ value, onChange }) => {
  const options = ["High", "Medium", "Low"];
  return (
    <View style={styles.priorityContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[
            styles.priorityOption,
            { backgroundColor: value === opt ? styles.priorityColors[opt] : "#2a2a2a" },
          ]}
          onPress={() => onChange(opt)}
        >
          <Text style={{ color: value === opt ? "#fff" : "#aaa", fontWeight: "600" }}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function App() {
  const [amount, setAmount] = useState("");
  const [goals, setGoals] = useState([]);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPriority, setGoalPriority] = useState("Medium");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingAmount, setEditingAmount] = useState("");
  const screenWidth = 360;
  const radius = 100;

  useEffect(() => {
    const loadData = async () => {
      const savedGoals = await AsyncStorage.getItem("goals");
      if (savedGoals) setGoals(JSON.parse(savedGoals));
    };
    loadData();
  }, []);

  const saveData = async (newGoals) => {
    await AsyncStorage.setItem("goals", JSON.stringify(newGoals));
  };

  const addGoal = () => {
    if (!goalName.trim() || !goalTarget.trim()) {
      Alert.alert("Invalid", "Goal name and target cannot be empty");
      return;
    }
    const targetNum = parseInt(goalTarget);
    if (isNaN(targetNum) || targetNum <= 0) {
      Alert.alert("Invalid", "Enter a valid number for target.");
      return;
    }

    const newGoal = {
      id: Date.now().toString(),
      name: goalName,
      amount: 0,
      target: targetNum,
      priority: goalPriority
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    setGoalName("");
    setGoalTarget("");
    setGoalPriority("Medium");
    saveData(newGoals);
  };

  const deleteGoal = (id) => {
    Alert.alert("Delete Goal", "Are you sure?", [
      { text: "Cancel" },
      { text: "Yes", onPress: () => {
        const newGoals = goals.filter((g) => g.id !== id);
        setGoals(newGoals);
        saveData(newGoals);
      }}
    ]);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setEditingAmount(goal.amount.toString());
    setModalVisible(true);
  };

  const saveEditAmount = () => {
  const num = parseInt(editingAmount);
  if (isNaN(num) || num < 0) {
    Alert.alert("Invalid", "Enter a valid number");
    return;
  }

  const totalSavings = goals.reduce((sum, g) => sum + g.amount, 0);
  const diff = num - editingGoal.amount; // how much we added or subtracted
  const otherGoals = goals.filter(g => g.id !== editingGoal.id);

  const priorityMap = { High: 3, Medium: 2, Low: 1 };
  const totalPriority = otherGoals.reduce((sum, g) => sum + priorityMap[g.priority], 0);

  let remaining = totalSavings - num; // total money left to distribute among other goals

  const redistributedGoals = otherGoals.map(g => {
    const alloc = totalPriority > 0 ? Math.floor(remaining * priorityMap[g.priority] / totalPriority) : 0;
    remaining -= alloc;
    return { ...g, amount: alloc };
  });

  // If any leftover pennies, give to highest priority goal
  if (remaining > 0 && redistributedGoals.length > 0) {
    const highPriorityGoals = redistributedGoals.filter(g => g.priority === "High");
    const targetGoal = highPriorityGoals[0] || redistributedGoals[0];
    targetGoal.amount += remaining;
  }

  const finalGoals = [
    { ...editingGoal, amount: num },
    ...redistributedGoals
  ];

  setGoals(finalGoals);
  saveData(finalGoals);
  setModalVisible(false);
  setEditingGoal(null);
  setEditingAmount("");
};



  const handleSave = () => {
    let num = parseInt(amount);
    if (isNaN(num) || num <= 0) { Alert.alert("Invalid Input", "Enter a valid number."); return; }
    if (goals.length === 0) { Alert.alert("No Goals", "Add a goal first!"); return; }

    const priorityMap = { "High": 3, "Medium": 2, "Low": 1 };
    const totalPriority = goals.reduce((sum, g) => sum + priorityMap[g.priority], 0);

    let remaining = num;
    const newGoals = goals.map((g, i) => {
      let alloc = Math.floor(num * priorityMap[g.priority] / totalPriority);
      if (alloc > remaining) alloc = remaining;
      remaining -= alloc;
      return { ...g, amount: g.amount + alloc };
    });

    // Add leftover to top-priority goal
    if (remaining > 0) {
      const topGoalIndex = goals.findIndex(g => g.priority === "High") || 0;
      newGoals[topGoalIndex].amount += remaining;
    }

    setGoals(newGoals);
    saveData(newGoals);
    setAmount("");
    Vibration.vibrate(100);
  };

  const total = goals.reduce((sum, g) => sum + g.amount, 0);

  // Pie chart paths
  let startAngle = 0;
  const highColors = ["#ff4d4d", "#ff6666", "#ff8080", "#ff9999"];
  const arcs = goals.map((g, i) => {
    const angle = (g.amount / total) * 2 * Math.PI || 0;
    const endAngle = startAngle + angle;
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const path = `M${radius},${radius} L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    startAngle += angle;

    const color = g.priority === "High"
      ? highColors[i % highColors.length]
      : g.priority === "Medium"
      ? "#ffdd57"
      : "#aaa";

    return { path, color };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Image source={require("./assets/Iponify.png")} style={styles.logo} />
        <Text style={styles.totalText}>Total Savings: ₱{total}</Text>

        <View style={styles.saveContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter amount to save"
            keyboardType="numeric"
            placeholderTextColor="#888"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Add a New Goal</Text>
        <View style={styles.addGoalContainer}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Goal name"
            placeholderTextColor="#888"
            value={goalName}
            onChangeText={setGoalName}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 5 }]}
            placeholder="Target ₱"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={goalTarget}
            onChangeText={setGoalTarget}
          />
          <PrioritySelector value={goalPriority} onChange={setGoalPriority} />
          <TouchableOpacity style={styles.addButton} onPress={addGoal}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {goals.length > 0 && (
          <>
            <Text style={styles.subtitle}>Goals Breakdown</Text>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Svg width={radius * 2} height={radius * 2}>
                <G>
                  {arcs.map((a, i) => <Path key={i} d={a.path} fill={a.color} />)}
                </G>
              </Svg>
            </View>

            {goals.map((g, index) => {
              let borderColor = g.priority === "High" ? highColors[index % highColors.length]
                               : g.priority === "Medium" ? "#ffdd57"
                               : "#aaa";

              return (
                <View key={g.id} style={[styles.goalContainer, { borderColor, borderWidth: 2 }]}>
                  <Text style={styles.goalText}>{g.name} ({g.priority}): ₱{g.amount} / ₱{g.target}</Text>
                  <Progress.Bar
                    progress={g.amount / g.target}
                    width={screenWidth - 40}
                    color={borderColor}
                  />
                  <View style={styles.goalButtons}>
                    <TouchableOpacity style={[styles.goalBtn, { backgroundColor: "#ffcc00" }]} onPress={() => openEditModal(g)}>
                      <Text>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.goalBtn, { backgroundColor: "#ff4d4d" }]} onPress={() => deleteGoal(g.id)}>
                      <Text style={{ color: "#fff" }}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.goalBtn, { backgroundColor: "#00bfff" }]} onPress={() => {
                      const newGoals = goals.map(goal => goal.id === g.id ? { ...goal, amount: 0 } : goal);
                      setGoals(newGoals); saveData(newGoals);
                    }}>
                      <Text style={{ color: "#fff" }}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Amount</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editingAmount}
                onChangeText={setEditingAmount}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
                <TouchableOpacity style={[styles.addButton, { flex: 1, marginRight: 5 }]} onPress={saveEditAmount}>
                  <Text style={styles.addButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addButton, { flex: 1, marginLeft: 5, backgroundColor: "#ff4d4d" }]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.addButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1c1c1c", padding: 10 },
  logo: { width: 180, height: 180, resizeMode: "contain", alignSelf: "center", marginBottom: 10 },
  totalText: { fontSize: 24, fontWeight: "bold", color: "#00ffcc", textAlign: "center", marginBottom: 15 },
  subtitle: { fontSize: 18, fontWeight: "600", color: "#fff", marginVertical: 10 },
  input: { borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 10, color: "#fff", marginBottom: 10, textAlign: "center", backgroundColor: "#2a2a2a" },
  saveContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  saveButton: { backgroundColor: "#00ff99", marginLeft: 10, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  saveButtonText: { fontWeight: "bold", fontSize: 16 },
  addGoalContainer: { marginBottom: 20 },
  addButton: { backgroundColor: "#00ff99", padding: 10, borderRadius: 12, marginTop: 5, alignItems: "center" },
  addButtonText: { fontWeight: "bold", fontSize: 16, color: "#000" },
  goalContainer: { marginBottom: 15, padding: 15, borderRadius: 16, backgroundColor: "#2a2a2a", shadowColor: "#000", shadowOpacity: 0.4, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
  goalText: { fontSize: 16, fontWeight: "600", color: "#fff", marginBottom: 8 },
  goalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  goalBtn: { padding: 8, borderRadius: 8, minWidth: 60, alignItems: "center" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  modalContainer: { width: "80%", backgroundColor: "#2a2a2a", padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 10, textAlign: "center" },
  modalInput: { borderWidth: 1, borderColor: "#555", borderRadius: 12, padding: 10, color: "#fff", textAlign: "center", backgroundColor: "#1e1e1e" },
  priorityContainer: { flexDirection: "row", justifyContent: "space-around", flex: 1, marginTop: 5 },
  priorityOption: { flex: 1, marginHorizontal: 2, padding: 8, borderRadius: 10, alignItems: "center" },
  priorityColors: { High: "#ff4d4d", Medium: "#ffdd57", Low: "#aaa" },
});
