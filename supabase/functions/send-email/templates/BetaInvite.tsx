import * as React from 'npm:react@18.2.0';
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
  Button,
} from 'npm:@react-email/components@0.0.12';

interface BetaInviteEmailProps {
  inviteCode: string;
  inviteUrl: string;
  expiresAt?: string;
}

export const BetaInviteEmail = ({
  inviteCode,
  inviteUrl,
  expiresAt,
}: BetaInviteEmailProps) => {
  const expirationDate = expiresAt ? new Date(expiresAt).toLocaleDateString() : 'in 30 days';
  
  return (
    <Html>
      <Head />
      <Preview>You're Invited to the OptiRFP Beta Program!</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>You're Invited to the OptiRFP Beta Program!</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>
              We're excited to invite you to participate in the beta testing program for OptiRFP.
            </Text>
            <Text style={styles.text}>As a beta tester, you'll get:</Text>
            <div style={styles.list}>
              <div style={styles.listItem}>• Early access to new features</div>
              <div style={styles.listItem}>• Direct line to our development team</div>
              <div style={styles.listItem}>• Opportunity to shape the future of the product</div>
              <div style={styles.listItem}>• Extended premium benefits during the beta period</div>
            </div>
            <Section style={styles.inviteBox}>
              <Text style={styles.inviteText}><strong>Your Invite Code:</strong> {inviteCode}</Text>
              <Text style={styles.inviteText}><strong>Expires:</strong> {expirationDate}</Text>
            </Section>
            <Section style={styles.buttonContainer}>
              <Link href={inviteUrl} style={styles.button}>
                Join Beta Program
              </Link>
            </Section>
            <Text style={styles.text}>
              To join, click the button above or copy this link into your browser: <Link href={inviteUrl} style={styles.textLink}>{inviteUrl}</Link>
            </Text>
            <Text style={styles.text}>
              Thank you for your interest in OptiRFP. We look forward to your valuable feedback!
            </Text>
            <Text style={styles.text}>
              Best regards,<br />The OptiRFP Team
            </Text>
          </Section>
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} OptiRFP. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              If you did not request this invitation, please disregard this email.
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
  textLink: {
    color: '#34D399',
    textDecoration: 'underline',
  },
  list: {
    margin: '16px 0',
    padding: '0 0 0 20px',
  },
  listItem: {
    margin: '8px 0',
    fontSize: '16px',
    color: '#333',
    lineHeight: '24px',
  },
  inviteBox: {
    backgroundColor: '#e8e8e8',
    borderLeft: '4px solid #34D399',
    padding: '15px',
    margin: '20px 0',
  },
  inviteText: {
    margin: '10px 0',
    fontSize: '16px',
    color: '#333',
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
    margin: '5px 0',
  },
};

export default BetaInviteEmail;
