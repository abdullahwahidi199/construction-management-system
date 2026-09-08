import { useEffect, useState } from "react";
import { Building2, ChevronDown, Loader2 } from "lucide-react";

import instance from "../../api/axiosInstance";
import { useAuth } from "../../auth/AuthContext";
import PermissionWrapper from "../../auth/PermissionWrapper";
import {
  APARTMENT_MANAGEMENT_PERMISSIONS,
  hasAnyPermission,
} from "../../auth/roles";
import { useLanguage } from "../../hooks/useLanguage";
import ApartmentManagement from "./ApartmentManagement";

const listData = (response) => response?.data?.results || response?.data || [];
const fieldClass =
  "min-h-12 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 pe-10 py-2 text-sm font-medium text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

export default function ApartmentManagementPage() {
  const { permissions = [] } = useAuth();
  const { t, lang } = useLanguage();
  const text = (key, fallback) => {
    const translated = t(`ApartmentManagementPage.${key}`);
    return translated === `ApartmentManagementPage.${key}` ? fallback : translated;
  };
  const translatedTitle = t("ApartmentManagement.title");
  const title = translatedTitle === "ApartmentManagement.title"
    ? "Apartment Management"
    : translatedTitle;
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(false);
  const [error, setError] = useState("");
  const isRTL = lang === "dr" || lang === "ps";
  const loadErrorText = text("loadError", "Unable to load projects.");
  const canAccessApartmentManagement = hasAnyPermission(
    permissions,
    APARTMENT_MANAGEMENT_PERMISSIONS,
  );

  useEffect(() => {
    if (!canAccessApartmentManagement) return undefined;
    let active = true;

    instance.get("/projects/")
      .then((response) => {
        if (!active) return;
        const availableProjects = listData(response);
        setProjects(availableProjects);
        if (availableProjects.length) setProjectId(String(availableProjects[0].id));
      })
      .catch((requestError) => {
        if (active) setError(requestError.userMessage || loadErrorText);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canAccessApartmentManagement, loadErrorText]);

  useEffect(() => {
    if (!canAccessApartmentManagement || !projectId) return undefined;

    let active = true;
    // Loading a newly selected project is the external synchronization performed here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjectLoading(true);
    setError("");
    instance.get(`/projects/${projectId}/`)
      .then((response) => {
        if (active) setProject(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.userMessage || loadErrorText);
      })
      .finally(() => {
        if (active) setProjectLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canAccessApartmentManagement, loadErrorText, projectId]);

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              {text("workspace", "Property workspace")}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {text("subtitle", "Select a project, then create buildings, floors, apartments, and sales.")}
            </p>
          </div>
        </div>
      </div>

      <PermissionWrapper
        permissions={APARTMENT_MANAGEMENT_PERMISSIONS}
        fallback={(
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
            {text("noPermission", "You do not have permission to access apartment management.")}
          </div>
        )}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
          <label className="block max-w-xl text-sm font-semibold text-[var(--text)]">
            {text("selectProject", "Select Project")}
            <span className="relative mt-2 block">
              <select
                className={fieldClass}
                value={projectId}
                onChange={(event) => {
                  setProject(null);
                  setProjectId(event.target.value);
                }}
                disabled={loading || !projects.length}
              >
                <option value="">
                  {loading ? text("loading", "Loading projects…") : text("selectProject", "Select Project")}
                </option>
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            </span>
          </label>
          {!loading && !projects.length && !error && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              {text("noProjects", "No accessible projects were found.")}
            </p>
          )}
          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
        </div>

        {projectLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] py-12 text-sm text-[var(--muted)]">
            <Loader2 className="h-5 w-5 animate-spin" /> {text("loading", "Loading project…")}
          </div>
        )}

        {!projectLoading && project && (
          <ApartmentManagement key={project.id} project={project} defaultExpanded hideHeader />
        )}
      </PermissionWrapper>
    </section>
  );
}
