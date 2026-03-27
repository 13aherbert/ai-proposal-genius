

## Add URL-Based RFP Input

### Problem
Some RFPs exist only as web pages with no downloadable documents. Users currently have no way to use a URL as the RFP source.

### Approach
Add a tab-based input switcher on the Upload RFP page: "Upload File" (existing) and "Paste URL" (new). When a URL is submitted, a new edge function scrapes the page content using Firecrawl, converts it to a text/markdown file, uploads it to Supabase Storage, and creates the project — identical to the file upload path from that point forward.

### Prerequisites
The workspace has a Firecrawl connection (`std_01kewyt9c0exhapy9v6va9tktn`) but it is **not linked** to this project. It needs to be connected first.

### Changes

#### 1. New component: `UrlInput.tsx`
- Card with a URL text input, a "Fetch & Create Project" button, and progress states
- Validates URL format client-side
- Shows fetching progress: "Scraping page..." → "Creating project..." → "Done"
- Same `disabled` prop as UploadDropzone for limit gating

#### 2. Update `UploadRFP.tsx`
- Add a Tabs component ("Upload File" | "Paste URL") wrapping the left column
- "Upload File" tab renders existing `UploadDropzone`
- "Paste URL" tab renders new `UrlInput`
- `UrlInput` calls `handleUrlSubmit` which invokes the new edge function, then sets `projectId`/`rfpFilePath`/`projectTitle` the same way file upload does

#### 3. Update `use-rfp-upload.ts`
- Add `handleUrlUpload(url: string, deadline?: Date)` method
- Calls `scrape-rfp-url` edge function
- Sets same state (projectId, projectTitle, rfpFilePath, uploadProgress)
- Returns same shape so automation can auto-start

#### 4. New edge function: `scrape-rfp-url`
- Accepts `{ url, userId, organizationId, deadline?, title? }`
- Uses Firecrawl API (`FIRECRAWL_API_KEY`) to scrape the URL as markdown
- Uploads the markdown content as a `.md` file to `rfp-files` storage bucket
- Creates a project row with `rfp_file_path` pointing to the uploaded file
- Returns `{ projectId, filePath, title, scrapedContent: { wordCount, title } }`
- Handles errors: invalid URL, scrape failure, empty content

#### 5. Connect Firecrawl
- Link the existing Firecrawl connection to this project so the edge function has access to `FIRECRAWL_API_KEY`

### Files to create/update
- `src/components/rfp/UrlInput.tsx` — new component
- `src/pages/UploadRFP.tsx` — add tabs, wire URL input
- `src/hooks/use-rfp-upload.ts` — add `handleUrlUpload`
- `supabase/functions/scrape-rfp-url/index.ts` — new edge function

### Expected result
Users can paste any URL, the system scrapes the page content, creates a project with the extracted text as the RFP source, and the existing auto-analysis pipeline kicks in automatically.

