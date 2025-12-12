import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { QRCode } from 'react-qr-code';
import { Printer } from 'lucide-react';

/**
 * Komponen untuk print tiket nomor antrian dengan QR code
 * Optimized untuk thermal printer Epson TM-T88VI (80mm)
 * 
 * @param {Object} props
 * @param {Object} props.kunjungan - Data kunjungan pasien
 * @param {React.Ref} ref - Ref untuk trigger print dari parent component
 */
const PrintableTicket = forwardRef(({ kunjungan }, ref) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const printContentRef = useRef(null);

  // Expose generateHashAndPrint ke parent via ref
  useImperativeHandle(ref, () => ({
    click: generateHashAndPrint
  }));

  /**
   * Generate hash dari backend menggunakan endpoint existing
   * Menggunakan API /api/public/encode-antrian yang sudah ada
   */
  const generateHashAndPrint = async () => {
    if (!kunjungan?.nomor_antrian) {
      alert('Nomor antrian tidak tersedia');
      return;
    }

    setIsPrinting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Gunakan endpoint yang sama seperti di CekAntrian.jsx
      const response = await fetch(`${API_URL}/api/public/encode-antrian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nomor_antrian: kunjungan.nomor_antrian 
        })
      });

      if (!response.ok) {
        throw new Error('Gagal generate hash untuk QR code');
      }

      const { hash } = await response.json();
      
      // Generate full URL untuk QR code
      const fullUrl = `https://web.igdrsherminapasteur-test.app/status/${kunjungan.nomor_antrian}`;
      setQrUrl(fullUrl);

      // Delay untuk render QR, lalu print menggunakan iframe
      setTimeout(() => {
        printTicket();
        setIsPrinting(false);
      }, 500);

    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Gagal generate QR code. Silakan coba lagi.');
      setIsPrinting(false);
    }
  };

  /**
   * Print menggunakan iframe untuk menghindari duplikasi
   */
  const printTicket = () => {
    if (!printContentRef.current) return;

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk print.');
      return;
    }

    const content = printContentRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Tiket Antrian - ${kunjungan.nomor_antrian}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @page {
            size: 80mm auto;
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: monospace;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @media print {
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Auto print setelah load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  const getTriaseLabel = (triase) => {
    if (!triase) return '-';
    const triaseMap = {
      'resusitasi': 'RESUSITASI',
      'emergency': 'URGENT',
      'semi': 'SEMI-URGENT',
      'nonurgent': 'NON-URGENT'
    };
    return triaseMap[triase.toLowerCase()] || triase.toUpperCase();
  };

  return (
    <>
      {/* Tombol Print */}
      <button
        onClick={generateHashAndPrint}
        disabled={isPrinting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium shadow transition"
        type="button"
      >
        <Printer size={16} />
        {isPrinting ? 'Memproses...' : 'Print Tiket'}
      </button>

      {/* Hidden content untuk print (tidak tampil di UI) */}
      <div ref={printContentRef} style={{ display: 'none' }}>
        <div style={{ 
          width: '80mm',
          margin: '0',
          padding: '4mm 3mm',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.3',
          backgroundColor: '#fff'
        }}>
          
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '3mm',
            paddingBottom: '2mm',
            borderBottom: '1px dashed #000'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '0.5mm' }}>
              RS HERMINA PASTEUR
            </div>
            <div style={{ fonntSize: '11px' }}>Instalasi Gawat Darurat</div>
          </div>

          {/* Nomor Antrian */}
          <div style={{ textAlign: 'center', margin: '3mm 0' }}>
            <div style={{ fontSize: '10px', color: '#000000ff', marginBottom: '1mm' }}>
              NOMOR ANTRIAN
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: 'bold', 
              letterSpacing: '1px',
              lineHeight: '1'
            }}>
              {kunjungan.nomor_antrian || '-'}
            </div>
          </div>

          {/* QR Code - BESAR */}
          {qrUrl && (
            <div style={{ 
              textAlign: 'center',
              margin: '4mm 0',
              paddingTop: '3mm',
              borderTop: '1px dashed #ccc'
            }}>
              <QRCode 
                value={qrUrl} 
                size={140}
                level="M"
                style={{ display: 'inline-block' }}
              />
              <div style={{ fontSize: '10px', color: '#000000ff', marginTop: '2mm' }}>
                Scan untuk cek status
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            fontSize: '10px',
            textAlign: 'center',
            color: '#666',
            marginTop: '3mm',
            paddingTop: '2mm',
            borderTop: '1px dashed #ccc',
            lineHeight: '1.4'
          }}>
            <div style={{ marginBottom: '1mm', fontWeight: 'bold' }}>
              Terimakasih Sudah Menggunakan Layanan ini
            </div>
            <div style={{ fontSize: '14px', color: '#000000ff' }}>
              Dicetak: {new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta'
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
});

PrintableTicket.displayName = 'PrintableTicket';

export default PrintableTicket;
