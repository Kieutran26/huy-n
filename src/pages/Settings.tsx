import { useRef, useState } from "react";
import {
  Mail,
  Send,
  Save,
  ChevronDown,
  Download,
  Upload,
  Trash2,
  Database,
  HelpCircle,
} from "lucide-react";
import type { AppSettings } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import {
  clearAll,
  exportAll,
  getSettings,
  importAll,
  setSettings,
  KEYS,
} from "@/lib/storage";
import { invalidate } from "@/lib/store";
import { sendTestEmail } from "@/lib/emailService";
import { backupFilename, downloadJSON, readJSONFile } from "@/lib/fileUtils";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [cfg, setCfg] = useState<AppSettings>(getSettings());
  const [testEmail, setTestEmail] = useState("");
  const [showTest, setShowTest] = useState(false);
  const [sending, setSending] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  function setEmailField(key: keyof AppSettings["emailjs"], value: string) {
    setCfg((c) => ({ ...c, emailjs: { ...c.emailjs, [key]: value } }));
  }

  function handleSave() {
    setSettings(cfg);
    toast.success("Đã lưu cấu hình EmailJS");
  }

  async function handleTest() {
    if (!testEmail.trim()) {
      toast.warning("Vui lòng nhập email nhận thử nghiệm");
      return;
    }
    setSending(true);
    const res = await sendTestEmail(cfg.emailjs, testEmail.trim());
    setSending(false);
    if (res.sent) toast.success("Đã gửi email thử nghiệm", testEmail.trim());
    else if (res.skipped) toast.warning("Bỏ qua", res.reason);
    else toast.error("Gửi thất bại", res.reason);
  }

  function handleExport() {
    downloadJSON(exportAll(), backupFilename());
    toast.success("Đã xuất toàn bộ dữ liệu");
  }

  async function handleImport(file: File) {
    try {
      const data = await readJSONFile<Parameters<typeof importAll>[0]>(file);
      importAll(data);
      invalidate(KEYS.DOCUMENTS);
      invalidate(KEYS.DISTRIBUTIONS);
      invalidate(KEYS.EMPLOYEES);
      setCfg(getSettings());
      toast.success("Đã nhập dữ liệu từ file backup");
    } catch (err) {
      console.error(err);
      toast.error("File JSON không hợp lệ");
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    }
  }

  function handleClear() {
    clearAll();
    invalidate(KEYS.DOCUMENTS);
    invalidate(KEYS.DISTRIBUTIONS);
    invalidate(KEYS.EMPLOYEES);
    setCfg(getSettings());
    toast.success("Đã xóa toàn bộ dữ liệu");
  }

  return (
    <>
      <PageHeader title="Cài đặt" breadcrumb="Document Control / Cài đặt" />

      {/* EmailJS */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Cấu hình EmailJS</h2>
        </div>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc">Service ID</Label>
              <Input
                id="svc"
                value={cfg.emailjs.serviceId}
                onChange={(e) => setEmailField("serviceId", e.target.value)}
                placeholder="service_xxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl">Template ID</Label>
              <Input
                id="tpl"
                value={cfg.emailjs.templateId}
                onChange={(e) => setEmailField("templateId", e.target.value)}
                placeholder="template_xxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pk">Public Key</Label>
              <Input
                id="pk"
                value={cfg.emailjs.publicKey}
                onChange={(e) => setEmailField("publicKey", e.target.value)}
                placeholder="xxxxxxxxxxxx"
              />
            </div>
          </div>

          {showTest && (
            <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/50 p-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="test-email">Email nhận thử nghiệm</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <Button onClick={handleTest} disabled={sending}>
                <Send className="h-4 w-4" />
                {sending ? "Đang gửi..." : "Gửi thử"}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTest((v) => !v)}
            >
              <Send className="h-4 w-4" /> Test gửi email
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" /> Lưu cấu hình
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hướng dẫn EmailJS (accordion) */}
      <Card className="mb-6">
        <button
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setGuideOpen((v) => !v)}
        >
          <span className="flex items-center gap-2 font-semibold">
            <HelpCircle className="h-5 w-5 text-primary" /> Hướng dẫn cấu hình
            EmailJS
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              guideOpen && "rotate-180"
            )}
          />
        </button>
        {guideOpen && (
          <CardContent className="space-y-3 border-t pt-4 text-sm">
            <p>
              <b>Bước 1:</b> Đăng ký tài khoản miễn phí tại{" "}
              <a
                href="https://emailjs.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                emailjs.com
              </a>
              .
            </p>
            <p>
              <b>Bước 2:</b> Tạo Email Service (kết nối Gmail/Outlook).
            </p>
            <div>
              <b>Bước 3:</b> Tạo Email Template với các biến:
              <ul className="mt-1.5 space-y-1 rounded-md bg-muted/60 p-3 font-mono text-xs">
                <li>{"{{to_name}}"} — Họ tên người nhận</li>
                <li>{"{{doc_code}}"} — Mã tài liệu</li>
                <li>{"{{doc_name}}"} — Tên tài liệu</li>
                <li>{"{{old_rev}}"} — Rev cũ cần thu hồi</li>
                <li>{"{{new_rev}}"} — Rev mới vừa ban hành</li>
                <li>{"{{issue_date}}"} — Ngày ban hành</li>
              </ul>
            </div>
            <p>
              <b>Bước 4:</b> Copy Service ID, Template ID, Public Key vào form
              phía trên.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Dữ liệu */}
      <Card>
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Dữ liệu</h2>
        </div>
        <CardContent className="flex flex-wrap gap-2 pt-5">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> Xuất toàn bộ dữ liệu (JSON)
          </Button>
          <Button
            variant="outline"
            onClick={() => jsonInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" /> Nhập dữ liệu (JSON)
          </Button>
          <Button variant="destructive" onClick={() => setClearOpen(true)}>
            <Trash2 className="h-4 w-4" /> Xóa toàn bộ dữ liệu
          </Button>
          <input
            ref={jsonInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={clearOpen}
        title="Xóa toàn bộ dữ liệu?"
        description="Toàn bộ tài liệu, phân phát, nhân viên và cấu hình sẽ bị xóa khỏi trình duyệt. Hành động này không thể hoàn tác. Nên xuất backup trước."
        confirmText="Xóa tất cả"
        destructive
        onConfirm={handleClear}
        onOpenChange={setClearOpen}
      />
    </>
  );
}
