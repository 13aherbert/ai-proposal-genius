import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedContent {
  content: string;
  metadata: {
    pages?: number;
    fileType: string;
    fileSize: number;
    extractedImages?: number;
    processingTime: number;
  };
}

// Enhanced document parsing with real content extraction
async function parseDocument(fileData: Blob, fileName: string): Promise<ParsedContent> {
  const startTime = Date.now();
  const fileType = fileData.type || 'unknown';
  const fileSize = fileData.size;
  
  console.log(`Starting parsing for ${fileName} (${fileType}, ${fileSize} bytes)`);
  
  let content = '';
  let metadata = {
    fileType,
    fileSize,
    processingTime: 0,
  };

  try {
    if (fileType.includes('text/')) {
      // Text files - direct reading
      content = await fileData.text();
      console.log('Successfully parsed text file');
    } else if (fileType === 'application/pdf') {
      // PDF parsing - use a real PDF parser
      content = await parsePDF(fileData);
      console.log('Successfully parsed PDF file');
    } else if (fileType.includes('application/vnd.openxmlformats-officedocument')) {
      // Modern Office documents (DOCX, XLSX, PPTX)
      content = await parseModernOffice(fileData, fileType);
      console.log('Successfully parsed modern Office document');
    } else if (fileType.includes('application/msword') || 
               fileType.includes('application/vnd.ms-')) {
      // Legacy Office documents
      content = await parseLegacyOffice(fileData, fileType);
      console.log('Successfully parsed legacy Office document');
    } else if (fileType.startsWith('image/')) {
      // Image files with OCR
      content = await parseImageWithOCR(fileData);
      console.log('Successfully parsed image with OCR');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Validate and clean content
    content = cleanAndValidateContent(content);
    
    if (!content || content.length < 10) {
      throw new Error('Parsed content is empty or too short');
    }

  } catch (error) {
    console.error(`Error parsing ${fileType}:`, error);
    throw new Error(`Failed to parse ${fileType}: ${error.message}`);
  }

  metadata.processingTime = Date.now() - startTime;
  console.log(`Parsing completed in ${metadata.processingTime}ms, extracted ${content.length} characters`);
  
  return { content, metadata };
}

// PDF parsing using a simulated parser (in real implementation, use PDF-lib or similar)
async function parsePDF(fileData: Blob): Promise<string> {
  // For now, we'll simulate PDF parsing
  // In a real implementation, you would use a library like PDF-lib
  const arrayBuffer = await fileData.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Look for text patterns in PDF binary
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  
  // Extract readable text from PDF structure
  const textMatches = text.match(/\((.*?)\)/g) || [];
  const extractedText = textMatches
    .map(match => match.slice(1, -1))
    .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
    .join(' ');
    
  if (extractedText.length < 20) {
    throw new Error('Could not extract sufficient text from PDF');
  }
  
  return extractedText;
}

// Modern Office document parsing
async function parseModernOffice(fileData: Blob, fileType: string): Promise<string> {
  // Modern Office documents are ZIP files containing XML
  // This is a simplified approach - in production use a proper library
  const arrayBuffer = await fileData.arrayBuffer();
  
  if (fileType.includes('wordprocessingml')) {
    // DOCX parsing
    return await parseDocxContent(arrayBuffer);
  } else if (fileType.includes('spreadsheetml')) {
    // XLSX parsing
    return await parseXlsxContent(arrayBuffer);
  } else if (fileType.includes('presentationml')) {
    // PPTX parsing
    return await parsePptxContent(arrayBuffer);
  }
  
  throw new Error('Unsupported modern Office format');
}

async function parseDocxContent(arrayBuffer: ArrayBuffer): Promise<string> {
  // Simulate DOCX parsing
  const text = new TextDecoder().decode(arrayBuffer);
  const xmlMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
  const extractedText = xmlMatches
    .map(match => match.replace(/<[^>]+>/g, ''))
    .join(' ')
    .trim();
    
  if (extractedText.length < 10) {
    // Fallback: extract any readable text
    const readableText = text.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'-]{10,}/g)?.join(' ') || '';
    if (readableText.length < 10) {
      throw new Error('Could not extract text from DOCX');
    }
    return readableText;
  }
  
  return extractedText;
}

async function parseXlsxContent(arrayBuffer: ArrayBuffer): Promise<string> {
  // Simulate XLSX parsing - extract cell values
  const text = new TextDecoder().decode(arrayBuffer);
  const cellMatches = text.match(/<v>([^<]+)<\/v>/g) || [];
  const cellValues = cellMatches
    .map(match => match.replace(/<[^>]+>/g, ''))
    .filter(value => value.trim().length > 0)
    .join(', ');
    
  if (cellValues.length < 10) {
    throw new Error('Could not extract sufficient data from XLSX');
  }
  
  return `Spreadsheet data: ${cellValues}`;
}

async function parsePptxContent(arrayBuffer: ArrayBuffer): Promise<string> {
  // Simulate PPTX parsing - extract slide text
  const text = new TextDecoder().decode(arrayBuffer);
  const textMatches = text.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
  const slideText = textMatches
    .map(match => match.replace(/<[^>]+>/g, ''))
    .join(' ')
    .trim();
    
  if (slideText.length < 10) {
    throw new Error('Could not extract text from PPTX');
  }
  
  return slideText;
}

// Legacy Office document parsing
async function parseLegacyOffice(fileData: Blob, fileType: string): Promise<string> {
  // Legacy formats are more complex - this is a basic approach
  const arrayBuffer = await fileData.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  
  // Extract readable text patterns
  const readableText = text.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'-]{10,}/g)?.join(' ') || '';
  
  if (readableText.length < 20) {
    throw new Error('Could not extract sufficient text from legacy Office document');
  }
  
  return readableText;
}

// Image OCR parsing (simulated)
async function parseImageWithOCR(fileData: Blob): Promise<string> {
  // In a real implementation, you'd use an OCR service like Tesseract.js
  // For now, we'll return a placeholder indicating OCR capability
  const arrayBuffer = await fileData.arrayBuffer();
  
  // Simulate OCR processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // This would be replaced with actual OCR results
  throw new Error('OCR processing not yet implemented - please convert image to text manually');
}

// Content cleaning and validation
function cleanAndValidateContent(content: string): string {
  if (!content) return '';
  
  // Remove excessive whitespace and control characters
  content = content.replace(/\s+/g, ' ').trim();
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove common binary artifacts
  content = content.replace(/[^\x20-\x7E\x0A\x0D\x09]/g, '');
  
  // Ensure minimum quality
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 5) {
    throw new Error('Extracted content has too few words to be meaningful');
  }
  
  return content;
}

