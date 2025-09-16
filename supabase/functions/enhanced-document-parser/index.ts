import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import pdfParse from "npm:pdf-parse@1.1.1";
import JSZip from "https://esm.sh/jszip@3.10.1";
import mammoth from "https://esm.sh/mammoth@1.6.0";

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
  const fileType = fileData.type || getFileTypeFromName(fileName);
  const fileSize = fileData.size;
  
  console.log(`Starting parsing for ${fileName} (${fileType}, ${fileSize} bytes)`);
  
  let content = '';
  let metadata = {
    fileType,
    fileSize,
    processingTime: 0,
  };

  try {
    if (fileType.includes('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Text files - direct reading
      content = await fileData.text();
      console.log('Successfully parsed text file');
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // PDF parsing using pdf-parse library
      content = await parsePDF(fileData);
      console.log('Successfully parsed PDF file');
    } else if (fileType.includes('application/vnd.openxmlformats-officedocument') || 
               fileName.endsWith('.docx') || fileName.endsWith('.xlsx') || fileName.endsWith('.pptx')) {
      // Modern Office documents (DOCX, XLSX, PPTX)
      content = await parseModernOffice(fileData, fileType, fileName);
      console.log('Successfully parsed modern Office document');
    } else if (fileType.includes('application/msword') || 
               fileType.includes('application/vnd.ms-') ||
               fileName.endsWith('.doc') || fileName.endsWith('.xls') || fileName.endsWith('.ppt')) {
      // Legacy Office documents
      content = await parseLegacyOffice(fileData, fileType);
      console.log('Successfully parsed legacy Office document');
    } else if (fileType.startsWith('image/') || 
               fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      // Image files with OCR
      content = await parseImageWithOCR(fileData);
      console.log('Successfully parsed image with OCR');
    } else {
      throw new Error(`Unsupported file type: ${fileType} for file: ${fileName}`);
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

// Get file type from filename extension
function getFileTypeFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    'txt': 'text/plain',
    'md': 'text/markdown',
  };
  return typeMap[ext || ''] || 'application/octet-stream';
}

// PDF parsing using pdf-parse library
async function parsePDF(fileData: Blob): Promise<string> {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Use pdf-parse to extract text
    const pdfData = await pdfParse(buffer);
    
    if (!pdfData.text || pdfData.text.trim().length < 10) {
      throw new Error('Could not extract sufficient text from PDF');
    }
    
    console.log(`Extracted ${pdfData.text.length} characters from PDF with ${pdfData.numpages} pages`);
    return pdfData.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
}

// Modern Office document parsing using specialized libraries
async function parseModernOffice(fileData: Blob, fileType: string, fileName: string): Promise<string> {
  try {
    console.log(`Parsing modern Office document: ${fileName} (${fileType})`);
    
    if (fileType.includes('wordprocessingml') || fileName.endsWith('.docx')) {
      return await parseDocxWithMammoth(fileData);
    } else if (fileType.includes('spreadsheetml') || fileName.endsWith('.xlsx')) {
      return await parseXlsxContent(fileData);
    } else if (fileType.includes('presentationml') || fileName.endsWith('.pptx')) {
      return await parsePptxContent(fileData);
    }
    
    throw new Error('Unsupported modern Office format');
  } catch (error) {
    console.error('Modern Office parsing error:', error);
    throw new Error(`Modern Office parsing failed: ${error.message}`);
  }
}

// DOCX parsing using mammoth library for reliable text extraction
async function parseDocxWithMammoth(fileData: Blob): Promise<string> {
  try {
    console.log('Parsing DOCX with mammoth library');
    const arrayBuffer = await fileData.arrayBuffer();
    
    // Use mammoth to extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (!result.value || result.value.trim().length < 10) {
      console.warn('Mammoth extraction produced minimal content, trying fallback method');
      return await parseDocxContentFallback(fileData);
    }
    
    console.log(`Successfully extracted ${result.value.length} characters from DOCX`);
    
    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Mammoth DOCX parsing error:', error);
    console.log('Falling back to manual XML parsing');
    return await parseDocxContentFallback(fileData);
  }
}

