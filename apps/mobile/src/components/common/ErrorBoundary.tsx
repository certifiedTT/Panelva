import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AlertTriangleIcon } from './Icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: { error: Error | null; resetError: () => void }) => ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    } else {
      // In production, log without leaking sensitive user context
      console.warn('[ErrorBoundary]: An unexpected render error occurred:', error.message);
    }

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
        });
      }

      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangleIcon size={36} color="#EF4444" />
            </View>

            <Text style={styles.title}>Something went wrong.</Text>
            <Text style={styles.subtitle}>We couldn't load this page.</Text>

            {typeof __DEV__ !== 'undefined' && __DEV__ && this.state.error ? (
              <View style={styles.debugBox}>
                <Text style={styles.debugText} numberOfLines={3}>
                  {this.state.error.toString()}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.resetError}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28283C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  debugBox: {
    width: '100%',
    backgroundColor: '#0F0F1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#28283C',
  },
  debugText: {
    fontSize: 12,
    color: '#EF4444',
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
