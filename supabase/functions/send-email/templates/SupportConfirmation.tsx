
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

interface SupportConfirmationEmailProps {
  name: string;
  message: string;
  ticketId: string;
}

export const SupportConfirmationEmail = ({
  name,
  message,
  ticketId,
}: SupportConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>We've received your support request #{ticketId}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>Support Request Received</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>Hello {name},</Text>
            <Text style={styles.text}>
              Thank you for contacting OptiRFP support. We have received your request (#{ticketId}) and will get back to you as soon as possible.
            </Text>
            <Text style={styles.text}>
              For your reference, here's a copy of your message:
            </Text>
            <Text style={styles.message}>
              "{message}"
            </Text>
            <Text style={styles.text}>
              Our support team typically responds within 24-48 hours during business days.
            </Text>
            <Text style={styles.text}>
              Best regards,<br />The OptiRFP Support Team
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
    color: '#34D399',
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
  message: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#555',
    margin: '16px 0',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderLeft: '4px solid #34D399',
    fontStyle: 'italic',
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

export default SupportConfirmationEmail;
