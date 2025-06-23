
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
} from 'npm:@react-email/components@0.0.12';

interface PasswordChangedEmailProps {
  name?: string;
}

export const PasswordChangedEmail = ({
  name = 'User',
}: PasswordChangedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your OptiRFP password has been changed</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>Password Changed</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>Hello {name},</Text>
            <Text style={styles.text}>
              Your OptiRFP account password has been successfully changed.
            </Text>
            <Text style={styles.text}>
              If you did not make this change, please contact our support team immediately.
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

export default PasswordChangedEmail;
