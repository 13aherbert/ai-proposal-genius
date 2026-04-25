import * as React from 'https://esm.sh/react@18.2.0';
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
} from 'https://esm.sh/@react-email/components@0.0.12';

interface WelcomeEmailProps {
  firstName?: string;
  appUrl?: string;
}

export const WelcomeEmail = ({
  firstName = 'there',
  appUrl = 'https://app.optirfp.com',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to OptiRFP!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>Welcome to OptiRFP!</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>Hello {firstName},</Text>
            <Text style={styles.text}>
              Thank you for signing up for OptiRFP. We're excited to help you create better RFP 
              responses and win more business.
            </Text>
            <Section style={styles.buttonContainer}>
              <Link href={appUrl} style={styles.button}>
                Get Started Now
              </Link>
            </Section>
            <Text style={styles.text}>
              If you have any questions, just reply to this email - we're always happy to help.
            </Text>
            <Text style={styles.text}>
              Cheers,<br />The OptiRFP Team
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
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  button: {
    backgroundColor: '#34D399',
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

export default WelcomeEmail;
