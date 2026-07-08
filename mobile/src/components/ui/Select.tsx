import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/theme/colors';
import { Typography } from '@/theme/typography';
import { Shape } from '@/theme/shape';
import { Spacing } from '@/theme/spacing';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Select({
  label,
  options,
  value,
  onValueChange,
  placeholder = 'Pilih...',
  error,
  containerStyle,
}: SelectProps) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error ? styles.errorBorder : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
          {selectedLabel || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{label || 'Pilih'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    ...Typography.bodyMedium,
    color: Colors.zinc700,
    marginBottom: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.zinc200,
    borderRadius: Shape.borderRadius.md,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  errorBorder: { borderColor: Colors.danger },
  triggerText: {
    ...Typography.body,
    color: Colors.zinc900,
  },
  placeholder: { color: Colors.zinc400 },
  arrow: { fontSize: 10, color: Colors.zinc400 },
  error: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: Shape.borderRadius.xl,
    padding: Spacing.base,
    maxHeight: 400,
  },
  modalTitle: {
    ...Typography.subtitle,
    color: Colors.zinc900,
    marginBottom: Spacing.md,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: Shape.borderRadius.md,
  },
  optionSelected: {
    backgroundColor: Colors.olive + '15',
  },
  optionText: {
    ...Typography.body,
    color: Colors.zinc800,
  },
  optionTextSelected: {
    color: Colors.olive,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.zinc100,
  },
});
