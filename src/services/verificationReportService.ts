/**
 * Verification Report Service - Generate and export verification reports
 */

import { EnhancedVerificationResponse, VerifiablePresentation } from '@/types/presentations';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable
declare module 'jspdf' {
	interface jsPDF {
		autoTable: (options: any) => jsPDF;
	}
}

// Report export options
export interface ReportExportOptions {
	format?: 'pdf' | 'json' | 'html';
	includeCredentialDetails?: boolean;
	includePresentation?: boolean;
	fileName?: string;
}

// Default options
export const defaultOptions: ReportExportOptions = {
	format: 'pdf',
	includeCredentialDetails: true,
	includePresentation: false,
	fileName: 'verification-report'
};

export class VerificationReportService {
	/**
	 * Generate and export a verification report
	 * @param result - Verification result
	 * @param presentation - Verifiable presentation
	 * @param options - Export options
	 * @returns Promise that resolves when export is complete
	 */
	async exportReport(
		result: EnhancedVerificationResponse,
		presentation: VerifiablePresentation,
		options?: Partial<ReportExportOptions>
	): Promise<boolean> {
		const mergedOptions = { ...defaultOptions, ...options };

		try {
			switch (mergedOptions.format) {
				case 'pdf':
					return await this.exportPdf(result, presentation, mergedOptions);
				case 'json':
					return this.exportJson(result, presentation, mergedOptions);
				case 'html':
					return await this.exportHtml(result, presentation, mergedOptions);
				default:
					console.error('Unsupported report format');
					return false;
			}
		} catch (error) {
			console.error('Error generating report:', error);
			return false;
		}
	}

