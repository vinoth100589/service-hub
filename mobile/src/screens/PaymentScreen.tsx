import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';

function formatCardInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export default function PaymentScreen({ route, navigation }: any) {
  const { bookingId, amount, serviceName } = route.params;
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [submitting, setSubmitting] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const chargedAmount = Number((amount - (appliedPromo?.discount || 0)).toFixed(2));
  const commission = Number((chargedAmount * 0.15).toFixed(2));
  const providerReceives = Number((chargedAmount - commission).toFixed(2));

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      const response = await api.validatePromo(promoInput.trim(), amount);
      setAppliedPromo({ code: promoInput.trim().toUpperCase(), discount: response.data.discount_amount });
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError(err?.response?.data?.error || 'Could not apply this code');
    } finally {
      setPromoChecking(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handlePay = async () => {
    const digitsOnly = cardNumber.replace(/\s/g, '');
    if (digitsOnly.length < 12) {
      Alert.alert('Invalid card', 'Enter a valid card number.');
      return;
    }
    if (!expiry.trim() || !cvc.trim()) {
      Alert.alert('Missing details', 'Enter expiry and CVC.');
      return;
    }

    setSubmitting(true);
    try {
      const intentResponse = await api.createPaymentIntent(bookingId, amount, appliedPromo?.code);
      const paymentId = intentResponse.data.id;

      // Demo checkout — no real card network is contacted. A production build
      // would hand `intentResponse.data.client_secret` to the Stripe SDK here.
      const mockChargeId = `ch_${Date.now()}`;
      await api.confirmPayment(paymentId, mockChargeId);

      Alert.alert('Payment successful', `You paid $${chargedAmount} for ${serviceName}.`, [
        { text: 'OK', onPress: () => navigation.navigate('BookingsList') },
      ]);
    } catch (err: any) {
      Alert.alert('Payment failed', err?.response?.data?.error || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pay for {serviceName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service total</Text>
            <Text style={styles.summaryValue}>${amount}</Text>
          </View>
          {appliedPromo && (
            <View style={styles.summaryRow}>
              <Text style={styles.summarySublabel}>Promo ({appliedPromo.code})</Text>
              <Text style={styles.discountValue}>-${appliedPromo.discount}</Text>
            </View>
          )}
          {appliedPromo && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>You pay</Text>
              <Text style={styles.summaryValue}>${chargedAmount}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summarySublabel}>Platform fee (15%)</Text>
            <Text style={styles.summarySubvalue}>${commission}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySublabel}>Provider receives</Text>
            <Text style={styles.summarySubvalue}>${providerReceives}</Text>
          </View>
        </View>

        <Text style={styles.label}>Promo code</Text>
        {appliedPromo ? (
          <View style={styles.promoAppliedRow}>
            <Text style={styles.promoAppliedText}>{appliedPromo.code} applied — -${appliedPromo.discount}</Text>
            <TouchableOpacity onPress={handleRemovePromo}>
              <Text style={styles.promoRemoveText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.input, styles.promoInput]}
              placeholder="e.g. WELCOME10"
              value={promoInput}
              onChangeText={(t) => { setPromoInput(t); setPromoError(null); }}
              autoCapitalize="characters"
              editable={!promoChecking}
            />
            <TouchableOpacity
              style={[styles.promoApplyButton, promoChecking && styles.payButtonDisabled]}
              onPress={handleApplyPromo}
              disabled={promoChecking || !promoInput.trim()}
            >
              {promoChecking ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.promoApplyText}>Apply</Text>}
            </TouchableOpacity>
          </View>
        )}
        {promoError && <Text style={styles.promoError}>{promoError}</Text>}

        <Text style={styles.label}>Card number</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={(t) => setCardNumber(formatCardInput(t))}
          placeholder="4242 4242 4242 4242"
          keyboardType="number-pad"
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Expiry</Text>
            <TextInput
              style={styles.input}
              value={expiry}
              onChangeText={setExpiry}
              placeholder="MM/YY"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>CVC</Text>
            <TextInput
              style={styles.input}
              value={cvc}
              onChangeText={setCvc}
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>

        <Text style={styles.demoNote}>
          Demo checkout — no real card network is contacted. Pre-filled with a test card.
        </Text>

        <TouchableOpacity
          style={[styles.payButton, submitting && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ${chargedAmount}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summarySublabel: {
    fontSize: 12,
    color: '#999',
  },
  summarySubvalue: {
    fontSize: 12,
    color: '#999',
  },
  discountValue: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  promoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
  },
  promoApplyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoApplyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  promoAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAFBEF',
    borderRadius: 8,
    padding: 12,
  },
  promoAppliedText: {
    fontSize: 13,
    color: '#1A7A3C',
    fontWeight: '600',
  },
  promoRemoveText: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
  },
  promoError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  demoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 16,
  },
  payButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