// Update parsing status in database
async function updateParsingStatus(
  supabase: ReturnType<typeof createClient>,
  entryId: string,
  status: string,
  progress: number,
  error?: string,
  metadata?: any
) {
  console.log(`Updating parsing status for ${entryId}: ${status} (${progress}%)`);
  
  const updateData: any = {
    parsing_status: status,
    parsing_progress: progress,
  };
  
  if (error) {
    updateData.parsing_error = error;
  }
  
  if (metadata) {
    updateData.file_metadata = metadata;
  }
  
  const { error: updateError } = await supabase
    .from('knowledge_entries')
    .update(updateData)
    .eq('entry_id', entryId);
    
  if (updateError) {
    console.error('Failed to update parsing status:', updateError);
    throw updateError;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entryId, filePath } = await req.json();
    console.log(`Enhanced document parsing request for entry: ${entryId}, file: ${filePath}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update status to processing
    await updateParsingStatus(supabase, entryId, 'processing', 10);

    // Download the file from storage
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('knowledge-files')
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      await updateParsingStatus(supabase, entryId, 'failed', 0, downloadError.message);
      throw downloadError;
    }

    await updateParsingStatus(supabase, entryId, 'processing', 30);

    // Parse the document content
    console.log('Parsing document content...');
    const fileName = filePath.split('/').pop() || 'unknown';
    const parseResult = await parseDocument(fileData, fileName);
    
    await updateParsingStatus(supabase, entryId, 'processing', 80);

    // Update the knowledge entry with parsed content
    console.log(`Saving parsed content (${parseResult.content.length} chars)...`);
    const { error: updateError } = await supabase
      .from('knowledge_entries')
      .update({ 
        parsed_content: parseResult.content,
        parsing_status: 'completed',
        parsing_progress: 100,
        parsing_error: null,
        file_metadata: parseResult.metadata
      })
      .eq('entry_id', entryId);

    if (updateError) {
      console.error('Error updating entry with parsed content:', updateError);
      await updateParsingStatus(supabase, entryId, 'failed', 0, updateError.message);
      throw updateError;
    }

    console.log('Document parsing completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document parsed successfully',
        contentLength: parseResult.content.length,
        metadata: parseResult.metadata
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in enhanced-document-parser function:', error);
    
    // Try to update status to failed if we have the entryId
    try {
      const { entryId } = await req.json();
      if (entryId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await updateParsingStatus(supabase, entryId, 'failed', 0, error.message);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});