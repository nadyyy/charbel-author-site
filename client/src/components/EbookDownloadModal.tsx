import { Button } from "@/components/ui/button";
import { type Book, isEbookBook } from "@/data/BookData";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  book: Book | null;
  onClose: () => void;
};

export default function EbookDownloadModal({ open, book, onClose }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setEmail("");
    setNotice(null);
    setIsSubmitting(false);
  }, [open, book?.id]);

  if (!open || !book || !isEbookBook(book)) {
    return null;
  }

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  const startDownload = (downloadUrl: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setNotice("Full name and email are required.");
      return;
    }

    if (!book.downloadPath) {
      setNotice("This PDF is unavailable right now.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const resolvedDownloadUrl = book.downloadPath;
    let ownerNotified = false;

    try {
      const response = await fetch("/api/ebook-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: book.id,
          title: book.title,
          fullName: trimmedName,
          email: trimmedEmail,
          downloadPath: book.downloadPath,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        ownerNotified = json?.ownerNotified !== false;
        if (typeof json?.downloadUrl === "string" && json.downloadUrl) {
          startDownload(json.downloadUrl);
        } else {
          startDownload(resolvedDownloadUrl);
        }
      } else {
        startDownload(resolvedDownloadUrl);
        setNotice("The PDF downloaded, but the notification request could not be confirmed.");
        toast.success("Your PDF is downloading.");
        onClose();
        return;
      }
    } catch (submitError: any) {
      startDownload(resolvedDownloadUrl);
      setNotice(
        submitError?.message || "The PDF downloaded, but the notification request could not be confirmed."
      );
      toast.success("Your PDF is downloading.");
      onClose();
      return;
    } finally {
      setIsSubmitting(false);
    }

    if (ownerNotified) {
      toast.success("Your PDF is downloading.");
    } else {
      toast.message("Your PDF is downloading. Owner notification may not be active locally.");
      toast.success("Your PDF is downloading.");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={closeModal}
        aria-label="Close"
      />

      <div className="relative w-full max-w-md bg-white border border-gray-100 shadow-xl p-6">
        <h3 className="serif-title text-xl text-black mb-2">
          {`Download ${book.title}`}
        </h3>

        <p className="sans-body text-sm text-gray-600">
          Enter your name and email to download the PDF.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="ebook-full-name"
              className="block sans-body text-sm font-medium text-black mb-2"
            >
              Full Name
            </label>
            <input
              id="ebook-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="ebook-email"
              className="block sans-body text-sm font-medium text-black mb-2"
            >
              Email
            </label>
            <input
              id="ebook-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-colors"
            />
          </div>

          {notice ? <p className="text-sm text-red-600">{notice}</p> : null}

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
              className="border-black text-black hover:bg-black hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black text-white hover:bg-[#d4af37] hover:text-black"
            >
              {isSubmitting ? "Preparing..." : "Download PDF"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
