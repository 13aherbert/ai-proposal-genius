
import React from 'react';
import { 
  Html, Head, Body, Container, 
  Section, Text, Hr, Link, 
  Heading 
} from '@react-email/components';

interface SupportEmailProps {
  name: string;
  message: string;
  ticketId: string;
  supportUrl?: string;
}

const SupportEmail: React.FC<SupportEmailProps> = ({ 
  name,
  message,
  ticketId,
  supportUrl
}) => {
  return (
    <Html>
      <Head />
      <Body style={{ 
        backgroundColor: '#f6f9fc', 
        fontFamily: 'Arial, sans-serif', 
        padding: '20px 0' 
      }}>
        <Container style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e6e6e6', 
          borderRadius: '5px', 
          padding: '40px 20px', 
          maxWidth: '600px' 
        }}>
          <Heading as="h2" style={{ color: '#34D399', textAlign: 'center' }}>
            New Support Request
          </Heading>
          <Section>
            <Text>
              <strong>From:</strong> {name}
            </Text>
            <Text>
              <strong>Ticket ID:</strong> #{ticketId}
            </Text>
            <Hr style={{ borderColor: '#e6e6e6', margin: '20px 0' }} />
            <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {message}
            </Text>
            <Hr style={{ borderColor: '#e6e6e6', margin: '20px 0' }} />
          </Section>
          {supportUrl && (
            <Section style={{ textAlign: 'center' }}>
              <Link
                href={supportUrl}
                style={{
                  backgroundColor: '#34D399',
                  color: '#ffffff',
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  margin: '20px 0',
                }}
              >
                View in Support Dashboard
              </Link>
            </Section>
          )}
          <Section style={{ 
            color: '#8898aa', 
            fontSize: '12px', 
            textAlign: 'center',
            marginTop: '20px'
          }}>
            <Text>
              This is an automated message from the support system.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SupportEmail;
