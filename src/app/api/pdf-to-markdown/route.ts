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
    const pages: { pageNumber: number; markdown: string }[] = [];

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
                  text: 'Convert this document page to clean Markdown format. Preserve headings, lists, tables, and formatting. Output only the Markdown content, no explanations.',
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

        const markdown = response.choices?.[0]?.message?.content || '';
        pages.push({ pageNumber, markdown });
      } catch (pageError) {
        const errorMessage =
          pageError instanceof Error
            ? pageError.message
            : 'Failed to process page';
        pages.push({
          pageNumber,
          markdown: `> **Error processing page ${pageNumber}:** ${errorMessage}`,
        });
      }
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('PDF to Markdown API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error during PDF to Markdown conversion',
      },
      { status: 500 }
    );
  }
}
