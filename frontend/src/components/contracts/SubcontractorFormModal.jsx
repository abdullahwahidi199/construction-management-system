// src/components/contracts/SubcontractorFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

const SPECIALIZATION_OPTIONS = [
  { value: "concrete", label: "Concrete Works" },
  { value: "steel", label: "Steel Works" },
  { value: "electrical", label: "Electrical Works" },
  { value: "plumbing", label: "Plumbing Works" },
  { value: "finishing", label: "Finishing Works" },
  { value: "excavation", label: "Excavation Works" },
  { value: "hvac", label: "HVAC" },
  { value: "landscaping", label: "Landscaping" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  tax_number: "",
  registration_number: "",
  specialization: "other",
  notes: "",
  is_active: true,
};

export default function SubcontractorFormModal({
  isOpen,
  onClose,
  onSubmit,
  subcontractor = null,
  loading: submitLoading,
}) {
  const isEdit = !!subcontractor;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subcontractor) {
      setForm({
        name: subcontractor.name || "",
        contact_person: subcontractor.contact_person || "",
        phone: subcontractor.phone || "",
        email: subcontractor.email || "",
        address: subcontractor.address || "",
        tax_number: subcontractor.tax_number || "",
        registration_number: subcontractor.registration_number || "",
        specialization: subcontractor.specialization || "other",
        notes: subcontractor.notes || "",
        is_active: subcontractor.is_active ?? true,
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [subcontractor, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Invalid email format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit ? "Edit Subcontractor" : "Create Subcontractor"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[var(--hover)] text-[var(--text)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <Input
                label="Company Name"
                value={form.name}
                onChange={(val) => handleChange("name", val)}
                placeholder="e.g. ABC Construction Co."
                error={errors.name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Person"
                  value={form.contact_person}
                  onChange={(val) => handleChange("contact_person", val)}
                  placeholder="Full name"
                />
                <Select
                  label="Specialization"
                  value={form.specialization}
                  onChange={(val) => handleChange("specialization", val)}
                  options={SPECIALIZATION_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(val) => handleChange("phone", val)}
                  placeholder="+1-555-0100"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(val) => handleChange("email", val)}
                  placeholder="contact@example.com"
                  error={errors.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Address
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                  placeholder="Full address"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tax Number"
                  value={form.tax_number}
                  onChange={(val) => handleChange("tax_number", val)}
                  placeholder="Tax ID"
                />
                <Input
                  label="Registration Number"
                  value={form.registration_number}
                  onChange={(val) => handleChange("registration_number", val)}
                  placeholder="Reg. number"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[var(--text)]">
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => handleChange("is_active", !form.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_active ? "bg-[var(--success)]" : "bg-[var(--muted)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.is_active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={submitLoading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitLoading}>
                {submitLoading ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