// Fallback DOCX parsing using manual XML extraction
async function parseDocxContentFallback(fileData: Blob): Promise<string> {
  try {
    console.log('Using fallback DOCX parsing method');
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Extract the main document content from word/document.xml
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) {
      throw new Error('Could not find document.xml in DOCX file');
    }
    
    const documentXml = await documentFile.async('text');
    console.log('Successfully loaded document.xml');
    
    // More comprehensive text extraction patterns
    const textPatterns = [
      /<w:t[^>]*>([^<]*)<\/w:t>/g,  // Standard word text elements
      /<w:r[^>]*><w:t[^>]*>([^<]*)<\/w:t><\/w:r>/g,  // Text runs
      /<t[^>]*>([^<]*)<\/t>/g  // Alternative text elements
    ];
    
    let extractedText = '';
    for (const pattern of textPatterns) {
      const matches = documentXml.match(pattern) || [];
      if (matches.length > 0) {
        const text = matches
          .map(element => {
            const match = element.match(/>([^<]*)</);
            return match ? match[1] : '';
          })
          .filter(text => text.trim().length > 0)
          .join(' ');
        
        if (text.length > extractedText.length) {
          extractedText = text;
        }
      }
    }
    
    if (extractedText.length < 10) {
      // Final fallback: extract any readable text
      console.log('Using final fallback text extraction');
      const allTextMatches = documentXml.match(/>([^<]{3,})</g) || [];
      extractedText = allTextMatches
        .map(match => match.slice(1, -1))
        .filter(text => {
          const cleaned = text.trim();
          return cleaned.length > 2 && /[a-zA-Z]/.test(cleaned) && !/^[\d\s.,;:!?-]*$/.test(cleaned);
        })
        .join(' ')
        .trim();
    }
    
    if (extractedText.length < 10) {
      throw new Error('Could not extract sufficient text from DOCX file');
    }
    
    console.log(`Fallback extraction successful: ${extractedText.length} characters`);
    return extractedText.trim();
  } catch (error) {
    console.error('Fallback DOCX parsing error:', error);
    throw new Error(`DOCX fallback parsing failed: ${error.message}`);
  }
}

