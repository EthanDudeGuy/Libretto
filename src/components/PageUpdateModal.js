import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import theme from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CombinedGreetingModal({ 
  visible, 
  onClose, 
  currentPage, 
  totalPages, 
  onUpdatePage,
  bookTitle,
  greetingText 
}) {
  const [inputPage, setInputPage] = useState(currentPage.toString());
  const [isValid, setIsValid] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Animation values
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setInputPage(currentPage.toString());
      setIsValid(true);
      setIsUpdating(false);
      
      // Reset animation values
      modalOpacity.setValue(0);
      modalScale.setValue(0.8);
      slideUpAnim.setValue(50);
      inputFocusAnim.setValue(0);
      successAnim.setValue(0);
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, currentPage]);

  const validatePageNumber = (pageStr) => {
    const page = parseInt(pageStr);
    return !isNaN(page) && page >= 1 && page <= totalPages;
  };

  const handleInputChange = (text) => {
    setInputPage(text);
    setIsValid(validatePageNumber(text));
  };

  const handleUpdate = async () => {
    const newPage = parseInt(inputPage);
    
    if (!isValid || newPage === currentPage) {
      onClose();
      return;
    }

    setIsUpdating(true);
    
    // Success animation
    Animated.spring(successAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: false,
    }).start();

    // Wait a moment for the success animation
    setTimeout(async () => {
      try {
        await onUpdatePage(newPage);
        
        // Exit animation
        Animated.parallel([
          Animated.timing(modalOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(modalScale, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(slideUpAnim, {
            toValue: 30,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start(() => {
          onClose();
        });
      } catch (error) {
        console.error('Error updating page:', error);
        setIsUpdating(false);
        setIsValid(false);
      }
    }, 800);
  };

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 30,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleInputFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 0,
      tension: 100,
      friction: 6,
      useNativeDriver: false,
    }).start();
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: modalOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: modalScale },
                  { translateY: slideUpAnim }
                ]
              }
            ]}
          >
            {/* Header with book title */}
            <View style={styles.header}>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle} numberOfLines={2}>
                  {bookTitle}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Duck greeting section */}
            <View style={styles.greetingSection}>
              <View style={styles.duckContainer}>
                <Image 
                  source={require('../../assets/duckbill.png')} 
                  style={styles.duckLogo}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.greetingText}>
                {greetingText || `Welcome to "${bookTitle}"! What would you like to discuss?`}
              </Text>
            </View>

            {/* Page update section */}
            <View style={styles.pageSection}>
              <Text style={styles.pageLabel}>
                Current page: {currentPage} / {totalPages}
              </Text>
              
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    borderColor: isValid 
                      ? (inputFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [theme.colors.borderSubtle, theme.colors.blue]
                        }))
                      : theme.colors.danger,
                    transform: [
                      {
                        scale: inputFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }
                    ]
                  }
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={inputPage}
                  onChangeText={handleInputChange}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  keyboardType="numeric"
                  placeholder="Update page"
                  placeholderTextColor={theme.colors.textMuted}
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.maxPagesText}>
                  / {totalPages}
                </Text>
              </Animated.View>

              {!isValid && inputPage && (
                <Text style={styles.errorText}>
                  Please enter a page number between 1 and {totalPages}
                </Text>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.buttonContainer}>
              <Animated.View
                style={[
                  styles.continueButtonContainer,
                  {
                    transform: [
                      {
                        scale: successAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05]
                        })
                      }
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    (!isValid || !inputPage || parseInt(inputPage) === currentPage) && styles.continueButtonDisabled
                  ]}
                  onPress={handleUpdate}
                  disabled={!isValid || !inputPage || parseInt(inputPage) === currentPage || isUpdating}
                  activeOpacity={0.8}
                >
                  {isUpdating ? (
                    <Animated.View
                      style={[
                        styles.successIcon,
                        {
                          opacity: successAnim,
                          transform: [
                            {
                              scale: successAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 1]
                              })
                            }
                          ]
                        }
                      ]}
                    >
                      <Image 
                        source={require('../../assets/duckbill.png')} 
                        style={styles.successDuck}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  ) : (
                    <Text style={styles.continueButtonText}>
                      {parseInt(inputPage) !== currentPage ? 'Update & Continue' : 'Continue'}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    width: Math.min(screenWidth - 48, 400),
    maxHeight: screenHeight * 0.7,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    boxShadow: '0px 20px 25px rgba(0, 0, 0, 0.5)',
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  bookInfo: {
    flex: 1,
    marginRight: 16,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    lineHeight: 24,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  greetingSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  duckContainer: {
    marginBottom: 16,
  },
  duckLogo: {
    width: 60,
    height: 60,
  },
  greetingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_500Medium',
  },
  pageSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
    paddingVertical: 12,
    textAlign: 'center',
  },
  maxPagesText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontFamily: 'Inter_500Medium',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.danger,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  continueButtonContainer: {
    width: '100%',
  },
  continueButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  continueButtonDisabled: {
    backgroundColor: theme.colors.accentMuted,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successDuck: {
    width: 24,
    height: 24,
  },
});
