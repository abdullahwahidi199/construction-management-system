import { Building2, Phone, Mail, User, MapPin } from "lucide-react";

export default function SubcontractorInfo({ subcontractor }) {
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
          label="Contact Person"
          value={subcontractor.contact_person}
        />

        <InfoItem
          icon={<Phone size={18} />}
          label="Phone"
          value={subcontractor.phone}
        />

        <InfoItem
          icon={<Mail size={18} />}
          label="Email"
          value={subcontractor.email}
        />

        <InfoItem
          icon={<MapPin size={18} />}
          label="Address"
          value={subcontractor.address}
        />

        <InfoItem label="Specialization" value={subcontractor.specialization} />

        <InfoItem
          label="Status"
          value={subcontractor.is_active ? "Active" : "Inactive"}
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
