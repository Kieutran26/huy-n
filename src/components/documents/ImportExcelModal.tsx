import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { parseExcelFile, type ParsedExcel } from "@/lib/excelParser";
import { cn } from "@/lib/utils";

interface ImportExcelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (parsed: ParsedExcel) => void;
}

export function ImportExcelModal({
  open,
  onOpenChange,
  onConfirm,
}: ImportExcelModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedExcel | null>(null);

  function reset() {
    setError("");
    setFileName("");
    setParsed(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    if (!/\.xlsx$/i.test(file.name)) {
      setError("Vui lòng chọn file Excel định dạng .xlsx");
      return;
    }
    setError("");
    setFileName(file.name);
    setLoading(true);
    try {
      const result = await parseExcelFile(file);
      if (!result.docSheetFound && !result.distSheetFound) {
        setError(
          'Không tìm thấy sheet "MASTER LIST WI" hoặc "ASM1 MASTER LIST PP-TH".'
        );
        setParsed(null);
      } else {
        setParsed(result);
      }
    } catch (err) {
      console.error(err);
      setError("Không đọc được file. File có thể bị hỏng hoặc sai định dạng.");
      setParsed(null);
    } finally {
      setLoading(false);
    }
  }

  function handleClose(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" onClose={() => handleClose(false)}>
        <DialogHeader>
          <DialogTitle>Import Excel</DialogTitle>
          <p className="text-sm text-muted-foreground">
            File cần có sheet <b>MASTER LIST WI</b> và{" "}
            <b>ASM1 MASTER LIST PP-TH</b>. Dữ liệu đọc từ dòng 7.
          </p>
        </DialogHeader>

        <div
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-input"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {fileName || "Kéo thả hoặc bấm để chọn file .xlsx"}
          </p>
          <p className="text-xs text-muted-foreground">Chỉ hỗ trợ file .xlsx</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        {parsed && (
          <div className="flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
            <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Tìm thấy <b>{parsed.documents.length}</b> tài liệu từ sheet
              MASTER LIST WI, <b>{parsed.distributions.length}</b> bản ghi từ
              sheet ASM1 MASTER LIST PP-TH.
            </span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Hủy
          </Button>
          <Button
            disabled={!parsed || loading}
            onClick={() => {
              if (parsed) {
                onConfirm(parsed);
                handleClose(false);
              }
            }}
          >
            Xác nhận import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
