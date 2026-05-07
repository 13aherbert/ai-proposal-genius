
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getFileType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  return extension;
}

// Check if the analysis is too generic (indicates insufficient content was processed)
function isGenericAnalysis(analysis: string): boolean {
  const genericPhrases = [
    'I don\'t have the ability to analyze',
    'without the details being provided',
    'I can provide a general',
    'based on a typical RFP',
    'I cannot access',
    'I don\'t have access to',
    'general proposal outline',
    'typical proposal structure'
  ];
  
  const lowerAnalysis = analysis.toLowerCase();
  return genericPhrases.some(phrase => lowerAnalysis.includes(phrase.toLowerCase()));
}

// Intelligently process RFP content to extract the most relevant sections
async function processRFPContent(fullText: string): Promise<string> {
  const MAX_TOKENS = 50000; // Increased from 15,000 to 50,000 characters
  
  // If text is within limit, return as-is
  if (fullText.length <= MAX_TOKENS) {
    console.log('Document within size limit, using full content');
    return fullText;
  }
  
  console.log(`Document is large (${fullText.length} chars), applying intelligent processing`);
  
  // Keywords that indicate important RFP sections
  const importantSectionKeywords = [
    'requirement', 'deadline', 'due date', 'submission', 'evaluation', 'criteria',
    'scope of work', 'deliverable', 'timeline', 'milestone', 'budget', 'proposal',
    'mandatory', 'must', 'shall', 'objective', 'goal', 'specification', 'technical',
    'qualification', 'experience', 'format', 'attachment', 'appendix'
  ];
  
  // Split text into paragraphs and sections
  const sections = fullText.split(/\n\s*\n/);
  const prioritizedSections: { content: string; priority: number }[] = [];
  
  for (const section of sections) {
    if (section.trim().length < 50) continue; // Skip very short sections
    
    let priority = 0;
    const lowerSection = section.toLowerCase();
    
    // Calculate priority based on important keywords
    for (const keyword of importantSectionKeywords) {
      const matches = (lowerSection.match(new RegExp(keyword, 'g')) || []).length;
      priority += matches;
    }
    
    // Boost priority for sections with dates, numbers, or lists
    if (lowerSection.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
      priority += 5; // Date patterns
    }
    if (lowerSection.match(/^\s*[\d\w]\.\s|^\s*\([\d\w]\)\s|^\s*[-•]\s/m)) {
      priority += 3; // Lists
    }
    if (lowerSection.match(/\$[\d,]+|\b\d+\s*(hours?|days?|weeks?|months?)\b/i)) {
      priority += 4; // Budget or time references
    }
    
    prioritizedSections.push({ content: section, priority });
  }
  
  // Sort by priority (highest first)
  prioritizedSections.sort((a, b) => b.priority - a.priority);
  
  // Build the processed content within the token limit
  let processedContent = '';
  let currentLength = 0;
  
  for (const section of prioritizedSections) {
    const sectionWithNewline = section.content + '\n\n';
    if (currentLength + sectionWithNewline.length <= MAX_TOKENS) {
      processedContent += sectionWithNewline;
      currentLength += sectionWithNewline.length;
    } else {
      // Try to fit a partial section if there's room
      const remainingSpace = MAX_TOKENS - currentLength;
      if (remainingSpace > 200) { // Only if we have meaningful space left
        processedContent += section.content.substring(0, remainingSpace - 50) + '...\n\n';
      }
      break;
    }
  }
  
  console.log(`Processed content length: ${processedContent.length} chars from original ${fullText.length} chars`);
  return processedContent;
}

