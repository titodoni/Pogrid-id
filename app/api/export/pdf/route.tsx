import { renderToStream } from '@react-pdf/renderer';
import { ReportDocument } from '@/components/dashboard/PdfExport';
import { getDashboardKPIs } from '@/lib/dashboard';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await getDashboardKPIs();
  const stream = await renderToStream(<ReportDocument data={data} />);

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="report.pdf"',
    },
  });
}
