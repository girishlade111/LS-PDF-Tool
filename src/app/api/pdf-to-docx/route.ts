import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, pageNumbers } = body as {
      images: string[];
      pageNumbers: number[];
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (!pageNumbers || !Array.isArray(pageNumbers) || pageNumbers.length !== images.length) {
      return NextResponse.json(
        { error: 'Page numbers must match images array length' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const pages: { pageNumber: number; content: string }[] = [];

    // Process pages sequentially to avoid overloading the AI service
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      const pageNumber = pageNumbers[i];

      try {
        const response = await zai.chat.completions.createVision({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all content from this PDF page for conversion to a Word document. Preserve the exact structure:\n- Use # for main headings, ## for subheadings, ### for sub-subheadings\n- Use - for bullet points and 1. 2. 3. for numbered lists\n- Use **bold** and *italic* for emphasis\n- For tables, use pipe-separated format: | Column 1 | Column 2 | Column 3 |\n- Separate paragraphs with blank lines\n- Preserve any footnotes, captions, or annotations\nOutput the structured content directly with no explanations or preamble.',
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          thinking: { type: 'disabled' },
        });

        const content = response.choices?.[0]?.message?.content || '';
        pages.push({ pageNumber, content });
      } catch (pageError) {
        const errorMessage =
          pageError instanceof Error
            ? pageError.message
            : 'Failed to process page';
        pages.push({
          pageNumber,
          content: `> **Error processing page ${pageNumber}:** ${errorMessage}`,
        });
      }
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('PDF to DOCX API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error during PDF to DOCX conversion',
      },
      { status: 500 }
    );
  }
}
