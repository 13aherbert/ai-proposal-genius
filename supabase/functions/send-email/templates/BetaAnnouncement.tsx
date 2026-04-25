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

interface BetaAnnouncementEmailProps {
  featureName: string;
  featureDetails: string;
  featureUrl?: string;
}

export const BetaAnnouncementEmail = ({
  featureName,
  featureDetails,
  featureUrl,
}: BetaAnnouncementEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Feature Alert: {featureName} - OptiRFP Beta</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.heading}>New Feature Available in Beta!</Heading>
          </Section>
          <Section>
            <Text style={styles.text}>
              We're excited to announce a new feature now available to our beta testers: <strong>{featureName}</strong>
            </Text>
            <div style={styles.featureBox}>
              <Text style={styles.featureLabel}><strong>Feature Details:</strong></Text>
              <Text style={styles.featureContent}>{featureDetails}</Text>
            </div>
            {featureUrl && (
              <Section style={styles.buttonContainer}>
                <Link href={featureUrl} style={styles.button}>
                  Try It Now
                </Link>
              </Section>
            )}
            <Text style={styles.text}>
              As always, we value your feedback. Please let us know what you think of this new feature!
            </Text>
            <Text style={styles.text}>
              Thank you for being part of our beta program.
            </Text>
            <Text style={styles.text}>
              Best regards,<br />The OptiRFP Team
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
  featureBox: {
    backgroundColor: '#e8e8e8',
    borderLeft: '4px solid #34D399',
    padding: '15px',
    margin: '20px 0',
  },
  featureLabel: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    color: '#333',
  },
  featureContent: {
    margin: '5px 0 0',
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
    margin: '0',
  },
};

export default BetaAnnouncementEmail;
