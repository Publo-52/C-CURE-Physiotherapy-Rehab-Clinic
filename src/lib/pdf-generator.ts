import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function downloadPatientInvoicePDF(patient: any, profile?: any, visitsCount = 0) {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
  const { width, height } = page.getSize()

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const primaryBlue = rgb(0.01, 0.52, 0.78)
  const darkSlate = rgb(0.06, 0.09, 0.16)
  const textMuted = rgb(0.39, 0.45, 0.55)
  const lightBg = rgb(0.97, 0.98, 0.99)
  const greenText = rgb(0.09, 0.5, 0.24)
  const redText = rgb(0.86, 0.15, 0.15)

  const clinicName = profile?.clinicName || 'C-CURE PHYSIOTHERAPY & REHAB CLINIC'
  const practitionerName = profile?.practitionerName || 'Sanatan Manna'
  const phone = profile?.phone || '7942688985'
  const email = profile?.email || 'sanatan.manna28072015@gmail.com'
  const address = profile?.address || 'Moyna, Midnapore, West Bengal'

  let y = height - 40

  // 1. Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 75,
    width: width - 80,
    height: 75,
    color: primaryBlue,
  })

  page.drawText(clinicName.toUpperCase(), {
    x: 55,
    y: y - 28,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  })

  page.drawText(`${practitionerName} (Physiotherapist)`, {
    x: 55,
    y: y - 46,
    size: 10,
    font: helveticaBold,
    color: rgb(0.73, 0.9, 0.99),
  })

  page.drawText(`Ph: ${phone}`, {
    x: width - 180,
    y: y - 26,
    size: 9,
    font: helvetica,
    color: rgb(0.88, 0.95, 1),
  })
  page.drawText(`Email: ${email}`, {
    x: width - 180,
    y: y - 40,
    size: 8,
    font: helvetica,
    color: rgb(0.88, 0.95, 1),
  })
  page.drawText(address.length > 32 ? address.substring(0, 32) + '...' : address, {
    x: width - 180,
    y: y - 54,
    size: 8,
    font: helvetica,
    color: rgb(0.88, 0.95, 1),
  })

  y -= 75

  // 2. Invoice Meta Bar
  const invoiceNo = `INV-${patient.patientId}-${new Date().getFullYear()}`
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  page.drawRectangle({
    x: 40,
    y: y - 40,
    width: width - 80,
    height: 40,
    color: lightBg,
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  })

  page.drawText('INVOICE NUMBER', { x: 55, y: y - 16, size: 7, font: helveticaBold, color: textMuted })
  page.drawText(invoiceNo, { x: 55, y: y - 30, size: 10, font: helveticaBold, color: darkSlate })

  page.drawText('DATE ISSUED', { x: width - 160, y: y - 16, size: 7, font: helveticaBold, color: textMuted })
  page.drawText(dateStr, { x: width - 160, y: y - 30, size: 10, font: helveticaBold, color: darkSlate })

  y -= 55

  // 3. Patient Details + Health Summary Grid
  const cardW = (width - 95) / 2

  // Patient Card
  page.drawRectangle({
    x: 40,
    y: y - 100,
    width: cardW,
    height: 100,
    color: lightBg,
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  })

  page.drawText('PATIENT DETAILS', { x: 50, y: y - 16, size: 8, font: helveticaBold, color: primaryBlue })
  page.drawText(`Name: ${patient.name}`, { x: 50, y: y - 34, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Patient ID: ${patient.patientId}`, { x: 50, y: y - 48, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Phone: ${patient.phone || 'N/A'}`, { x: 50, y: y - 62, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Age/Gender: ${patient.age ? `${patient.age} Yrs` : ''} ${patient.gender || ''}`, { x: 50, y: y - 76, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Status: ${patient.status}`, { x: 50, y: y - 90, size: 9, font: helveticaBold, color: primaryBlue })

  // Health Summary Card
  page.drawRectangle({
    x: 40 + cardW + 15,
    y: y - 100,
    width: cardW,
    height: 100,
    color: lightBg,
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  })

  page.drawText('HEALTH SUMMARY', { x: 40 + cardW + 25, y: y - 16, size: 8, font: helveticaBold, color: primaryBlue })
  page.drawText(`Condition: ${patient.disease || 'N/A'}`, { x: 40 + cardW + 25, y: y - 34, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Complaint: ${patient.chiefComplaint ? patient.chiefComplaint.substring(0, 28) : 'N/A'}`, { x: 40 + cardW + 25, y: y - 48, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Diagnosis: ${patient.diagnosis ? patient.diagnosis.substring(0, 28) : 'N/A'}`, { x: 40 + cardW + 25, y: y - 62, size: 9, font: helvetica, color: darkSlate })
  page.drawText(`Total Visits: ${visitsCount}`, { x: 40 + cardW + 25, y: y - 76, size: 9, font: helveticaBold, color: darkSlate })

  y -= 120

  // 4. Financial Summary
  const totalBilled = patient.payments ? patient.payments.reduce((s: number, p: any) => s + p.totalBill, 0) : 0
  const totalPaid   = patient.payments ? patient.payments.reduce((s: number, p: any) => s + p.amountPaidToday, 0) : 0
  const totalDue    = patient.payments && patient.payments.length > 0 ? patient.payments[0].remainingDue : 0

  page.drawRectangle({
    x: 40,
    y: y - 50,
    width: width - 80,
    height: 50,
    color: rgb(0.94, 0.99, 0.95),
    borderColor: rgb(0.73, 0.97, 0.82),
    borderWidth: 1,
  })

  page.drawText(`Total Billed: Rs. ${totalBilled.toLocaleString('en-IN')}`, { x: 55, y: y - 30, size: 10, font: helveticaBold, color: darkSlate })
  page.drawText(`Total Paid: Rs. ${totalPaid.toLocaleString('en-IN')}`, { x: 230, y: y - 30, size: 10, font: helveticaBold, color: greenText })
  page.drawText(`Remaining Due: Rs. ${totalDue.toLocaleString('en-IN')}`, { x: 400, y: y - 30, size: 10, font: helveticaBold, color: totalDue > 0 ? redText : greenText })

  y -= 70

  // 5. Payment History Table
  if (patient.payments && patient.payments.length > 0) {
    const tableHeaderH = 22
    const rowH = 20
    const paymentsCount = Math.min(patient.payments.length, 8)
    const tableH = tableHeaderH + paymentsCount * rowH

    page.drawRectangle({
      x: 40,
      y: y - tableH,
      width: width - 80,
      height: tableH,
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1,
    })

    // Header
    page.drawRectangle({
      x: 40,
      y: y - tableHeaderH,
      width: width - 80,
      height: tableHeaderH,
      color: rgb(0.94, 0.96, 0.98),
    })

    page.drawText('INVOICE #', { x: 50, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
    page.drawText('DATE', { x: 150, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
    page.drawText('MODE', { x: 250, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
    page.drawText('BILLED', { x: 320, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
    page.drawText('PAID', { x: 390, y: y - 15, size: 7, font: helveticaBold, color: textMuted })
    page.drawText('DUE', { x: 460, y: y - 15, size: 7, font: helveticaBold, color: textMuted })

    let currentY = y - tableHeaderH
    patient.payments.slice(0, 8).forEach((p: any) => {
      page.drawText(p.invoiceNumber, { x: 50, y: currentY - 14, size: 8, font: helveticaBold, color: darkSlate })
      page.drawText(new Date(p.paymentDate).toLocaleDateString('en-IN'), { x: 150, y: currentY - 14, size: 8, font: helvetica, color: darkSlate })
      page.drawText(p.paymentMode, { x: 250, y: currentY - 14, size: 8, font: helvetica, color: darkSlate })
      page.drawText(`Rs. ${p.totalBill}`, { x: 320, y: currentY - 14, size: 8, font: helvetica, color: darkSlate })
      page.drawText(`Rs. ${p.amountPaidToday}`, { x: 390, y: currentY - 14, size: 8, font: helveticaBold, color: greenText })
      page.drawText(`Rs. ${p.remainingDue}`, { x: 460, y: currentY - 14, size: 8, font: helveticaBold, color: p.remainingDue > 0 ? redText : greenText })

      currentY -= rowH
    })

    y -= (tableH + 30)
  }

  // 6. Footer & Signature
  page.drawLine({
    start: { x: 40, y: y },
    end: { x: width - 40, y: y },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  })

  page.drawText('• Thank you for visiting C-CURE Physiotherapy & Rehab Clinic.', { x: 40, y: y - 18, size: 8, font: helvetica, color: textMuted })
  page.drawText('• Official computer-generated patient invoice.', { x: 40, y: y - 30, size: 8, font: helvetica, color: textMuted })

  page.drawLine({
    start: { x: width - 180, y: y - 30 },
    end: { x: width - 40, y: y - 30 },
    thickness: 1,
    color: rgb(0.58, 0.64, 0.72),
  })
  page.drawText(practitionerName, { x: width - 145, y: y - 44, size: 10, font: helveticaBold, color: darkSlate })
  page.drawText('Physiotherapist', { x: width - 140, y: y - 56, size: 8, font: helvetica, color: textMuted })

  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice_${patient.patientId}_${patient.name.replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
