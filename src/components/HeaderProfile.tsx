import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { spacing } from '../theme/theme';
import { RankBadge } from './RankBadge';
import type { RootStackParamList } from '../navigation/types';

export function HeaderProfile() {
  const { user } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable onPress={() => navigation.navigate('Profile')} style={styles.chip}>
      {user.photoUrl && <Image source={{ uri: user.photoUrl }} style={styles.avatar} />}
      <View>
        <RankBadge rank={user.rank} small />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { marginRight: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
});
