
import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface SupportEmailProps {
  name?: string;
  email?: string;
  message: string;
  ticketId: string;
}

export const SupportEmail = ({
  name = 'User',
  email = 'user@example.com',
  message,
  ticketId,
}: SupportEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Support Request: {ticketId}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>New Support Request</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>
              <strong>Ticket ID:</strong> {ticketId}
            </Text>
            <Text style={styles.text}>
              <strong>From:</strong> {name} ({email})
            </Text>
            <Text style={styles.text}>
              <strong>Message:</strong>
            </Text>
            <Section style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </Section>
            <Text style={styles.text}>
              Please respond to this request promptly.
            </Text>
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} OptiRFP. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#ffffff',
    margin: '0',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#f5f5f5',
    borderRadius: '10px 10px 0 0',
    padding: '20px',
  },
  heading: {
    color: '#3b82f6',
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '0',
    textAlign: 'center' as const,
  },
  text: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333',
    margin: '16px 0',
  },
  messageBox: {
    backgroundColor: '#f5f5f5',
    borderLeft: '4px solid #3b82f6',
    padding: '15px',
    margin: '20px 0',
  },
  messageText: {
    margin: '0',
    fontSize: '16px',
    lineHeight: '24px',
    whiteSpace: 'pre-wrap' as const,
  },
  footer: {
    backgroundColor: '#f5f5f5',
    borderRadius: '0 0 10px 10px',
    padding: '20px',
    marginTop: '20px',
  },
  footerText: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center' as const,
    margin: '0',
  },
};

export default SupportEmail;