	/**
	 * Export verification report as PDF
	 * @param result - Verification result
	 * @param presentation - Verifiable presentation
	 * @param options - Export options
	 * @returns Promise that resolves to true if export is successful
	 */
	private async exportPdf(
		result: EnhancedVerificationResponse,
		presentation: VerifiablePresentation,
		options: ReportExportOptions
	): Promise<boolean> {
		try {
			// Create PDF document
			const doc = new jsPDF();
			const fileName = `${options.fileName || 'verification-report'}.pdf`;

			// Add title
			doc.setFontSize(20);
			doc.text('Verification Report', 105, 15, { align: 'center' });

			// Add timestamp
			doc.setFontSize(10);
			doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 22, { align: 'center' });

			// Add verification summary
			doc.setFontSize(14);
			doc.text('Verification Summary', 14, 35);

			// Add verification status
			const statusColor = result.valid ? [0, 128, 0] : [255, 0, 0]; // Green or Red
			doc.setFontSize(12);
			doc.setTextColor(...statusColor);
			doc.text(`Status: ${result.valid ? 'VALID' : 'INVALID'}`, 14, 45);
			doc.setTextColor(0, 0, 0); // Reset to black

			// Add trust score
			if (result.trustScore !== undefined) {
				doc.text(`Trust Score: ${result.trustScore}/100`, 14, 52);
			}

			// Add verification time
			doc.text(`Verified At: ${new Date(result.verifiedAt).toLocaleString()}`, 14, 59);

			// Add presentation information
			doc.setFontSize(14);
			doc.text('Presentation Information', 14, 70);
			doc.setFontSize(12);
			doc.text(`ID: ${presentation.id}`, 14, 80);
			doc.text(`Holder: ${presentation.holder}`, 14, 87);
			doc.text(`Credentials: ${presentation.verifiableCredential.length}`, 14, 94);
			doc.text(`Type: ${presentation.type.join(', ')}`, 14, 101);

			// Add verification result details
			doc.setFontSize(14);
			doc.text('Verification Details', 14, 115);

			// Create verification details table
			if (result.presentationResults) {
				const tableData = [
					['Check', 'Status'],
					['Signature Verification', result.presentationResults.signatureValid ? 'Passed' : 'Failed'],
					['Proof Validation', result.presentationResults.proofValid ? 'Passed' : 'Failed'],
					['Challenge Verification', result.presentationResults.challengeValid ? 'Passed' : 'Failed'],
					['Domain Verification', result.presentationResults.domainValid ? 'Passed' : 'Failed'],
					['Holder Verification', result.presentationResults.holderVerified ? 'Passed' : 'Failed']
				];

				doc.autoTable({
					startY: 120,
					head: [tableData[0]],
					body: tableData.slice(1),
					theme: 'striped',
					headStyles: { fillColor: [66, 139, 202] }
				});
			}

			// Add credential details if requested
			if (options.includeCredentialDetails && result.credentialResults && result.credentialResults.length > 0) {
				// Start on a new page if needed
				if (doc.lastAutoTable && doc.lastAutoTable.finalY > 220) {
					doc.addPage();
				} else {
					doc.text('Credential Details', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 160);
				}

				// Create credential details table
				const credentialTableData: any[] = [['#', 'Credential ID', 'Status', 'Issues']];

				result.credentialResults.forEach((credential, index) => {
					const issues: string[] = [];

					if (credential.errors && credential.errors.length > 0) {
						issues.push(...credential.errors);
					}
					if (credential.warnings && credential.warnings.length > 0) {
						issues.push(...credential.warnings);
					}

					credentialTableData.push([
						index + 1,
						credential.credentialID.substring(0, 30) + (credential.credentialID.length > 30 ? '...' : ''),
						credential.valid ? 'Valid' : 'Invalid',
						issues.length > 0 ? issues.join(', ').substring(0, 40) + (issues.join(', ').length > 40 ? '...' : '') : 'None'
					]);
				});

				doc.autoTable({
					startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 165,
					head: [credentialTableData[0]],
					body: credentialTableData.slice(1),
					theme: 'striped',
					headStyles: { fillColor: [66, 139, 202] }
				});
			}

			// Add warnings if any
			if (result.warnings && result.warnings.length > 0) {
				// Start on a new page if needed
				if (doc.lastAutoTable && doc.lastAutoTable.finalY > 220) {
					doc.addPage();
				}

				doc.setFontSize(14);
				doc.setTextColor(255, 165, 0); // Orange
				doc.text('Warnings', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 180);
				doc.setTextColor(0, 0, 0); // Reset to black
				doc.setFontSize(12);

				result.warnings.forEach((warning, index) => {
					doc.text(`${index + 1}. ${warning}`, 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 + (index * 7) : 190 + (index * 7));
				});
			}

			// Add errors if any
			if (result.errors && result.errors.length > 0) {
				// Start on a new page if needed
				const startY = doc.lastAutoTable ?
					doc.lastAutoTable.finalY + (result.warnings && result.warnings.length > 0 ? 20 + (result.warnings.length * 7) : 15) :
					(result.warnings && result.warnings.length > 0 ? 190 + (result.warnings.length * 7) : 200);

				if (startY > 250) {
					doc.addPage();
				}

				doc.setFontSize(14);
				doc.setTextColor(255, 0, 0); // Red
				doc.text('Errors', 14, startY > 250 ? 20 : startY);
				doc.setTextColor(0, 0, 0); // Reset to black
				doc.setFontSize(12);

				result.errors.forEach((error, index) => {
					doc.text(`${index + 1}. ${error}`, 14, startY > 250 ? 30 + (index * 7) : startY + 10 + (index * 7));
				});
			}

			// Include full presentation JSON if requested
			if (options.includePresentation) {
				doc.addPage();
				doc.setFontSize(14);
				doc.text('Full Presentation Data', 14, 20);
				doc.setFontSize(10);

				const presentationJson = JSON.stringify(presentation, null, 2);
				const textLines = doc.splitTextToSize(presentationJson, 180);

				// Only include first 300 lines to avoid huge PDFs
				const maxLines = Math.min(textLines.length, 300);
				doc.text(textLines.slice(0, maxLines), 14, 30);

				if (textLines.length > maxLines) {
					doc.text('(Output truncated due to size...)', 14, 30 + (maxLines * 5));
				}
			}

			// Add footer
			const pageCount = doc.internal.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				doc.setPage(i);
				doc.setFontSize(8);
				doc.text(`Auth3 Verification System - Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
			}

			// Save the PDF
			doc.save(fileName);
			return true;
		} catch (error) {
			console.error('Error generating PDF report:', error);
			return false;
		}
	}

	/**
	 * Export verification report as JSON
	 * @param result - Verification result
	 * @param presentation - Verifiable presentation
	 * @param options - Export options
	 * @returns True if export is successful
	 */
	private exportJson(
		result: EnhancedVerificationResponse,
		presentation: VerifiablePresentation,
		options: ReportExportOptions
	): boolean {
		try {
			const fileName = `${options.fileName || 'verification-report'}.json`;

			// Create report object
			const report = {
				result: {
					...result,
					// Optionally exclude credential details
					credentialResults: options.includeCredentialDetails ? result.credentialResults : undefined
				},
				// Optionally include presentation
				presentation: options.includePresentation ? presentation : undefined,
				metadata: {
					generatedAt: new Date().toISOString(),
					generator: 'Auth3 Verification System'
				}
			};

			// Create and download the JSON file
			const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
			this.downloadBlob(blob, fileName);

			return true;
		} catch (error) {
			console.error('Error generating JSON report:', error);
			return false;
		}
	}

	/**
	 * Export verification report as HTML
	 * @param result - Verification result
	 * @param presentation - Verifiable presentation
	 * @param options - Export options
	 * @returns Promise that resolves to true if export is successful
	 */
	private async exportHtml(
		result: EnhancedVerificationResponse,
		presentation: VerifiablePresentation,
		options: ReportExportOptions
	): Promise<boolean> {
		try {
			const fileName = `${options.fileName || 'verification-report'}.html`;

			// Create HTML content
			let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .status-valid { color: green; font-weight: bold; }
            .status-invalid { color: red; font-weight: bold; }
            .warning { color: orange; }
            .error { color: red; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            .trust-score { display: flex; align-items: center; margin: 10px 0; }
            .trust-score-bar { height: 20px; background-color: #eee; flex-grow: 1; margin: 0 10px; border-radius: 10px; overflow: hidden; }
            .trust-score-fill { height: 100%; background-color: green; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Verification Report</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h2>Verification Summary</h2>
            <p>Status: <span class="${result.valid ? 'status-valid' : 'status-invalid'}">${result.valid ? 'VALID' : 'INVALID'}</span></p>
      `;

			// Add trust score if available
			if (result.trustScore !== undefined) {
				const scoreColor = result.trustScore >= 80 ? 'green' : (result.trustScore >= 60 ? 'orange' : 'red');

				html += `
            <div class="trust-score">
              <p>Trust Score: ${result.trustScore}/100</p>
              <div class="trust-score-bar">
                <div class="trust-score-fill" style="width: ${result.trustScore}%; background-color: ${scoreColor};"></div>
              </div>
            </div>
        `;
			}

			html += `
            <p>Verified At: ${new Date(result.verifiedAt).toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h2>Presentation Information</h2>
            <table>
              <tr><td><strong>ID</strong></td><td>${presentation.id}</td></tr>
              <tr><td><strong>Holder</strong></td><td>${presentation.holder}</td></tr>
              <tr><td><strong>Credentials</strong></td><td>${presentation.verifiableCredential.length}</td></tr>
              <tr><td><strong>Type</strong></td><td>${presentation.type.join(', ')}</td></tr>
            </table>
          </div>
      `;

			// Add verification details
			if (result.presentationResults) {
				html += `
          <div class="section">
            <h2>Verification Details</h2>
            <table>
              <tr>
                <th>Check</th>
                <th>Status</th>
              </tr>
              <tr>
                <td>Signature Verification</td>
                <td>${result.presentationResults.signatureValid ? '✓ Passed' : '✗ Failed'}</td>
              </tr>
              <tr>
                <td>Proof Validation</td>
                <td>${result.presentationResults.proofValid ? '✓ Passed' : '✗ Failed'}</td>
              </tr>
              <tr>
                <td>Challenge Verification</td>
                <td>${result.presentationResults.challengeValid ? '✓ Passed' : '✗ Failed'}</td>
              </tr>
              <tr>
                <td>Domain Verification</td>
                <td>${result.presentationResults.domainValid ? '✓ Passed' : '✗ Failed'}</td>
              </tr>
              <tr>
                <td>Holder Verification</td>
                <td>${result.presentationResults.holderVerified ? '✓ Passed' : '✗ Failed'}</td>
              </tr>
            </table>
          </div>
        `;
			}

			// Add credential details if requested
			if (options.includeCredentialDetails && result.credentialResults && result.credentialResults.length > 0) {
				html += `
          <div class="section">
            <h2>Credential Details</h2>
            <table>
              <tr>
                <th>#</th>
                <th>Credential ID</th>
                <th>Status</th>
                <th>Issues</th>
              </tr>
        `;

				result.credentialResults.forEach((credential, index) => {
					const issues: string[] = [];

					if (credential.errors && credential.errors.length > 0) {
						issues.push(...credential.errors);
					}
					if (credential.warnings && credential.warnings.length > 0) {
						issues.push(...credential.warnings);
					}

					html += `
              <tr>
                <td>${index + 1}</td>
                <td>${credential.credentialID}</td>
                <td>${credential.valid ? '✓ Valid' : '✗ Invalid'}</td>
                <td>${issues.length > 0 ? issues.join('<br>') : 'None'}</td>
              </tr>
          `;
				});

				html += `
            </table>
          </div>
        `;
			}

			// Add warnings if any
			if (result.warnings && result.warnings.length > 0) {
				html += `
          <div class="section">
            <h2 class="warning">Warnings</h2>
            <ul>
        `;

				result.warnings.forEach(warning => {
					html += `<li class="warning">${warning}</li>`;
				});

				html += `
            </ul>
          </div>
        `;
			}

			// Add errors if any
			if (result.errors && result.errors.length > 0) {
				html += `
          <div class="section">
            <h2 class="error">Errors</h2>
            <ul>
        `;

				result.errors.forEach(error => {
					html += `<li class="error">${error}</li>`;
				});

				html += `
            </ul>
          </div>
        `;
			}

			// Include full presentation JSON if requested
			if (options.includePresentation) {
				html += `
          <div class="section">
            <h2>Full Presentation Data</h2>
            <pre style="background-color: #f5f5f5; padding: 15px; overflow: auto; max-height: 400px;">${JSON.stringify(presentation, null, 2)}</pre>
          </div>
        `;
			}

			// Add footer
			html += `
          <div class="footer">
            <p>Generated by Auth3 Verification System</p>
          </div>
        </body>
        </html>
      `;

			// Create and download the HTML file
			const blob = new Blob([html], { type: 'text/html' });
			this.downloadBlob(blob, fileName);

			return true;
		} catch (error) {
			console.error('Error generating HTML report:', error);
			return false;
		}
	}

	/**
	 * Helper function to download a blob as a file
	 * @param blob - Blob to download
	 * @param fileName - Name of the file to download
	 */
	private downloadBlob(blob: Blob, fileName: string): void {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = fileName;
		link.style.display = 'none';

		document.body.appendChild(link);
		link.click();

		setTimeout(() => {
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}, 100);
	}
}

// Create singleton instance
const verificationReportService = new VerificationReportService();

export default verificationReportService;
