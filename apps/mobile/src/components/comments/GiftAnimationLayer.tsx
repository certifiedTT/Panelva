import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Sparkles, Star, Trophy, Flame } from 'lucide-react-native';
import { radius } from '@panelva/theme';

export interface GiftAnimationLayerProps {
  activeTier: 0 | 1 | 2 | 3;
  onAnimationComplete?: () => void;
  children: React.ReactNode;
}

export function GiftAnimationLayer({ activeTier, onAnimationComplete, children }: GiftAnimationLayerProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showGlobalTier2, setShowGlobalTier2] = useState(false);

  useEffect(() => {
    if (activeTier === 2) {
      setShowGlobalTier2(true);
      const timer = setTimeout(() => {
        setShowGlobalTier2(false);
        onAnimationComplete?.();
      }, 10000); // 10 seconds global section effect
      return () => clearTimeout(timer);
    }
  }, [activeTier, onAnimationComplete]);

  // Ambient pulse animation loop for tier 2 & 3
  useEffect(() => {
    if (showGlobalTier2 || activeTier === 3) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [showGlobalTier2, activeTier, pulseAnim]);

  // Rotation animation loop for Tier 3 gradient/confetti sparkles
  useEffect(() => {
    if (activeTier === 3) {
      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      rotateLoop.start();
      return () => rotateLoop.stop();
    }
  }, [activeTier, rotateAnim]);

  const borderColorInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.85)'],
  });

  const backgroundColorInterpolation = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(245, 158, 11, 0.02)', 'rgba(245, 158, 11, 0.08)'],
  });

  return (
    <View style={styles.outerContainer}>
      {/* Tier 2: Entire comment section glows for 10 seconds */}
      {showGlobalTier2 && (
        <Animated.View
          style={[
            styles.tier2Overlay,
            {
              borderColor: borderColorInterpolation,
              backgroundColor: backgroundColorInterpolation,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.floatingParticleRow}>
            <Star size={14} color="#f59e0b" />
            <Sparkles size={16} color="#fbbf24" />
            <Star size={12} color="#f59e0b" />
          </View>
        </Animated.View>
      )}

      {/* Tier 3: Legendary Celebration - Persistent animated multi-color border and sparkles */}
      {activeTier === 3 && (
        <View style={styles.tier3LegendaryFrame} pointerEvents="none">
          <View style={styles.tier3Banner}>
            <Trophy size={14} color="#f59e0b" />
            <Text style={styles.tier3BannerText}>Legendary Supernova Celebration Active</Text>
            <Sparkles size={14} color="#fbbf24" />
          </View>
          <View style={styles.confettiRow}>
            <Sparkles size={16} color="#ec4899" />
            <Star size={14} color="#3b82f6" />
            <Flame size={16} color="#f97316" />
            <Sparkles size={18} color="#10b981" />
            <Star size={14} color="#fbbf24" />
          </View>
        </View>
      )}

      {/* Comment Section Children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    flex: 1,
  },
  tier2Overlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: radius.lg,
    zIndex: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  floatingParticleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tier3LegendaryFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: radius.lg,
    zIndex: 12,
  },
  tier3Banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3A2A0A',
    paddingVertical: 4,
    borderTopLeftRadius: radius.lg - 2,
    borderTopRightRadius: radius.lg - 2,
    borderBottomWidth: 1,
    borderBottomColor: '#785412',
  },
  tier3BannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fef08a',
    letterSpacing: 0.3,
  },
  confettiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
});
