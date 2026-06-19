import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles: Record<Variant, { bg: string; textColor: string; border?: string }> = {
  primary:   { bg: Colors.gold,         textColor: Colors.bg },
  secondary: { bg: Colors.surfaceRaised, textColor: Colors.text, border: Colors.border },
  ghost:     { bg: 'transparent',        textColor: Colors.gold },
  danger:    { bg: Colors.danger,        textColor: Colors.text },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: v.bg,
        borderWidth: v.border ? 1 : 0,
        borderColor: v.border,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.bg : Colors.text} />
      ) : (
        <Text style={{ color: v.textColor, fontSize: 16, fontWeight: '600' }}>{title}</Text>
      )}
    </Pressable>
  );
}
