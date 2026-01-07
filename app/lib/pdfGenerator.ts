import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const generateTicketPDF = async (ticketElement: HTMLElement, ticketData: { ticket_number: any }) => {
  const canvas = await html2canvas(ticketElement, {
    scale: 2,
    useCORS: true,
    logging: false,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  
  // Add metadata
  pdf.setProperties({
    title: `E-Ticket ${ticketData.ticket_number}`,
    subject: 'TripGo E-Ticket',
    author: 'TripGo',
    keywords: 'ticket, boarding pass, travel',
    creator: 'TripGo System',
  })

  return pdf
}

export const downloadPDF = (pdf: { save: (arg0: string) => void }, filename: any) => {
  pdf.save(`${filename}.pdf`)
}

export const getPDFBlob = (pdf: { output: (arg0: string) => any }) => {
  return pdf.output('blob')
}