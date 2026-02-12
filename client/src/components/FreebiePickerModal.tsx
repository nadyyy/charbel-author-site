import { Button } from "@/components/ui/button";

export type FreebieOption = {
  id: string;
  title: string;
  image: string;
};

export default function FreebiePickerModal({
  open,
  title,
  options,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  options: FreebieOption[];
  onClose: () => void;
  onConfirm: (picked: FreebieOption) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white shadow-xl border border-gray-100">
        <div className="p-8">
          <h2 className="serif-title text-3xl mb-2">Choose your free gift</h2>
          <p className="text-gray-600 mb-8">{title}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => onConfirm(o)}
                className="border border-gray-100 shadow-sm bg-white hover:shadow-md transition-shadow text-left"
              >
                <div className="p-4">
                  <div className="bg-white shadow-md shadow-black/10 p-3">
                    <img
                      src={o.image}
                      alt={o.title}
                      className="w-full h-[160px] object-contain"
                    />
                  </div>
                  <div className="pt-3">
                    <div className="serif-title text-lg">{o.title}</div>
                    <div className="text-sm text-gray-500">Free</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-8 flex justify-end">
            <Button
              variant="outline"
              className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
