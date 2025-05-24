import React from 'npm:react@18.2.0';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text
} from 'npm:@react-email/components@0.0.12';

interface BetaRequestNotificationProps {
  userEmail: string;
  userName?: string;
  reason?: string;
  requestId: string;
  requestDate?: string;
  adminDashboardUrl?: string;
}

export default function BetaRequestNotification({
  userEmail,
  userName = "Not provided",
  reason = "Not provided",
  requestId,
  requestDate = new Date().toLocaleString(),
  adminDashboardUrl = "https://optirfp.ai/admin/beta-requests"
}: BetaRequestNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New Beta Program Request from {userEmail}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Beta Program Request</Heading>
          <Section style={section}>
            <Text style={text}>A new user has requested to join the beta program:</Text>
            
            <Text style={infoItem}>
              <strong>Email:</strong> {userEmail}
            </Text>
            
            <Text style={infoItem}>
              <strong>Name:</strong> {userName}
            </Text>
            
            <Text style={infoItem}>
              <strong>Request ID:</strong> {requestId}
            </Text>
            
            <Text style={infoItem}>
              <strong>Date:</strong> {requestDate}
            </Text>
            
            <Hr style={hr} />
            
            <Text style={reasonHeading}><strong>Reason for joining:</strong></Text>
            <Text style={reasonText}>{reason}</Text>
          </Section>
          
          <Button style={button} href={adminDashboardUrl}>
            Review in Admin Dashboard
          </Button>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            This is an automated notification from OptiRFP Admin System.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: "30px 0"
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e6e6e6",
  borderRadius: "5px",
  margin: "0 auto",
  padding: "20px 25px",
  width: "600px"
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.4",
  margin: "10px 0 25px"
};

const section = {
  margin: "25px 0"
};

const text = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "1.6",
  margin: "16px 0"
};

const infoItem = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "10px 0"
};

const reasonHeading = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "20px 0 10px"
};

const reasonText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "10px 0",
  padding: "15px",
  backgroundColor: "#f8f9fa",
  borderLeft: "3px solid #ddd",
  borderRadius: "2px"
};

const button = {
  backgroundColor: "#4f46e5",
  borderRadius: "4px",
  color: "#fff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: "20px 0",
  padding: "12px 25px",
  textAlign: "center" as const,
  textDecoration: "none"
};

const hr = {
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "25px 0"
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "20px 0 0"
};