async function parseXlsxContent(fileData: Blob): Promise<string> {
  try {
    console.log('Parsing XLSX content');
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Extract shared strings for text values
    const sharedStringsFile = zip.file('xl/sharedStrings.xml');
    let sharedStrings: string[] = [];
    
    if (sharedStringsFile) {
      console.log('Loading shared strings');
      const sharedStringsXml = await sharedStringsFile.async('text');
      const stringMatches = sharedStringsXml.match(/<t[^>]*>([^<]*)<\/t>/g) || [];
      sharedStrings = stringMatches.map(match => {
        const textMatch = match.match(/<t[^>]*>([^<]*)<\/t>/);
        return textMatch ? textMatch[1] : '';
      });
      console.log(`Found ${sharedStrings.length} shared strings`);
    }
    
    // Try to extract data from multiple worksheets
    const worksheetFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('xl/worksheets/') && fileName.endsWith('.xml')
    );
    
    console.log(`Found ${worksheetFiles.length} worksheet(s)`);
    
    const allCellValues: string[] = [];
    
    for (const worksheetFileName of worksheetFiles) {
      const worksheetFile = zip.file(worksheetFileName);
      if (!worksheetFile) continue;
      
      console.log(`Processing ${worksheetFileName}`);
      const worksheetXml = await worksheetFile.async('text');
      const cellMatches = worksheetXml.match(/<c[^>]*>.*?<\/c>/g) || [];
      
      cellMatches.forEach(cell => {
        // Check if cell contains shared string reference
        if (cell.includes('t="s"')) {
          const valueMatch = cell.match(/<v>(\d+)<\/v>/);
          if (valueMatch) {
            const stringIndex = parseInt(valueMatch[1]);
            if (sharedStrings[stringIndex]) {
              allCellValues.push(sharedStrings[stringIndex]);
            }
          }
        } else if (cell.includes('<v>')) {
          // Direct value (number or inline string)
          const valueMatch = cell.match(/<v>([^<]+)<\/v>/);
          if (valueMatch) {
            const value = valueMatch[1];
            // Only include if it contains text or is a meaningful number
            if (isNaN(Number(value)) || value.length > 3) {
              allCellValues.push(value);
            }
          }
        }
        
        // Also check for inline strings
        const inlineStringMatch = cell.match(/<is><t[^>]*>([^<]*)<\/t><\/is>/);
        if (inlineStringMatch) {
          allCellValues.push(inlineStringMatch[1]);
        }
      });
    }
    
    const extractedText = allCellValues
      .filter(value => value && value.trim().length > 0)
      .join(', ');
    
    if (extractedText.length < 10) {
      throw new Error('Could not extract sufficient data from XLSX file');
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from XLSX`);
    return `Spreadsheet content: ${extractedText}`;
  } catch (error) {
    console.error('XLSX parsing error:', error);
    throw new Error(`XLSX parsing failed: ${error.message}`);
  }
}

async function parsePptxContent(fileData: Blob): Promise<string> {
  try {
    console.log('Parsing PPTX content');
    const arrayBuffer = await fileData.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const slideTexts: string[] = [];
    
    // Find all slide files
    const slideFiles = Object.keys(zip.files).filter(fileName => 
      fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
    );
    
    console.log(`Found ${slideFiles.length} slide(s)`);
    
    for (const slideFileName of slideFiles) {
      const slideFile = zip.file(slideFileName);
      if (slideFile) {
        console.log(`Processing ${slideFileName}`);
        const slideXml = await slideFile.async('text');
        
        // Extract text from multiple PowerPoint text element patterns
        const textPatterns = [
          /<a:t[^>]*>([^<]*)<\/a:t>/g,  // Standard text elements
          /<p:txBody[^>]*>.*?<a:t[^>]*>([^<]*)<\/a:t>.*?<\/p:txBody>/gs,  // Text bodies
          /<p:ph[^>]*>.*?<a:t[^>]*>([^<]*)<\/a:t>.*?<\/p:ph>/gs  // Placeholders
        ];
        
        const slideTextParts: string[] = [];
        
        for (const pattern of textPatterns) {
          const matches = slideXml.match(pattern) || [];
          matches.forEach(element => {
            const match = element.match(/<a:t[^>]*>([^<]*)<\/a:t>/);
            if (match && match[1].trim()) {
              slideTextParts.push(match[1].trim());
            }
          });
        }
        
        if (slideTextParts.length > 0) {
          const slideText = slideTextParts.join(' ').trim();
          if (slideText) {
            slideTexts.push(`Slide ${slideTexts.length + 1}: ${slideText}`);
          }
        }
      }
    }
    
    const extractedText = slideTexts.join('\n\n').trim();
    
    if (extractedText.length < 10) {
      throw new Error('Could not extract sufficient text from PPTX file');
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from PPTX`);
    return extractedText;
  } catch (error) {
    console.error('PPTX parsing error:', error);
    throw new Error(`PPTX parsing failed: ${error.message}`);
  }
}

// Legacy Office document parsing
async function parseLegacyOffice(fileData: Blob, fileType: string): Promise<string> {
  // Legacy formats are complex binary formats - this is a basic approach
  const arrayBuffer = await fileData.arrayBuffer();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer);
  
  // Extract readable text patterns
  const readableText = text.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'-]{10,}/g)?.join(' ') || '';
  
  if (readableText.length < 20) {
    throw new Error('Could not extract sufficient text from legacy Office document. Please convert to modern format (DOCX, XLSX, PPTX) for better parsing.');
  }
  
  return readableText;
}

// Image OCR parsing (placeholder)
async function parseImageWithOCR(fileData: Blob): Promise<string> {
  // In a real implementation, you'd use an OCR service like Tesseract.js or cloud OCR
  throw new Error('OCR processing not yet implemented. Please convert image content to text manually or use a document format.');
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
  if (wordCount < 3) {
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

  let requestData: any = null;
  
  try {
    requestData = await req.json();
    const { entryId, filePath } = requestData;
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
    if (requestData?.entryId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await updateParsingStatus(supabase, requestData.entryId, 'failed', 0, error.message);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
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