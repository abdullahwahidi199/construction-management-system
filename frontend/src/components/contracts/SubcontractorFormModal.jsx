// src/components/contracts/SubcontractorFormModal.jsx
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import PermissionWrapper from "../../auth/PermissionWrapper";
import { useLanguage } from "../../hooks/useLanguage";
import { fieldLabelClass, textareaControlClass } from "../ui/formStyles.jsx";

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
  const { t } = useLanguage();

  const SPECIALIZATION_OPTIONS = [
    { value: "", label: t("SubcontractorsPage.filters.specialization_all") },
    {
      value: "concrete",
      label: t("SubcontractorsPage.specializations.concrete"),
    },
    { value: "steel", label: t("SubcontractorsPage.specializations.steel") },
    {
      value: "electrical",
      label: t("SubcontractorsPage.specializations.electrical"),
    },
    {
      value: "plumbing",
      label: t("SubcontractorsPage.specializations.plumbing"),
    },
    {
      value: "finishing",
      label: t("SubcontractorsPage.specializations.finishing"),
    },
    {
      value: "excavation",
      label: t("SubcontractorsPage.specializations.excavation"),
    },
    { value: "hvac", label: t("SubcontractorsPage.specializations.hvac") },
    {
      value: "landscaping",
      label: t("SubcontractorsPage.specializations.landscaping"),
    },
    { value: "other", label: t("SubcontractorsPage.specializations.other") },
  ];

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
    if (!form.name.trim())
      e.name = t("SubcontractorFormModal.errors.name_required");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("SubcontractorFormModal.errors.invalid_email");
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
    <div className="fixed inset-0  z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0  backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                {isEdit
                  ? t("SubcontractorFormModal.title.edit")
                  : t("SubcontractorFormModal.title.create")}
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
                label={t("SubcontractorFormModal.fields.company_name.label")}
                value={form.name}
                onChange={(val) => handleChange("name", val)}
                placeholder={t(
                  "SubcontractorFormModal.fields.company_name.placeholder",
                )}
                error={errors.name}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t(
                    "SubcontractorFormModal.fields.contact_person.label",
                  )}
                  value={form.contact_person}
                  onChange={(val) => handleChange("contact_person", val)}
                  placeholder={t(
                    "SubcontractorFormModal.fields.contact_person.placeholder",
                  )}
                />
                <Select
                  label={t(
                    "SubcontractorFormModal.fields.specialization.label",
                  )}
                  value={form.specialization}
                  onChange={(val) => handleChange("specialization", val)}
                  options={SPECIALIZATION_OPTIONS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("SubcontractorFormModal.fields.phone.label")}
                  value={form.phone}
                  onChange={(val) => handleChange("phone", val)}
                  placeholder={t(
                    "SubcontractorFormModal.fields.phone.placeholder",
                  )}
                />
                <Input
                  label={t("SubcontractorFormModal.fields.email.label")}
                  type="email"
                  value={form.email}
                  onChange={(val) => handleChange("email", val)}
                  placeholder={t(
                    "SubcontractorFormModal.fields.email.placeholder",
                  )}
                  error={errors.email}
                />
              </div>

              <div>
                <label className={fieldLabelClass}>
                  {t("SubcontractorFormModal.fields.address.label")}
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                  placeholder={t(
                    "SubcontractorFormModal.fields.address.placeholder",
                  )}
                  className={textareaControlClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t("SubcontractorFormModal.fields.tax_number.label")}
                  value={form.tax_number}
                  onChange={(val) => handleChange("tax_number", val)}
                  placeholder={t(
                    "SubcontractorFormModal.fields.tax_number.placeholder",
                  )}
                />
                <Input
                  label={t(
                    "SubcontractorFormModal.fields.registration_number.label",
                  )}
                  value={form.registration_number}
                  onChange={(val) => handleChange("registration_number", val)}
                  placeholder={t(
                    "SubcontractorFormModal.fields.registration_number.placeholder",
                  )}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-[var(--text)]">
                  {t("SubcontractorFormModal.fields.active.label")}
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
                <label className={fieldLabelClass}>
                  {t("SubcontractorFormModal.fields.notes.label")}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder={t(
                    "SubcontractorFormModal.fields.notes.placeholder",
                  )}
                  className={textareaControlClass}
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
                {t("SubcontractorFormModal.buttons.cancel")}
              </Button>
              <PermissionWrapper
                permissions={[
                  isEdit ? "subcontractors.update" : "subcontractors.create",
                ]}
                fallback={
                  <Button
                    type="submit"
                    variant="primary"
                    disabled
                    title="You do not have permission for this action"
                  >
                    {isEdit
                      ? t("SubcontractorFormModal.buttons.update_permission")
                      : t("SubcontractorFormModal.buttons.create_permission")}
                  </Button>
                }
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitLoading}
                >
                  {submitLoading
                    ? t("SubcontractorFormModal.buttons.saving")
                    : isEdit
                      ? t("SubcontractorFormModal.buttons.update")
                      : t("SubcontractorFormModal.buttons.create")}
                </Button>
              </PermissionWrapper>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
