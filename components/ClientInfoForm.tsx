"use client";

import { useState } from "react";
import { ClientInfo } from "@/lib/documents";
import { ArrowRight, User, Mail, Building2 } from "lucide-react";

type Props = {
  onSubmit: (info: ClientInfo) => void;
};

export function ClientInfoForm({ onSubmit }: Props) {
  const [form, setForm] = useState<ClientInfo>({
    fullName: "",
    email: "",
    company: "",
  });
  const [errors, setErrors] = useState<Partial<ClientInfo>>({});

  const validate = () => {
    const e: Partial<ClientInfo> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSubmit(form);
  };

  const fields = [
    {
      key: "fullName" as keyof ClientInfo,
      label: "Full Name",
      placeholder: "Jane Smith",
      icon: User,
      type: "text",
    },
    {
      key: "email" as keyof ClientInfo,
      label: "Email Address",
      placeholder: "jane@company.com",
      icon: Mail,
      type: "email",
    },
    {
      key: "company" as keyof ClientInfo,
      label: "Company (optional)",
      placeholder: "Acme Inc.",
      icon: Building2,
      type: "text",
    },
  ];

  return (
    <div
      className="rounded-2xl p-6 md:p-8 animate-fade-up"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        animationDelay: "0.15s",
        opacity: 0,
      }}
    >
      <div className="space-y-5 mb-8">
        {fields.map(({ key, label, placeholder, icon: Icon, type }) => (
          <div key={key}>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {label}
            </label>
            <div className="relative">
              <Icon
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={type}
                value={form[key] || ""}
                onChange={(e) => {
                  setForm((p) => ({ ...p, [key]: e.target.value }));
                  if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={placeholder}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm transition-all outline-none"
                style={{
                  background: "var(--surface-2)",
                  border: `1px solid ${errors[key] ? "var(--danger)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors[key]
                    ? "var(--danger)"
                    : "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            {errors[key] && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>
                {errors[key]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
        style={{
          background: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "var(--accent-hover)";
          (e.target as HTMLElement).style.boxShadow =
            "0 4px 20px rgba(37, 99, 235, 0.35)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "var(--accent)";
          (e.target as HTMLElement).style.boxShadow = "none";
        }}
      >
        Continue to Documents
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
