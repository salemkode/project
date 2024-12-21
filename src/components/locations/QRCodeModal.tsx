import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer } from 'lucide-react';

interface QRCodeModalProps {
  locationId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ locationId, locationName, isOpen, onClose }: QRCodeModalProps) {
  if (!isOpen) return null;

  const qrUrl = `${window.location.origin}/location/${locationId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${locationName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 1rem;
            }
            p {
              color: #4b5563;
              margin-bottom: 2rem;
            }
            .qr-code {
              margin-bottom: 2rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${locationName}</h1>
            <p>Scan to get your number</p>
            <div class="qr-code">
              ${document.getElementById('qr-code-svg')?.outerHTML}
            </div>
            <p>${qrUrl}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-col items-center space-y-4">
          <div id="qr-wrapper">
            <QRCodeSVG
              id="qr-code-svg"
              value={qrUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Scan this code to get a number at {locationName}
          </p>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print QR Code
          </button>
        </div>
      </div>
    </div>
  );
} 