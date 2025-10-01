// Temporary script to clear authentication data
// Run this in your React Native debugger console or add it to your app temporarily

import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAuthData = async () => {
  try {
    console.log('Clearing all authentication data...');
    await AsyncStorage.multiRemove(['user', 'users']);
    console.log('Authentication data cleared successfully!');
    console.log('You should now be logged out and see the login screen.');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Call the function
clearAuthData();

export default clearAuthData;
