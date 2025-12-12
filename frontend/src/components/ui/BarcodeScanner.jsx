import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Komponen untuk scan barcode/QR code menggunakan kamera atau file upload
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onScanSuccess - Callback saat scan berhasil (decodedText, decodedResult)
 */
export default function BarcodeScanner({ isOpen, onClose, onScanSuccess }) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'file'
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCameraScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, scanMode]);

  const startCameraScanner = async () => {
    try {
      setError('');
      setScanning(true);

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        config,
        (decodedText, decodedResult) => {
          // Success callback
          handleScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Error callback - just ignore, it fires on every frame without QR
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText, null);
    } catch (err) {
      console.error('File scan error:', err);
      setError('QR Code tidak ditemukan di gambar. Coba gambar lain atau gunakan kamera.');
    } finally {
      setScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleScanSuccess = async (decodedText, decodedResult) => {
    console.log('✅ QR Scan success:', decodedText);
    
    setSuccess(`Berhasil scan: ${decodedText}`);
    setScanning(false);
    
    // Stop scanner
    await stopScanner();

    // Callback ke parent dengan delay untuk user melihat success message
    setTimeout(() => {
      onScanSuccess(decodedText, decodedResult);
      onClose();
    }, 1000);
  };

  const handleClose = async () => {
    await stopScanner();
    setError('');
    setSuccess('');
    onClose();
  };

  const switchToCamera = async () => {
    await stopScanner();
    setScanMode('camera');
    setError('');
    setSuccess('');
  };

  const switchToFile = async () => {
    await stopScanner();
    setScanMode('file');
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5333] to-[#0E6B42] p-5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Scan QR Code / Barcode</h3>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={switchToCamera}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition ${
              scanMode === 'camera'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Camera size={18} />
            Kamera
          </button>
          <button
            onClick={switchToFile}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition ${
              scanMode === 'file'
                ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Upload size={18} />
            Upload File
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Camera Mode */}
          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div 
                id="qr-reader" 
                className="rounded-lg overflow-hidden border-2 border-gray-200"
              />
              
              {scanning && (
                <div className="text-center">
                  <div className="animate-pulse text-green-600 font-medium">
                    Arahkan kamera ke QR Code...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Mode */}
          {scanMode === 'file' && (
            <div className="space-y-4">
              <div id="qr-reader-file" className="hidden" />
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition">
                <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Pilih gambar QR Code dari galeri atau file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition font-medium"
                >
                  <Upload size={18} />
                  Pilih File
                </label>
              </div>

              {scanning && (
                <div className="text-center">
                  <div className="animate-pulse text-green-600 font-medium">
                    Memproses gambar...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Scan Berhasil!</p>
                <p className="text-xs text-green-700 mt-1 break-all">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Gagal Scan</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Tips:</strong> Pastikan QR Code terlihat jelas dan pencahayaan cukup. 
              Untuk hasil terbaik, posisikan QR Code di tengah frame kamera.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
