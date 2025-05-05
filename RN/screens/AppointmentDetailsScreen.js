// screens/AppointmentDetailsScreen.js

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Text, ActivityIndicator, Appbar, List, useTheme, Button, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import auth from '../services/firebase';

const AppointmentDetailsScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Determine if we're in dark mode
  const isDarkMode = theme.dark;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        fetchAppointments(user.email);
      } else {
        navigation.navigate('Login');
      }
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAppointments = (email) => {
    // Update with your actual server IP or domain
    fetch(`http://192.168.215.143:5000/getAppointments?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        setAppointments({
          upcoming: data.upcoming,
          past: data.past
        });
      })
      .catch((error) => {
        console.error("Error fetching appointments:", error);
        setSnackbarMsg("Failed to load appointments. Please try again.");
        setSnackbarVisible(true);
      })
      .finally(() => setLoading(false));
  };

  const confirmCancellation = (appointment_id, doctorName) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${doctorName}?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => cancelAppointment(appointment_id) }
      ]
    );
  };

  const cancelAppointment = (appointment_id) => {
    setLoading(true);
    // Update with your actual server IP or domain
    fetch(`http://192.168.215.143:5000/cancelAppointment?appointment_id=${appointment_id}`, {
      method: 'DELETE'
    })
      .then((res) => res.json())
      .then((data) => {
        // Remove the canceled appointment from the list
        setAppointments(prev => ({
          ...prev,
          upcoming: prev.upcoming.filter(app => app.appointment_id !== appointment_id)
        }));
        // Display the snackbar message with cancellation details
        setSnackbarMsg(data.message);
        setSnackbarVisible(true);
      })
      .catch((error) => {
        console.error("Error cancelling appointment:", error);
        setSnackbarMsg("Failed to cancel appointment. Please try again.");
        setSnackbarVisible(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction color={theme.colors.onPrimary} onPress={() => navigation.goBack()} />
        <Appbar.Content title="My Appointments" titleStyle={{ color: theme.colors.onPrimary }} />
      </Appbar.Header>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={theme.colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upcoming Appointments</Text>
          {appointments.upcoming.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No upcoming appointments.</Text>
          ) : (
            appointments.upcoming.map((item) => (
              <View 
                key={item.appointment_id} 
                style={[
                  styles.appointmentCard, 
                  { 
                    backgroundColor: isDarkMode ? theme.colors.surface : '#f5f5f5',
                    borderColor: theme.colors.outline,
                  }
                ]}
              >
                <View style={styles.appointmentInfo}>
                  <List.Item
                    title={`Dr. ${item.doctor.first_name} ${item.doctor.last_name}`}
                    description={`${item.date} at ${item.time} - ${item.doctor.clinic_name}`}
                    left={props => <List.Icon {...props} icon="calendar" color={theme.colors.primary} />}
                    titleStyle={{ color: theme.colors.text, fontWeight: 'bold' }}
                    descriptionStyle={{ color: theme.colors.text }}
                    descriptionNumberOfLines={2}
                  />
                </View>
                <Button
                  mode="contained"
                  onPress={() => confirmCancellation(
                    item.appointment_id, 
                    `Dr. ${item.doctor.first_name} ${item.doctor.last_name}`
                  )}
                  style={styles.cancelButton}
                  labelStyle={{ color: 'white' }}
                  color={theme.colors.error}
                >
                  Cancel
                </Button>
              </View>
            ))
          )}
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Past Appointments</Text>
          {appointments.past.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>No past appointments.</Text>
          ) : (
            appointments.past.map((item) => (
              <View 
                key={item.appointment_id}
                style={[
                  styles.pastAppointment,
                  {
                    backgroundColor: isDarkMode ? theme.colors.surfaceVariant : '#f9f9f9',
                    borderColor: theme.colors.outline,
                  }
                ]}
              >
                <List.Item
                  title={`Dr. ${item.doctor.first_name} ${item.doctor.last_name}`}
                  description={`${item.date} at ${item.time} - ${item.doctor.clinic_name}`}
                  left={props => <List.Icon {...props} icon="calendar-check" color={theme.colors.primary} />}
                  titleStyle={{ color: theme.colors.text, fontWeight: 'bold' }}
                  descriptionStyle={{ color: theme.colors.text }}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: theme.colors.surface }]}
        theme={{ colors: { surface: theme.colors.surface, onSurface: theme.colors.onSurface } }}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
          color: theme.colors.primary,
        }}
      >
        <Text style={{ color: theme.colors.onSurface }}>{snackbarMsg}</Text>
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loader: { 
    marginTop: 50 
  },
  content: { 
    padding: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 12 
  },
  emptyText: { 
    fontSize: 16, 
    marginBottom: 12 
  },
  appointmentCard: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
  },
  appointmentInfo: {
    flex: 1,
  },
  cancelButton: {
    alignSelf: 'center',
    marginRight: 10,
  },
  pastAppointment: {
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  snackbar: {
    bottom: 10,
    borderRadius: 8,
  },
});

export default AppointmentDetailsScreen;