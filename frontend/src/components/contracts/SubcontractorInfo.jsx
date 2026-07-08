import { Building2, Phone, Mail, User, MapPin } from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";

export default function SubcontractorInfo({ subcontractor }) {
  const { t } = useLanguage();

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="text-[var(--primary)]" size={24} />
        <h2 className="text-xl font-semibold text-[var(--text)]">
          {subcontractor.name}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <InfoItem
          icon={<User size={18} />}
          label={t("SubcontractorInfo.labels.contact_person")}
          value={subcontractor.contact_person}
        />

        <InfoItem
          icon={<Phone size={18} />}
          label={t("SubcontractorInfo.labels.phone")}
          value={subcontractor.phone}
        />

        <InfoItem
          icon={<Mail size={18} />}
          label={t("SubcontractorInfo.labels.email")}
          value={subcontractor.email}
        />

        <InfoItem
          icon={<MapPin size={18} />}
          label={t("SubcontractorInfo.labels.address")}
          value={subcontractor.address}
        />

        <InfoItem
          label={t("SubcontractorInfo.labels.specialization")}
          value={subcontractor.specialization}
        />

        <InfoItem
          label={t("SubcontractorInfo.labels.status")}
          value={
            subcontractor.is_active
              ? t("SubcontractorInfo.labels.active")
              : t("SubcontractorInfo.labels.inactive")
          }
        />
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>

      <div className="flex items-center gap-2 text-[var(--text)]">
        {icon}
        <span>{value || "—"}</span>
      </div>
    </div>
  );
}
