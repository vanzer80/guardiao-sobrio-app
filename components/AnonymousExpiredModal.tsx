import { View, Text, Pressable, Modal } from 'react-native';
import { Colors } from '@/constants/Colors';

interface Props {
  visible: boolean;
  onConvert: () => void;
  onDismiss: () => void;
}

export function AnonymousExpiredModal({ visible, onConvert, onDismiss }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.75)',
          justifyContent: 'flex-end',
          padding: 24,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.surfaceRaised,
            borderRadius: 20,
            padding: 28,
            gap: 20,
          }}
        >
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontFamily: 'CormorantGaramond',
                color: Colors.text,
                fontSize: 28,
                lineHeight: 34,
              }}
            >
              Seu período de exploração terminou
            </Text>
            <Text style={{ color: Colors.mutedLight, fontSize: 15, lineHeight: 22 }}>
              Crie uma conta gratuita para continuar. Seus dados estão salvos.
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <Pressable
              onPress={onConvert}
              accessibilityRole="button"
              accessibilityLabel="Criar conta para manter seu progresso"
              style={{
                backgroundColor: Colors.gold,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>
                Criar conta
              </Text>
            </Pressable>

            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Continuar com acesso limitado"
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.muted, fontSize: 15 }}>
                Continuar com acesso limitado
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
