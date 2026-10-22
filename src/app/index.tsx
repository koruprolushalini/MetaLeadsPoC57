import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';

const WEBSOCKET_URL = 'wss://occupancy-prefix-ploy.ngrok-free.dev/ws';
const MAX_RETRY_DELAY_MS = 15000;

type Lead = {
  id: string;
  created_time?: string;
  field_data?: {
    name: string;
    values: string[];
  }[];
};

type ServerMessage =
  | { type: 'recent_leads'; leads: Lead[] }
  | { type: 'new_lead'; lead: Lead };

function getField(lead: Lead, fieldName: string): string {
  return (
    lead.field_data?.find((field) => field.name === fieldName)
      ?.values?.[0] ?? ''
  );
}

function getLeadName(lead: Lead): string {
  const fullName = getField(lead, 'full_name');
  if (fullName) return fullName;

  const firstName = getField(lead, 'first_name');
  const lastName = getField(lead, 'last_name');
  const combinedName = `${firstName} ${lastName}`.trim();

  return combinedName || 'Not provided';
}

function getLeadEmail(lead: Lead): string {
  return getField(lead, 'email') || 'Not provided';
}

// Meta sends "+0000"; some engines need "+00:00" to parse it.
function formatCreated(value?: string): string {
  if (!value) return 'Not provided';
  const fixed = value.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const date = new Date(fixed);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function HomeScreen() {
  const [status, setStatus] = useState('Connecting...');
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    let intentionalClose = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | null = null;

    const connect = () => {
      const current = new WebSocket(WEBSOCKET_URL);
      socket = current;

      current.onopen = () => {
        if (intentionalClose || socket !== current) return;
        attempt = 0; // a good connection resets the backoff
        setStatus('Connected');
      };

      current.onclose = () => {
        if (intentionalClose || socket !== current) return;

        const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
        attempt += 1;
        setStatus(
          `Disconnected. Reconnecting in ${Math.round(delay / 1000)}s...`
        );
        retryTimer = setTimeout(connect, delay);
      };

      current.onerror = () => {
        // onclose always follows an error, so only onclose retries.
        if (intentionalClose || socket !== current) return;
        setStatus('Connection error');
      };

      current.onmessage = (event) => {
        if (intentionalClose || socket !== current) return;

        try {
          const message = JSON.parse(String(event.data)) as ServerMessage;

          if (
            message.type === 'recent_leads' &&
            Array.isArray(message.leads)
          ) {
            // A snapshot replaces the list, so reconnects never duplicate.
            setLeads(message.leads);
          } else if (message.type === 'new_lead' && message.lead?.id) {
            setLeads((previous) => {
              if (previous.some((lead) => lead.id === message.lead.id)) {
                return previous;
              }
              return [message.lead, ...previous];
            });
          }
        } catch (error) {
          console.warn('Invalid WebSocket message:', error);
        }
      };
    };

    connect();

    return () => {
      intentionalClose = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Meta Leads Dashboard</ThemedText>

        <View style={styles.statusCard}>
          <ThemedText type="subtitle">WebSocket Status</ThemedText>
          <ThemedText>{status}</ThemedText>
          <ThemedText>Leads received: {leads.length}</ThemedText>
        </View>

        <ThemedText type="subtitle">Recent Leads</ThemedText>

        {leads.length === 0 ? (
          <View style={styles.emptyCard}>
            {status === 'Connected' ? (
              <ThemedText>No leads received yet.</ThemedText>
            ) : (
              <>
                <ActivityIndicator />
                <ThemedText>Waiting for the server connection...</ThemedText>
              </>
            )}
          </View>
        ) : (
          leads.map((lead) => (
            <View key={lead.id} style={styles.leadCard}>
              <ThemedText type="subtitle">{getLeadName(lead)}</ThemedText>
              <ThemedText>Email: {getLeadEmail(lead)}</ThemedText>
              <ThemedText>
                Created: {formatCreated(lead.created_time)}
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  statusCard: {
    padding: 16,
    gap: 10,
    borderRadius: 12,
    backgroundColor: '#202124',
  },
  emptyCard: {
    padding: 20,
    gap: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#202124',
  },
  leadCard: {
    padding: 16,
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#202124',
  },
});