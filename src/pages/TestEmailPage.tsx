import { useState } from "react";
import { Mail, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { AxiosError } from "axios";
import api from "../services/api";
import type { ApiErrorResponse } from "../types";

type Status = "idle" | "sending" | "success" | "error";

export function TestEmailPage() {
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [messageId, setMessageId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorDetail, setErrorDetail] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessageId("");
    setErrorMsg("");
    setErrorDetail("");

    try {
      const { data } = await api.post("/donation/test-email", { to });
      if (data.ok) {
        setMessageId(data.messageId || "sent");
        setStatus("success");
      } else {
        setErrorMsg(data.error || "Unknown error");
        setErrorDetail(data.detail || "");
        setStatus("error");
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      const res = error.response?.data;
      setErrorMsg(res?.error || error.message || "Request failed");
      setErrorDetail(res?.detail || "");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setMessageId("");
    setErrorMsg("");
    setErrorDetail("");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Email Test</h1>
              <p className="text-sm text-gray-400">Verify SMTP is working end-to-end</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Idle / form */}
          {(status === "idle" || status === "sending") && (
            <form onSubmit={handleSend} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-600">
                  Recipient email
                </label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition text-gray-900 placeholder:text-gray-400 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)" }}
              >
                {status === "sending" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send Test Email</>
                )}
              </button>
            </form>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Email sent successfully</p>
                  <p className="text-sm text-gray-400">SMTP is configured correctly</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Message ID</p>
                <p className="text-sm font-mono text-gray-700 break-all">{messageId}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">Sent to</p>
                <p className="text-sm text-gray-700">{to}</p>
              </div>
              <button
                onClick={reset}
                className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-semibold"
              >
                Send another
              </button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold text-gray-900">Email failed to send</p>
                  <p className="text-sm text-gray-400">Check SMTP configuration</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-xl px-4 py-3 space-y-2">
                <p className="text-xs text-red-400 font-medium uppercase tracking-wide">Error</p>
                <p className="text-sm text-red-700 font-semibold">{errorMsg}</p>
                {errorDetail && (
                  <p className="text-xs text-red-500 font-mono break-all">{errorDetail}</p>
                )}
              </div>
              <button
                onClick={reset}
                className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Info note */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Calls <span className="font-mono">POST /api/donation/test-email</span> — requires admin login
        </p>
      </div>
    </main>
  );
}
