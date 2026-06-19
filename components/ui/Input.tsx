import { TextInput, View, Text } from 'react-native';
import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, style, ...props },
  ref,
) {
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8 }}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={Colors.muted}
        style={[
          {
            height: 52,
            borderRadius: 12,
            paddingHorizontal: 16,
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1,
            borderColor: error ? Colors.danger : Colors.border,
            color: Colors.text,
            fontSize: 16,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: Colors.danger, fontSize: 12 }}>{error}</Text>
      ) : null}
    </View>
  );
});
