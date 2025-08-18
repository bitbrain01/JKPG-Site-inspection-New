import { ACCENT_COLOR } from '../constants';
import { SectionData, SelectedAnswers, Comments, Photos } from '../types';

declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
    html2canvas: any;
  }
}

interface PdfGeneratorData {
  locationName: string;
  inspectorName: string;
  inspectionDate: string;
  liveScore: number;
  totalPossibleScore: number;
  sections: SectionData[];
  answers: SelectedAnswers;
  comments: Comments;
  photos: Photos;
  pumpComplianceImage?: string | null;
}

class PdfBuilder {
  private doc: any;
  private y: number;
  private pageHeight: number;
  private readonly margin = 40;
  private readonly contentWidth: number;

  constructor() {
    // Ensure jsPDF is available
    if (typeof window.jspdf?.jsPDF === 'undefined') {
        throw new Error('jsPDF library is not loaded. Please check your internet connection and try again.');
    }
    const jsPDF = window.jspdf.jsPDF;
    this.doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.doc.internal.pageSize.getWidth() - 2 * this.margin;
    this.y = 0; // Initial y position
  }
  
  private addPageIfNecessary(spaceNeeded: number) {
    if (this.y + spaceNeeded > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  addHeader(locationName: string, inspectorName: string, inspectionDate: string, liveScore: number, totalPossibleScore: number) {
    this.y = this.margin;
    
    // Main Title
    this.doc.setFontSize(20);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(ACCENT_COLOR);
    this.doc.text(`Site Inspection Report`, this.doc.internal.pageSize.getWidth() / 2, this.y, { align: 'center' });
    this.y += 25;
    
    // Location
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'normal');
    this.doc.setTextColor(50);
    this.doc.text(locationName, this.doc.internal.pageSize.getWidth() / 2, this.y, { align: 'center' });
    this.y += 20;

    // Inspector and Date
    this.doc.setFontSize(12);
    const inspectorText = `Inspector: ${inspectorName || 'N/A'}`;
    const dateText = `Date: ${inspectionDate}`;
    this.doc.text(inspectorText, this.margin, this.y);
    this.doc.text(dateText, this.doc.internal.pageSize.getWidth() - this.margin, this.y, { align: 'right' });
    this.y += 20;
    
    // Score
    const scoreText = `Final Score: ${liveScore} / ${totalPossibleScore}`;
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(scoreText, this.doc.internal.pageSize.getWidth() / 2, this.y, { align: 'center' });
    this.y += 30;
  }

  addPumpCompliance(imageData: string) {
    if (!imageData) return;

    this.addPageIfNecessary(40); // For title
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(ACCENT_COLOR);
    this.doc.text('Pump Compliance Status', this.margin, this.y);
    this.y += 5;
    this.doc.setDrawColor(ACCENT_COLOR);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 20;

    const imgProps = this.doc.getImageProperties(imageData);
    const imgWidth = this.contentWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    this.addPageIfNecessary(imgHeight + 20);
    try {
        this.doc.addImage(imageData, 'PNG', this.margin, this.y, imgWidth, imgHeight, undefined, 'FAST');
        this.y += imgHeight + 20;
    } catch (e) {
        console.error("Failed to add pump compliance image to PDF:", e);
        this.doc.setTextColor(255, 0, 0);
        this.doc.text("Failed to render pump compliance graphic.", this.margin, this.y);
        this.y += 20;
    }
  }
  
  addSection(sectionData: SectionData, answers: SelectedAnswers, comments: Comments, photos: Photos) {
    this.addPageIfNecessary(40);
    this.y += 10;
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.setTextColor(ACCENT_COLOR);
    this.doc.text(sectionData.title, this.margin, this.y);
    this.y += 5;
    this.doc.setDrawColor(ACCENT_COLOR);
    this.doc.line(this.margin, this.y, this.margin + this.contentWidth, this.y);
    this.y += 20;

    for (const question of sectionData.questions) {
      const answerText = answers[question.id];
      if (!answerText) continue; // Skip unanswered questions

      const commentText = comments[question.id];
      const photoArray = photos[question.id];

      // Check height for entire block
      let blockHeight = 30; // Min height for question + answer
      if (commentText) blockHeight += 30;
      if (photoArray) blockHeight += 80 * Math.ceil(photoArray.length / 3);
      this.addPageIfNecessary(blockHeight);
      
      // Question ID and Text
      this.doc.setFontSize(11);
      this.doc.setFont(undefined, 'bold');
      this.doc.setTextColor(30);
      const questionLines = this.doc.splitTextToSize(`${question.id}: ${question.text}`, this.contentWidth);
      this.doc.text(questionLines, this.margin, this.y);
      this.y += questionLines.length * 12 + 5;
      
      // Answer
      this.doc.setFontSize(10);
      this.doc.setFont(undefined, 'normal');
      this.doc.setTextColor(80);
      const selectedOption = question.options.find(opt => opt.text === answerText);
      const points = selectedOption ? selectedOption.points : '-';
      const answerLines = this.doc.splitTextToSize(`Answer: ${answerText} (${points} pts)`, this.contentWidth);
      this.doc.text(answerLines, this.margin + 10, this.y);
      this.y += answerLines.length * 10 + 10;

      // Comment
      if (commentText) {
        this.addPageIfNecessary(30 + (commentText.length / 80) * 10);
        this.doc.setFont(undefined, 'italic');
        this.doc.setTextColor(100);
        const commentLines = this.doc.splitTextToSize(`Comment: ${commentText}`, this.contentWidth - 10);
        this.doc.text(commentLines, this.margin + 10, this.y);
        this.y += commentLines.length * 10 + 10;
      }

      // Photos
      if (photoArray && photoArray.length > 0) {
        this.y += 5;
        const photoSize = (this.contentWidth - 20) / 3; // 3 photos per row with small gap
        
        photoArray.forEach((photoDataUrl, index) => {
          const i = index % 3;
          if (i === 0) {
            this.addPageIfNecessary(photoSize + 10);
          }
          const x = this.margin + (i * (photoSize + 10));
          
          try {
            this.doc.addImage(photoDataUrl, 'PNG', x, this.y, photoSize, photoSize, undefined, 'FAST');
          } catch(e) {
            console.error("Failed to add image to PDF:", e);
            this.doc.setFont(undefined, 'normal');
            this.doc.setTextColor(255, 0, 0);
            this.doc.text("Image failed to load", x + 5, this.y + photoSize / 2);
          }
          
          if (i === 2 || index === photoArray.length - 1) {
            this.y += photoSize + 10;
          }
        });
      }
      this.y += 15; // Space between questions
    }
  }

  save(locationName: string) {
    const safeFileName = `site-inspection-${locationName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    this.doc.save(safeFileName);
  }
}


export const generatePdf = async (data: PdfGeneratorData): Promise<void> => {
  const builder = new PdfBuilder();
  
  builder.addHeader(data.locationName, data.inspectorName, data.inspectionDate, data.liveScore, data.totalPossibleScore);

  if (data.pumpComplianceImage) {
    builder.addPumpCompliance(data.pumpComplianceImage);
  }

  for (const section of data.sections) {
    builder.addSection(section, data.answers, data.comments, data.photos);
  }

  builder.save(data.locationName);
};