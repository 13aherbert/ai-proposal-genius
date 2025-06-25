
export const initialKnowledgeEntries = [
  // RFP Processing & Analysis
  {
    title: "RFP Document Analysis Process",
    category: "procedures",
    content: `# RFP Document Analysis Process

## Overview
OptiRFP provides AI-powered analysis of Request for Proposal (RFP) documents to extract key requirements, deadlines, and evaluation criteria automatically.

## Supported File Formats
- PDF documents (.pdf)
- Microsoft Word documents (.docx, .doc)
- Text files (.txt)
- Maximum file size: 10MB per document

## Analysis Process
1. **Document Upload**: Users upload RFP documents through the secure upload interface
2. **AI Processing**: Advanced AI algorithms parse the document to identify:
   - Project requirements and scope
   - Submission deadlines
   - Evaluation criteria
   - Budget constraints
   - Technical specifications
   - Compliance requirements

3. **Structured Output**: Analysis results are presented in organized sections for easy review

## Key Benefits
- Reduces manual review time by 80%
- Ensures no critical requirements are missed
- Standardizes requirement extraction across all RFPs
- Provides consistent analysis quality

## Best Practices
- Upload documents in their original format when possible
- Ensure document text is not image-based for optimal parsing
- Review AI analysis results for accuracy before proceeding
- Add manual notes for any unique requirements not captured`,
  },

  {
    title: "Project Creation and Management Workflow",
    category: "procedures",
    content: `# Project Creation and Management Workflow

## Project Initialization
### Required Information
- **Project Title**: Descriptive name for the RFP response
- **Client Name**: Organization issuing the RFP
- **Business Name**: Your company name for the response
- **Deadline**: Proposal submission deadline
- **RFP Document**: Original RFP file

### Project Setup Process
1. Navigate to Upload RFP page
2. Drag and drop or select RFP document
3. Monitor upload progress (real-time progress bar)
4. Complete project metadata form
5. Submit for AI analysis
6. Review generated project outline

## Project Status Tracking
- **Draft**: Initial creation, analysis in progress
- **In Progress**: Active proposal development
- **Under Review**: Internal review phase
- **Completed**: Final proposal ready
- **Submitted**: Proposal sent to client

## Project Organization
- Projects are organized by recency and status
- Search functionality across all projects
- Filter by client, status, or deadline
- Archive completed projects for reference

## Collaboration Features
- Share projects with team members
- Role-based access (viewer, editor, admin)
- Comment and review system
- Version history tracking`,
  },

  // Proposal Generation System
  {
    title: "AI-Powered Proposal Generation",
    category: "procedures",
    content: `# AI-Powered Proposal Generation

## Overview
OptiRFP's proposal generation system creates comprehensive, professional proposals by combining AI analysis with your knowledge base content.

## Generation Process
### Phase 1: Outline Creation
- AI analyzes RFP requirements
- Generates structured proposal outline
- Suggests relevant sections based on RFP type
- Allows manual outline customization

### Phase 2: Section Development
- Individual section content generation
- Knowledge base integration for consistency
- Context-aware content creation
- Professional formatting and structure

### Phase 3: Content Refinement
- Review and edit generated content
- Maintain consistency across sections
- Ensure compliance with RFP requirements
- Professional language and tone

## Supported Proposal Sections
- Executive Summary
- Company Overview and Qualifications
- Technical Approach and Methodology
- Project Timeline and Milestones
- Team Composition and Roles
- Budget and Pricing Structure
- Risk Management and Mitigation
- Quality Assurance Procedures
- Client References and Case Studies
- Terms and Conditions

## Quality Assurance
- Automatic compliance checking
- Consistency validation across sections
- Grammar and style optimization
- Professional formatting standards

## Best Practices
- Review all AI-generated content
- Customize content for specific client needs
- Maintain consistent messaging throughout
- Include relevant case studies and examples`,
  },

  {
    title: "Proposal Section Management",
    category: "procedures",
    content: `# Proposal Section Management

## Section Organization
### Drag-and-Drop Reordering
- Intuitive section reordering interface
- Real-time preview of section structure
- Automatic numbering and formatting
- Custom section creation capability

### Section Types
- **Standard Sections**: Pre-defined proposal components
- **Custom Sections**: Client-specific requirements
- **Conditional Sections**: Included based on RFP criteria
- **Template Sections**: Reusable content blocks

## Content Generation Options
### AI-Assisted Writing
- Context-aware content generation
- Knowledge base integration
- Industry-specific terminology
- Professional tone and style

### Manual Content Creation
- Rich text editor with formatting options
- Template insertion capabilities
- Media and document embedding
- Collaborative editing features

## Section Backup and Recovery
- Automatic draft saving every 30 seconds
- Version history with restore points
- Backup before major changes
- Recovery options for accidental deletions

## Content Consistency
- Cross-section reference checking
- Terminology standardization
- Brand voice maintenance
- Compliance verification`,
  },

  // Knowledge Management
  {
    title: "Knowledge Base Management System",
    category: "procedures",
    content: `# Knowledge Base Management System

## Overview
The knowledge base serves as the central repository for your organization's expertise, templates, and reusable content for proposal generation.

## Knowledge Categories
- **Procedures**: Step-by-step operational processes
- **Policies**: Company policies and guidelines
- **Templates**: Reusable document templates
- **Training**: Educational materials and guides
- **Best Practices**: Proven methodologies and approaches
- **FAQs**: Frequently asked questions and answers
- **Reference**: Technical specifications and standards
- **Case Studies**: Project examples and outcomes

## Content Creation Methods
### Manual Entry
- Rich text editor for formatted content
- Support for headings, lists, and tables
- Media embedding capabilities
- Cross-references and linking

### File Upload
- Document parsing and content extraction
- Support for PDF, Word, and text files
- Automatic content structuring
- Metadata preservation

### AI-Generated Content
- Industry-specific content generation
- Topic-based knowledge creation
- Best practice recommendations
- Template generation

## Search and Discovery
- Full-text search across all entries
- Category-based filtering
- Tag-based organization
- Recent entries tracking
- Usage analytics and recommendations

## Content Maintenance
- Regular content review processes
- Version control and history
- Content freshness indicators
- Collaborative editing workflows`,
  },

  // User Management & Authentication
  {
    title: "User Authentication and Access Control",
    category: "policies",
    content: `# User Authentication and Access Control

## Authentication System
### Security Features
- Email and password authentication
- Secure session management
- Password requirements and validation
- Account verification processes
- Password reset functionality

### User Roles and Permissions
- **Admin**: Full system access and user management
- **Beta Tester**: Early access to new features
- **User**: Standard platform access
- **Viewer**: Read-only access to shared projects

## Multi-Tenant Architecture
### Organization Management
- Organization creation and setup
- Member invitation and management
- Role assignment within organizations
- Data isolation between organizations
- Organization switching capability

### Access Control
- Row-level security (RLS) policies
- Organization-based data filtering
- Project sharing controls
- Knowledge base access permissions

## Account Management
### Profile Settings
- Business information management
- Industry specialization settings
- Notification preferences
- Avatar and contact details

### Security Settings
- Password change functionality
- Account deletion procedures
- Data export capabilities
- Privacy controls`,
  },

  // Subscription & Billing
  {
    title: "Subscription Plans and Pricing Structure",
    category: "reference",
    content: `# Subscription Plans and Pricing Structure

## Plan Tiers
### Trial Plan (Free - 7 days)
- **Project Limit**: 3 projects
- **Features**: Core RFP analysis and proposal generation
- **Support**: Community support
- **Duration**: 7-day trial period

### Starter Plan
- **Project Limit**: 10 projects
- **Features**: 
  - Advanced AI analysis
  - Knowledge base management
  - Basic collaboration tools
  - Email support
- **Target**: Small businesses and freelancers

### Pro Plan
- **Project Limit**: 30 projects
- **Features**:
  - Unlimited AI generations
  - Advanced collaboration
  - Priority support
  - Custom templates
  - Analytics and reporting
- **Target**: Growing agencies and enterprises

## Subscription Management
### Billing Features
- Stripe payment processing
- Automatic recurring billing
- Invoice generation and history
- Payment method management
- Subscription upgrade/downgrade

### Usage Monitoring
- Project count tracking
- Feature usage analytics
- Limit notifications
- Upgrade prompts and recommendations

## Fair Usage Policy
- AI generation rate limits
- Storage allocation per plan
- Support response time SLAs
- Feature access restrictions`,
  },

  // Technical Infrastructure
  {
    title: "Technical Architecture and Infrastructure",
    category: "reference",
    content: `# Technical Architecture and Infrastructure

## Frontend Architecture
### Technology Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/UI component library
- **State Management**: React Query for server state
- **Routing**: React Router for navigation
- **Forms**: React Hook Form with Zod validation

### Key Features
- Responsive design for all devices
- Dark/light theme support
- Progressive loading states
- Real-time notifications
- Offline capability considerations

## Backend Infrastructure
### Supabase Services
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Built-in auth with social providers
- **Storage**: File upload and management
- **Edge Functions**: Serverless API endpoints
- **Real-time**: WebSocket connections for live updates

### AI Integration
- **OpenAI GPT**: Advanced language processing
- **Anthropic Claude**: Document analysis and generation
- **Custom Prompts**: Industry-specific AI instructions
- **Context Management**: Knowledge base integration

## Security Implementation
### Data Protection
- End-to-end encryption for sensitive data
- HTTPS enforcement across all endpoints
- API key management and rotation
- Regular security audits

### Access Control
- JWT-based authentication
- Role-based permission system
- Multi-tenant data isolation
- API rate limiting

## Performance Optimization
- Code splitting and lazy loading
- Image optimization and CDN
- Database query optimization
- Caching strategies
- Real-time monitoring`,
  },

  // Business Processes
  {
    title: "OptiRFP Service Delivery Framework",
    category: "bestpractices",
    content: `# OptiRFP Service Delivery Framework

## Our Approach to RFP Response Excellence

### Discovery and Analysis Phase
1. **RFP Document Review**
   - Comprehensive requirement analysis
   - Deadline and milestone identification
   - Compliance requirement mapping
   - Risk assessment and mitigation planning

2. **Client Research and Understanding**
   - Industry context analysis
   - Client background research
   - Competitive landscape evaluation
   - Success criteria definition

### Proposal Development Process
1. **Strategic Planning**
   - Win strategy development
   - Key message definition
   - Differentiation strategy
   - Team assembly and role assignment

2. **Content Creation**
   - AI-assisted content generation
   - Subject matter expert collaboration
   - Technical solution development
   - Pricing strategy and optimization

3. **Quality Assurance**
   - Multi-level review process
   - Compliance verification
   - Consistency checking
   - Professional editing and formatting

### Delivery and Follow-up
1. **Proposal Submission**
   - Deadline management
   - Submission confirmation
   - Client communication
   - Post-submission support

2. **Performance Tracking**
   - Win/loss analysis
   - Client feedback collection
   - Process improvement identification
   - Success metrics reporting

## Quality Standards
- 95% client satisfaction rate
- Average 60% time reduction in proposal development
- 40% improvement in win rates
- 100% on-time delivery commitment`,
  },

  {
    title: "Client Onboarding and Success Process",
    category: "procedures",
    content: `# Client Onboarding and Success Process

## Initial Client Setup
### Account Creation and Configuration
1. **Registration Process**
   - Account creation and verification
   - Initial assessment questionnaire
   - Business profile completion
   - Subscription plan selection

2. **Platform Orientation**
   - Welcome call and system overview
   - Feature demonstration and training
   - Best practices guidance
   - Initial project setup assistance

### Knowledge Base Setup
1. **Content Migration**
   - Existing template import
   - Company information capture
   - Standard response library creation
   - Custom category configuration

2. **AI Training Optimization**
   - Industry-specific customization
   - Company voice and tone calibration
   - Template and example integration
   - Performance baseline establishment

## Ongoing Success Management
### Regular Check-ins
- Monthly performance reviews
- Usage analytics and optimization
- Feature adoption guidance
- Expansion opportunity identification

### Support and Training
- Dedicated customer success manager
- Regular training sessions
- Best practice sharing
- Peer networking opportunities

### Performance Monitoring
- Win rate tracking and analysis
- Time savings measurement
- Quality metrics monitoring
- ROI calculation and reporting

## Success Metrics
- Time to first successful proposal: < 7 days
- User adoption rate: > 90% within 30 days
- Customer satisfaction score: > 4.5/5.0
- Renewal rate: > 95% annually`,
  },

  {
    title: "Pricing and Proposal Cost Structure Guidelines",
    category: "bestpractices",
    content: `# Pricing and Proposal Cost Structure Guidelines

## Service Pricing Framework
### Proposal Development Services
- **Basic RFP Response**: $2,500 - $5,000
  - Standard 10-20 page proposals
  - 2-week delivery timeline
  - Single round of revisions included
  - Email support during development

- **Comprehensive RFP Response**: $5,000 - $15,000
  - Complex 30+ page proposals
  - Technical appendices and attachments
  - Multiple stakeholder coordination
  - 3-4 week delivery timeline
  - Presentation development included

- **Strategic Partnership Proposals**: $15,000 - $50,000
  - Multi-phase implementation proposals
  - Custom solution architecture
  - Executive presentation development
  - 6-8 week delivery timeline
  - Ongoing support included

### Value-Added Services
- **RFP Analysis and Strategy**: $1,500 - $3,000
- **Competitive Intelligence**: $2,000 - $5,000
- **Proposal Template Development**: $3,000 - $8,000
- **Win/Loss Analysis**: $1,500 - $3,500
- **Presentation Coaching**: $2,500 - $5,000

## Cost Factors and Considerations
### Complexity Indicators
- Number of requirement sections
- Technical depth and specialization
- Compliance and certification requirements
- Multi-vendor coordination needs
- Custom solution development

### Timeline Impact
- Rush delivery (< 1 week): 50% premium
- Standard delivery (2-4 weeks): Base rate
- Extended timeline (> 4 weeks): 10% discount
- Ongoing retainer arrangements: 15-20% discount

### Payment Terms
- 50% deposit upon project initiation
- 25% at first draft delivery
- 25% upon final acceptance
- Net 30 payment terms for established clients
- Early payment discount: 2% within 10 days`,
  }
];
