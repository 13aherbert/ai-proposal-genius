
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
  Box,
} from '@react-email/components';

interface SupportEmailProps {
  name?: string;
  message: string;
  ticketId: string;
  supportUrl?: string;
}

export const SupportEmail = ({
  name = 'there',
  message,
  ticketId,
  supportUrl,
}: SupportEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Support Request Received - OptiRFP</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>We've Received Your Support Request</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>Hello {name},</Text>
            <Text style={styles.text}>
              Thank you for contacting OptiRFP support. We've received your request and will get back to you as soon as possible.
            </Text>
            <Box style={styles.messageBox}>
              <Text style={styles.messageLabel}><strong>Ticket ID:</strong> {ticketId}</Text>
              <Text style={styles.messageLabel}><strong>Your message:</strong></Text>
              <Text style={styles.messageContent}>{message}</Text>
            </Box>
            {supportUrl && (
              <Section style={styles.buttonContainer}>
                <Link href={supportUrl} style={styles.button}>
                  View Support Ticket
                </Link>
              </Section>
            )}
            <Text style={styles.text}>
              If you have any additional information to share, please reply to this email.
            </Text>
            <Text style={styles.text}>
              Best regards,<br />OptiRFP Support Team
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
    backgroundColor: '#e8e8e8',
    borderLeft: '4px solid #3b82f6',
    padding: '15px',
    margin: '20px 0',
  },
  messageLabel: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333',
  },
  messageContent: {
    margin: '5px 0 0',
    fontSize: '16px',
    color: '#333',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '12px 24px',
    fontWeight: 'bold',
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
