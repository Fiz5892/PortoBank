import { createRoot } from 'react-dom/client';
import { CVPreview } from '@/components/onboarding/CVPreview';
import { OnboardingData } from '@/types/onboarding';

export const downloadCV = async (data: OnboardingData): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. Create a hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px'; // desktop width
    document.body.appendChild(container);

    // 2. Render CVPreview
    const root = createRoot(container);
    root.render(<CVPreview data={data} />);

    // Wait for React to render and images to load (if any)
    setTimeout(async () => {
      try {
        // 3. Find the inner CV div to capture
        // It has aspect-[8.5/11] class in CVPreview
        const cvElement = container.querySelector('.aspect-\\[8\\.5\\/11\\]') as HTMLElement;
        
        if (!cvElement) {
          throw new Error("CV element not found");
        }

        const { jsPDF } = await import('jspdf');
        const html2canvas = await import('html2canvas').then(m => m.default);
        
        const canvas = await html2canvas(cvElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297; // A4 height

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= 297;
        }

        pdf.save(`${data.profile.full_name || 'CV'}.pdf`);
        resolve();
      } catch (err) {
        console.error("Failed to generate PDF", err);
        reject(err);
      } finally {
        root.unmount();
        document.body.removeChild(container);
      }
    }, 1000); // 1s wait for render and images
  });
};