async function extractTextFromFile(arrayBuffer: ArrayBuffer, filePath: string): Promise<string> {
  const fileType = getFileType(filePath);
  console.log('Extracting text from file type:', fileType);

  try {
    switch (fileType) {
      case 'pdf': {
        console.log('Starting PDF text extraction (unpdf)');
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdf = await getDocumentProxy(uint8Array);
        const { text } = await extractText(pdf, { mergePages: true });
        const fullText = Array.isArray(text) ? text.join('\n') : text;
        console.log('PDF text extraction completed, length:', fullText.length);
        return fullText;
      }
      
      case 'txt':
      case 'text':
        console.log('Processing text file');
        const textDecoder = new TextDecoder('utf-8');
        const text = textDecoder.decode(arrayBuffer);
        console.log('Text file processed, length:', text.length);
        return text;
      
      case 'doc':
      case 'docx':
        console.log('Processing Word document with Mammoth.js');
        try {
          const buffer = Buffer.from(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer });
          
          if (result.text && result.text.trim().length > 0) {
            console.log('Word document text extraction completed, length:', result.text.length);
            
            // Log any warnings from mammoth
            if (result.messages && result.messages.length > 0) {
              console.log('Mammoth warnings:', result.messages.map(m => m.message).join(', '));
            }
            
            return result.text;
          } else {
            throw new Error('No text content found in Word document');
          }
        } catch (mammothError) {
          console.error('Mammoth.js extraction failed:', mammothError);
          // Fallback: try to decode as text if mammoth fails
          console.log('Attempting fallback text extraction for Word document');
          const fallbackDecoder = new TextDecoder('utf-8');
          const fallbackText = fallbackDecoder.decode(arrayBuffer);
          
          if (fallbackText && fallbackText.trim().length > 50) {
            console.log('Fallback extraction successful');
            return fallbackText;
          }
          
          throw new Error(`Failed to extract text from Word document: ${mammothError.message}`);
        }
      
      case 'rtf':
        console.log('Processing RTF document');
        const rtfDecoder = new TextDecoder('utf-8');
        const rtfText = rtfDecoder.decode(arrayBuffer);
        // Basic RTF processing - remove RTF control codes
        const cleanText = rtfText
          .replace(/\\[a-z]+\d*\s?/g, '') // Remove RTF control words
          .replace(/[{}]/g, '') // Remove braces
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        console.log('RTF processing completed, length:', cleanText.length);
        return cleanText;
      
      default:
        // Try to decode as text for unknown file types
        console.log('Unknown file type, attempting text extraction');
        try {
          const decoder = new TextDecoder('utf-8');
          const extractedText = decoder.decode(arrayBuffer);
          if (extractedText && extractedText.trim().length > 0) {
            console.log('Text extraction successful for unknown file type');
            return extractedText;
          }
        } catch (decodeError) {
          console.error('Failed to decode as text:', decodeError);
        }
        
        throw new Error(`Unsupported file type: ${fileType}. Supported formats: PDF, TXT, DOC, DOCX, RTF`);
    }
  } catch (error) {
    console.error('Error in file text extraction:', error);
    throw new Error(`Failed to extract text from ${fileType.toUpperCase()}: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const requestData = await req.json();
    console.log('Received request data:', requestData);

    if (!requestData.filePath || !requestData.projectId) {
      throw new Error('Missing required fields: filePath and projectId');
    }

    // Fetch all project documents for multi-document analysis
    const { data: projectDocs } = await supabaseAdmin
      .from('project_documents')
      .select('file_name, file_path, document_type')
      .eq('project_id', requestData.projectId)
      .limit(5);

    const allDocPaths = projectDocs && projectDocs.length > 1
      ? projectDocs
      : [{ file_name: requestData.filePath.split('/').pop() || 'document', file_path: requestData.filePath, document_type: 'rfp' }];

    console.log(`Processing ${allDocPaths.length} document(s) for analysis`);

    // Download and extract text from all documents
    let combinedText = '';
    const docTexts: { fileName: string; filePath: string; text: string }[] = [];

    for (const doc of allDocPaths) {
      try {
        console.log('Downloading file:', doc.file_path);
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('rfp-files')
          .download(doc.file_path);

        if (downloadError || !fileData) {
          console.warn(`Failed to download ${doc.file_name}:`, downloadError);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const extractedText = await extractTextFromFile(arrayBuffer, doc.file_path);

        if (extractedText && extractedText.trim().length > 0) {
          docTexts.push({ fileName: doc.file_name, filePath: doc.file_path, text: extractedText });
        }
      } catch (err) {
        console.warn(`Error extracting text from ${doc.file_name}:`, err);
      }
    }

    if (docTexts.length === 0) {
      throw new Error('No text content extracted from any document');
    }

    // Build combined text with document headers
    if (docTexts.length > 1) {
      combinedText = docTexts.map(d =>
        `--- DOCUMENT: ${d.fileName} ---\n${d.text}`
      ).join('\n\n');
    } else {
      combinedText = docTexts[0].text;
    }

    console.log('Total combined text length:', combinedText.length);

    // Intelligently process the combined text
    console.log('Processing extracted text for analysis');
    const processedContent = await processRFPContent(combinedText);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable API key is not configured');
    }
    
    // Build multi-document awareness into the system prompt
    const multiDocInstruction = docTexts.length > 1
      ? `\n\nIMPORTANT — MULTI-DOCUMENT ANALYSIS:
You will receive ${docTexts.length} documents from this opportunity, each preceded by a "--- DOCUMENT: filename ---" header.
First, identify which document is the PRIMARY RFP, solicitation, or Statement of Work. Base your analysis primarily on that document.
Use other documents (amendments, wage determinations, forms, cover letters) as supplementary context only.
At the very start of your analysis, state: "PRIMARY DOCUMENT IDENTIFIED: [filename]"
`
      : '';

    // Call Lovable AI Gateway for analysis
    console.log('Calling Lovable AI Gateway for analysis');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert RFP analyst with deep experience in competitive proposal strategy.${multiDocInstruction} Analyze the following RFP and provide a comprehensive strategic analysis with these sections:

1. **EXECUTIVE SUMMARY** (2-3 sentences)
   - Core opportunity and strategic value

2. **KEY REQUIREMENTS ANALYSIS**
   - Must-have requirements (mandatory)
   - Nice-to-have requirements (competitive advantage)
   - Technical specifications and deliverables
   - Compliance and regulatory requirements

3. **WIN PROBABILITY ASSESSMENT**
   - Estimated win probability (High/Medium/Low) with reasoning
   - Key competitive factors
   - Our likely competitive position
   - Critical success factors for winning

4. **TIMELINE & CRITICAL DEADLINES**
   - Proposal submission deadline
   - Project timeline and milestones
   - Risk factors in timing

5. **EVALUATION CRITERIA & SCORING**
   - How proposals will be evaluated
   - Scoring weights and criteria
   - Decision-making process

6. **COMPETITIVE LANDSCAPE ANALYSIS**
   - Likely competitors and their strengths
   - Differentiation opportunities
   - Competitive positioning strategy

7. **STRATEGIC RECOMMENDATIONS**
   - Key messages to emphasize in proposal
   - Areas requiring capability development
   - Risk mitigation strategies
   - Go/No-Go recommendation with reasoning

8. **POTENTIAL RISKS & MITIGATION**
   - Business risks
   - Technical risks
   - Competitive risks
   - Recommended mitigation approaches

Be specific, strategic, and actionable. Focus on intelligence that will help win this opportunity.`
          },
          {
            role: 'user',
            content: processedContent
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI Gateway error:', error);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to your workspace.');
      }
      
      throw new Error(`AI Gateway error: ${error}`);
    }

    const analysisData = await response.json();
    const analysis = analysisData.choices[0].message.content;

    // If multi-doc, try to identify which doc the AI chose as primary and update rfp_file_path
    if (docTexts.length > 1) {
      const primaryMatch = analysis.match(/PRIMARY DOCUMENT IDENTIFIED:\s*(.+?)(?:\n|$)/i);
      if (primaryMatch) {
        const identifiedName = primaryMatch[1].trim().replace(/\*+/g, '').trim();
        const matchedDoc = docTexts.find(d => 
          d.fileName.toLowerCase().includes(identifiedName.toLowerCase()) ||
          identifiedName.toLowerCase().includes(d.fileName.toLowerCase())
        );
        if (matchedDoc && matchedDoc.filePath !== requestData.filePath) {
          console.log(`AI identified primary doc as "${matchedDoc.fileName}", updating rfp_file_path`);
          await supabaseAdmin
            .from('projects')
            .update({ rfp_file_path: matchedDoc.filePath })
            .eq('project_id', requestData.projectId);
          // Also update the document_type
          await supabaseAdmin
            .from('project_documents')
            .update({ document_type: 'rfp' })
            .eq('project_id', requestData.projectId)
            .eq('file_path', matchedDoc.filePath);
        }
      }
    }
    
    // Validate that the analysis contains specific content (not generic)
    const totalChars = docTexts.reduce((sum, d) => sum + d.text.length, 0);
    if (isGenericAnalysis(analysis)) {
      console.warn('Generated analysis appears to be generic, document may need manual review');
      const enhancedAnalysis = `${analysis}\n\n**Note**: This analysis was generated from ${docTexts.length} document(s) totaling ${totalChars} characters. If the analysis seems generic, please review the original documents for additional details.`;
      
      console.log('Saving enhanced analysis to database');
      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({ analysis: enhancedAnalysis })
        .eq('project_id', requestData.projectId);

      if (updateError) {
        throw new Error(`Failed to save analysis: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ analysis: enhancedAnalysis }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save analysis to database
    console.log('Saving analysis to database');
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ analysis })
      .eq('project_id', requestData.projectId);

    if (updateError) {
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log('Analysis completed and saved successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-rfp function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze RFP', 
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
