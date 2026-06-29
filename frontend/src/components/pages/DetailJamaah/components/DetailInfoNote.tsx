export function DetailInfoNote() {
  return (
    <div className="bg-[#78C2A4]/10 border border-[#78C2A4]/30 rounded-lg md:rounded-xl p-3 md:p-4">
      <div className="flex items-start gap-2 md:gap-3">
        <span className="text-[#0C5E3C] text-sm md:text-base">💡</span>
        <p className="text-xs md:text-sm text-[#0C5E3C] leading-tight">
          <span className="md:hidden">
            Data dari mesin absensi. Hapus di website tidak hapus di mesin.
          </span>
          <span className="hidden md:inline">
            Data jamaah ini berasal dari mesin absensi. Menghapus data di sini tidak menghapus data di mesin.
          </span>
        </p>
      </div>
    </div>
  );
}