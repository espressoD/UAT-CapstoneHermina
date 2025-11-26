
/** @CIPONG PARAM = PARAMETER
 * Komponen kartu untuk menampilkan informasi dengan border kuning.
 * @param {{ children: React.ReactNode }} props - Konten yang akan ditampilkan di dalam kartu.
 */
export default function InfoCard({ children }) {
  return (
    <div className="border border-yellow-400 rounded-lg p-6 text-center max-w-md w-full">
      {children}
    </div>
  );
}
