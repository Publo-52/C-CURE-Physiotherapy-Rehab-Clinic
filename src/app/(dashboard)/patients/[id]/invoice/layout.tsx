/**
 * Invoice Layout — wraps only the invoice route.
 * On screen: renders normally inside the dashboard shell (sidebar/header come
 *            from the parent (dashboard)/layout.tsx).
 * On print:  hides EVERY element on the page except the invoice itself via the
 *            global `print-invoice-only` body class that we apply below.
 */
export default function InvoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        Inject global print CSS:
        1. @page  — removes browser-added URL / date lines and page margins
        2. body * — hides everything
        3. .invoice-print-root and its descendants — shown back
      */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 15mm;
          }

          /* Hide sidebar, header, and action buttons */
          header,
          div[class*="w-64"],
          .print\\:hidden {
            display: none !important;
          }

          /* Reset outermost dashboard shell constraints to allow full height printing */
          html,
          body,
          body > div,
          body > div > div,
          main {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: block !important;
            position: relative !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }

          /* Ensure content is positioned correctly in normal document flow */
          .invoice-print-root {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .invoice-document {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          /* Ensure all backgrounds and text colors print properly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Prevent page breaks inside critical sections */
          .invoice-document {
            page-break-inside: auto;
          }
          .invoice-document section,
          .invoice-document > div {
            page-break-inside: avoid;
          }
        }
      `}</style>
      {children}
    </>
  )
}
