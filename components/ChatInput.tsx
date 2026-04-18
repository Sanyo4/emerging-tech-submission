import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
  isProcessing: boolean;
  embedded?: boolean;
  prominent?: boolean;
}

export default function ChatInput({ onSend, isProcessing, embedded, prominent }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;
    setText('');
    inputRef.current?.blur();
    await onSend(trimmed);
  };

  return (
    <View style={[styles.container, embedded && styles.containerEmbedded]}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={[styles.input, prominent && styles.inputProminent]}
          placeholder="What did you spend on?"
          placeholderTextColor={Colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!isProcessing}
          accessibilityLabel="Expense input"
          accessibilityHint="Type what you spent, for example 5 pounds on coffee"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || isProcessing) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isProcessing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Send expense"
          accessibilityState={{ disabled: !text.trim() || isProcessing, busy: isProcessing }}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceSolid,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  containerEmbedded: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  inputProminent: {
    height: 52,
    fontSize: FontSize.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
