
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

interface PasswordResetEmailProps {
  resetUrl: string;
  expiresIn?: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  expiresIn = '24 hours',
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset Your Password - OptiRFP</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>Password Reset Request</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>
              We received a request to reset your OptiRFP password.
            </Text>
            <Text style={styles.text}>
              Click the button below to set a new password. This link is valid for {expiresIn}.
            </Text>
            <Section style={styles.buttonContainer}>
              <Link href={resetUrl} style={styles.button}>
                Reset Password
              </Link>
            </Section>
            <Text style={styles.text}>
              If you didn't request a password reset, you can safely ignore this email.
            </Text>
            <Text style={styles.text}>
              Regards,<br />The OptiRFP Team
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

export default PasswordResetEmail;
