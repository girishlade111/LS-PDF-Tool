import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

type SummaryType = 'brief' | 'detailed' | 'key-points';

const prompts: Record<SummaryType, string> = {
  brief:
    'Provide a brief 2-3 sentence summary of this document page. Focus on the main topic and key takeaway.',
  detailed:
    'Provide a detailed summary of this document page. Include all important points, data, and conclusions. Maintain the structure of the original content.',
  'key-points':
    'Extract the key points from this document page as a numbered list. Focus on the most important information, data, and conclusions.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, pageNumbers, summaryType } = body as {
      images: string[];
      pageNumbers: number[];
      summaryType: SummaryType;
    };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (
      !pageNumbers ||
      !Array.isArray(pageNumbers) ||
      pageNumbers.length !== images.length
    ) {
      return NextResponse.json(
        { error: 'Page numbers must match images array length' },
        { status: 400 }
      );
    }

    const effectiveSummaryType: SummaryType =
      summaryType && prompts[summaryType] ? summaryType : 'brief';
    const prompt = prompts[effectiveSummaryType];

    const zai = await ZAI.create();
    const pageSummaries: { pageNumber: number; summary: string }[] = [];

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
                  text: prompt,
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

        const summary = response.choices?.[0]?.message?.content || '';
        pageSummaries.push({ pageNumber, summary });
      } catch (pageError) {
        const errorMessage =
          pageError instanceof Error
            ? pageError.message
            : 'Failed to process page';
        pageSummaries.push({
          pageNumber,
          summary: `[Error processing page ${pageNumber}: ${errorMessage}]`,
        });
      }
    }

    // Combine all page summaries into a cohesive document summary using LLM
    const combinedPageText = pageSummaries
      .map((p) => `Page ${p.pageNumber}:\n${p.summary}`)
      .join('\n\n');

    let summary = '';

    try {
      const summaryTypeLabel: Record<SummaryType, string> = {
        brief: 'brief (2-3 sentences)',
        detailed: 'detailed and comprehensive',
        'key-points': 'a numbered list of key points',
      };

      const combineResponse = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that creates cohesive document summaries from per-page summaries.',
          },
          {
            role: 'user',
            content: `I have the following per-page summaries of a document. Please create a ${summaryTypeLabel[effectiveSummaryType]} overall summary of the entire document. The summary should be cohesive and flow naturally, not just list each page separately.\n\n${combinedPageText}`,
          },
        ],
      });

      summary =
        combineResponse.choices?.[0]?.message?.content ||
        combinedPageText;
    } catch {
      // If the combination step fails, fall back to the per-page summaries joined
      summary = combinedPageText;
    }

    return NextResponse.json({ summary, pageSummaries });
  } catch (error) {
    console.error('Summarize PDF API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error during PDF summarization',
      },
      { status: 500 }
    );
  }
}
