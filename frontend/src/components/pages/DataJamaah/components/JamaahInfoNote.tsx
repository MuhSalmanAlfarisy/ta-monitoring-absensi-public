import { Card } from '../../../ui/card';

export function JamaahInfoNote() {
  return (
    <Card className="p-3 border-l-4 border-l-[#78C2A4] bg-[#78C2A4]/5">
      <p className="text-xs text-[#0C5E3C]">
        <span className="font-semibold">💡 Catatan:</span> Data ini bersumber dari mesin absensi dan
        bersifat <span className="font-semibold">read-only</span>. Klik nama jamaah untuk lihat detail.
      </p>
    </Card>
  );
}
