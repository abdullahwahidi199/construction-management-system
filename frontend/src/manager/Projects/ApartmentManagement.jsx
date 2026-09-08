import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  Eye,
  FilterX,
  Hash,
  Home,
  Info,
  Layers,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Ruler,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import instance from "../../api/axiosInstance";
import PermissionWrapper from "../../auth/PermissionWrapper";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../hooks/useLanguage";
import ApartmentSalesPanel from "./ApartmentSalesPanel";

const blankFloorRow = () => ({ floor_number: "", name: "" });
const blankApartmentRow = () => ({
  apartment_number: "",
  apartment_type: "",
  area: "",
  bedrooms: "",
  description: "",
});
const blankFloorDraft = () => ({ building: "", rows: [blankFloorRow()] });
const blankApartmentDraft = () => ({
  building: "",
  floor: "",
  rows: [blankApartmentRow()],
});

const listData = (response) => response?.data?.results || response?.data || [];
const optionalListRequest = async (request) => {
  try {
    return await request;
  } catch (error) {
    if (error?.response?.status === 403) return { data: [] };
    throw error;
  }
};

const cx = (...c) => c.filter(Boolean).join(" ");

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3.5 text-sm font-medium text-[var(--text)] shadow-sm outline-none transition-all duration-200 placeholder:text-[var(--muted)]/60 placeholder:font-normal hover:border-[var(--primary)]/40 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15";
const labelClass = "block text-[13px] font-bold text-[var(--text)]";

function useDraftState(storageKey, initialFactory, isEmpty) {
  const [draft, setDraft] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialFactory();
    } catch {
      return initialFactory();
    }
  });
  useEffect(() => {
    try {
      if (isEmpty(draft)) sessionStorage.removeItem(storageKey);
      else sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // Keep the in-memory draft when browser storage is unavailable.
    }
  }, [draft, isEmpty, storageKey]);
  const clear = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Clearing in-memory state below is sufficient when storage is unavailable.
    }
    setDraft(initialFactory());
  };
  return [draft, setDraft, clear];
}

const floorDraftIsEmpty = (draft) =>
  !draft.building && draft.rows.every((row) => !row.floor_number && !row.name);
const apartmentDraftIsEmpty = (draft) =>
  !draft.building &&
  !draft.floor &&
  draft.rows.every((row) => Object.values(row).every((v) => !v));

const firstError = (value) => {
  if (Array.isArray(value)) return firstError(value[0]);
  if (value && typeof value === "object")
    return firstError(Object.values(value)[0]);
  return value ? String(value) : "";
};

function FieldError({ value }) {
  const message = firstError(value);
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[var(--danger)]">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {message}
    </p>
  );
}

function PremiumStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]/30 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[22px] font-extrabold leading-none tabular-nums text-[var(--text)]">
            {value}
          </span>
          <span className="mt-1.5 block truncate text-xs font-semibold text-[var(--muted)]">
            {label}
          </span>
        </span>
      </div>
    </div>
  );
}

function ApartmentStatusBadge({ status, text }) {
  const sold = status === "SOLD";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap",
        sold
          ? "border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)]"
          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cx(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            sold ? "bg-[var(--primary)]" : "bg-emerald-500",
          )}
        />
        <span
          className={cx(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            sold ? "bg-[var(--primary)]" : "bg-emerald-500",
          )}
        />
      </span>
      {sold ? (
        <BadgeCheck className="h-3.5 w-3.5" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      {text(status, status)}
    </span>
  );
}

function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon className="h-7 w-7" />
      </span>
      <p className="mt-4 text-[15px] font-extrabold text-[var(--text)]">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
        {desc}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function IconBtn({ label, onClick, danger, children, className = "" }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cx(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent transition-all hover:border-[var(--border)] hover:bg-[var(--hover)]",
        danger
          ? "text-[var(--muted)] hover:!bg-[var(--danger)]/10 hover:!text-[var(--danger)]"
          : "text-[var(--muted)] hover:text-[var(--primary)] hover:!bg-[var(--primary)]/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = "max-w-2xl",
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className={cx(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:rounded-[28px]",
          maxWidth,
        )}
      >
        <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg)]/60">
          <div className="flex items-start gap-3 p-5">
            {Icon && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="truncate text-[16px] font-extrabold tracking-tight text-[var(--text)]">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 truncate text-[13px] text-[var(--muted)]">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--hover)] text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]/70 p-4 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const emptyInventoryFilters = {
  search: "",
  building: "",
  floor: "",
  status: "",
};

export default function ApartmentManagement({
  project,
  defaultExpanded = false,
  hideHeader = false,
}) {
  const { t, lang } = useLanguage();
  const text = (key, fallback) => {
    const translated = t(`ApartmentManagement.${key}`);
    return translated === `ApartmentManagement.${key}` ? fallback : translated;
  };
  const isRTL = lang === "dr" || lang === "ps";
  const [expanded, setExpanded] = useState(defaultExpanded || hideHeader);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");
  const [buildingEditor, setBuildingEditor] = useState(null);
  const [floorEditor, setFloorEditor] = useState(null);
  const [apartmentEditor, setApartmentEditor] = useState(null);
  const [floorBulkOpen, setFloorBulkOpen] = useState(false);
  const [apartmentBulkOpen, setApartmentBulkOpen] = useState(false);
  const [floorErrors, setFloorErrors] = useState({});
  const [apartmentErrors, setApartmentErrors] = useState({});
  const [inventoryFilters, setInventoryFilters] = useState(
    emptyInventoryFilters,
  );
  const apartmentDetailsRef = useRef(null);
  const searchRef = useRef(null);

  const [floorDraft, setFloorDraft, clearFloorDraft] = useDraftState(
    `cms.apartment-management.floors.${project.id}`,
    blankFloorDraft,
    floorDraftIsEmpty,
  );
  const [apartmentDraft, setApartmentDraft, clearApartmentDraft] =
    useDraftState(
      `cms.apartment-management.apartments.${project.id}`,
      blankApartmentDraft,
      apartmentDraftIsEmpty,
    );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        buildingResponse,
        floorResponse,
        apartmentResponse,
        customerResponse,
        saleResponse,
      ] = await Promise.all([
        optionalListRequest(
          instance.get(`/projects/buildings/?project=${project.id}`),
        ),
        optionalListRequest(
          instance.get(`/projects/floors/?project=${project.id}`),
        ),
        optionalListRequest(
          instance.get(`/projects/apartments/?project=${project.id}`),
        ),
        optionalListRequest(
          instance.get(`/projects/apartment-customers/?project=${project.id}`),
        ),
        optionalListRequest(
          instance.get(`/projects/apartment-sales/?project=${project.id}`),
        ),
      ]);
      setBuildings(listData(buildingResponse));
      setFloors(listData(floorResponse));
      setApartments(listData(apartmentResponse));
      setCustomers(listData(customerResponse));
      setSales(listData(saleResponse));
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (!defaultExpanded && !hideHeader) return undefined;
    const timeoutId = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [defaultExpanded, hideHeader, loadData]);

  // ESC closes modals, "/" focuses search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setBuildingEditor(null);
        setFloorEditor(null);
        setApartmentEditor(null);
        setFloorBulkOpen(false);
        setApartmentBulkOpen(false);
      }
      const tag = document.activeElement?.tagName;
      if (
        e.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      ) {
        e.preventDefault();
        setActiveSection("inventory");
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // lock scroll when modal open
  const anyModalOpen =
    !!buildingEditor ||
    !!floorEditor ||
    !!apartmentEditor ||
    floorBulkOpen ||
    apartmentBulkOpen;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

  // smooth scroll to details when selection changes
  useEffect(() => {
    if (!selectedApartment) return;
    const id = setTimeout(
      () =>
        apartmentDetailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      120,
    );
    return () => clearTimeout(id);
  }, [activeSection, selectedApartment]);

  const buildingFloors = useMemo(
    () => floors.filter((f) => String(f.building) === String(selectedBuilding)),
    [floors, selectedBuilding],
  );
  const floorApartments = useMemo(
    () => apartments.filter((a) => String(a.floor) === String(selectedFloor)),
    [apartments, selectedFloor],
  );
  const activeBuilding = buildings.find(
    (i) => String(i.id) === String(selectedBuilding),
  );
  const activeFloor = floors.find(
    (i) => String(i.id) === String(selectedFloor),
  );
  const activeApartment = apartments.find(
    (i) => String(i.id) === String(selectedApartment),
  );
  const activeSale = sales.find(
    (i) => String(i.apartment) === String(selectedApartment) && i.status !== "CANCELLED",
  );

  const sortedBuildings = useMemo(
    () =>
      [...buildings].sort((a, b) =>
        String(a.name).localeCompare(String(b.name)),
      ),
    [buildings],
  );
  const sortedBuildingFloors = useMemo(
    () =>
      [...buildingFloors].sort(
        (a, b) => (a.floor_number ?? 0) - (b.floor_number ?? 0),
      ),
    [buildingFloors],
  );
  const sortedFloorApartments = useMemo(
    () =>
      [...floorApartments].sort((a, b) =>
        String(a.apartment_number).localeCompare(
          String(b.apartment_number),
          undefined,
          { numeric: true },
        ),
      ),
    [floorApartments],
  );
  const inventoryFloors = useMemo(
    () =>
      floors
        .filter(
          (f) =>
            !inventoryFilters.building ||
            String(f.building) === inventoryFilters.building,
        )
        .sort((a, b) => (a.floor_number ?? 0) - (b.floor_number ?? 0)),
    [floors, inventoryFilters.building],
  );
  const filteredApartments = useMemo(() => {
    const q = inventoryFilters.search.trim().toLowerCase();
    const list = apartments.filter((a) => {
      const searchable =
        `${a.apartment_number} ${a.apartment_type || ""} ${a.building_name || ""} ${a.floor_number}`.toLowerCase();
      return (
        (!q || searchable.includes(q)) &&
        (!inventoryFilters.building ||
          String(a.building) === inventoryFilters.building) &&
        (!inventoryFilters.floor ||
          String(a.floor) === inventoryFilters.floor) &&
        (!inventoryFilters.status || a.status === inventoryFilters.status)
      );
    });
    return [...list].sort((a, b) =>
      String(a.apartment_number).localeCompare(
        String(b.apartment_number),
        undefined,
        { numeric: true },
      ),
    );
  }, [apartments, inventoryFilters]);

  const buildingStats = useMemo(() => {
    const map = {};
    buildings.forEach((b) => {
      const bApts = apartments.filter(
        (a) => String(a.building) === String(b.id),
      );
      const bFloors = floors.filter((f) => String(f.building) === String(b.id));
      map[b.id] = {
        floors: bFloors.length,
        units: bApts.length,
        sold: bApts.filter((x) => x.status === "SOLD").length,
      };
    });
    return map;
  }, [buildings, floors, apartments]);

  const floorStats = useMemo(() => {
    const map = {};
    floors.forEach((f) => {
      const fApts = apartments.filter((a) => String(a.floor) === String(f.id));
      map[f.id] = {
        units: fApts.length,
        sold: fApts.filter((x) => x.status === "SOLD").length,
      };
    });
    return map;
  }, [floors, apartments]);

  const availableCount = apartments.filter(
    (a) => a.status === "AVAILABLE",
  ).length;
  const soldCount = apartments.filter((a) => a.status === "SOLD").length;
  const occupancy = apartments.length
    ? Math.round((soldCount / apartments.length) * 100)
    : 0;
  const hasInventoryFilters = Object.values(inventoryFilters).some(Boolean);
  const activeFilterCount =
    Object.values(inventoryFilters).filter(Boolean).length;

  const getBuildingName = (id) =>
    buildings.find((b) => String(b.id) === String(id))?.name || "";
  const getFloorLabel = (id) => {
    const f = floors.find((x) => String(x.id) === String(id));
    if (!f) return "";
    return f.name || `${text("floor", "Floor")} ${f.floor_number}`;
  };

  const chooseBuilding = (id) => {
    setSelectedBuilding(String(id || ""));
    setSelectedFloor("");
    setSelectedApartment("");
  };
  const chooseFloor = (id) => {
    setSelectedFloor(String(id || ""));
    setSelectedApartment("");
  };
  const openApartment = (apartment) => {
    setSelectedBuilding(String(apartment.building));
    setSelectedFloor(String(apartment.floor));
    setSelectedApartment(String(apartment.id));
    setActiveSection("structure");
  };

  const saveBuilding = async (event) => {
    event.preventDefault();
    const values = buildingEditor.values;
    if (!values.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        project: project.id,
        name: values.name.trim(),
        description: values.description,
      };
      if (buildingEditor.id)
        await instance.patch(
          `/projects/buildings/${buildingEditor.id}/`,
          payload,
        );
      else await instance.post("/projects/buildings/", payload);
      setBuildingEditor(null);
      await loadData();
      toast.success(text("buildingSaved", "Building saved."));
    } finally {
      setSaving(false);
    }
  };

  const saveFloor = async (event) => {
    event.preventDefault();
    if (floorEditor.values.floor_number === "" || !selectedBuilding) return;
    setSaving(true);
    try {
      const payload = {
        building: Number(selectedBuilding),
        floor_number: Number(floorEditor.values.floor_number),
        name: floorEditor.values.name,
      };
      if (floorEditor.id)
        await instance.patch(`/projects/floors/${floorEditor.id}/`, payload);
      else await instance.post("/projects/floors/", payload);
      setFloorEditor(null);
      await loadData();
      toast.success(text("floorSaved", "Floor saved."));
    } finally {
      setSaving(false);
    }
  };

  const apartmentPayload = (values) => ({
    project: project.id,
    building: Number(selectedBuilding),
    floor: Number(selectedFloor),
    apartment_number: values.apartment_number,
    apartment_type: values.apartment_type,
    area: values.area === "" ? null : values.area,
    bedrooms: values.bedrooms === "" ? null : Number(values.bedrooms),
    description: values.description,
  });

  const saveApartment = async (event) => {
    event.preventDefault();
    if (!apartmentEditor.values.apartment_number.trim() || !selectedFloor)
      return;
    setSaving(true);
    try {
      const payload = apartmentPayload(apartmentEditor.values);
      if (apartmentEditor.id)
        await instance.patch(
          `/projects/apartments/${apartmentEditor.id}/`,
          payload,
        );
      else await instance.post("/projects/apartments/", payload);
      setApartmentEditor(null);
      await loadData();
      toast.success(text("apartmentSaved", "Apartment saved."));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (kind, id, label) => {
    if (!window.confirm(text("confirmDelete", `Delete ${label}?`))) return;
    await instance.delete(`/projects/${kind}/${id}/`);
    if (kind === "buildings") chooseBuilding("");
    if (kind === "floors") chooseFloor("");
    if (kind === "apartments") setSelectedApartment("");
    await loadData();
    toast.success(text("deleted", "Record deleted."));
  };

  const updateFloorRow = (index, field, value) => {
    setFloorDraft((cur) => ({
      ...cur,
      rows: cur.rows.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      ),
    }));
  };
  const updateApartmentRow = (index, field, value) => {
    setApartmentDraft((cur) => ({
      ...cur,
      rows: cur.rows.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      ),
    }));
  };

  const validateFloorRows = () => {
    const errors = {};
    const counts = {};
    floorDraft.rows.forEach((row) => {
      const key =
        row.floor_number === "" ? "" : String(Number(row.floor_number));
      counts[key] = (counts[key] || 0) + 1;
    });
    floorDraft.rows.forEach((row, index) => {
      if (row.floor_number === "")
        errors[index] = { floor_number: text("required", "Required.") };
      else if (counts[String(Number(row.floor_number))] > 1)
        errors[index] = {
          floor_number: text("duplicateFloor", "Duplicate floor number."),
        };
    });
    if (!floorDraft.building)
      errors.form = text("selectBuilding", "Select a building.");
    setFloorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitFloors = async (event) => {
    event.preventDefault();
    if (!validateFloorRows()) return;
    setSaving(true);
    try {
      await instance.post("/projects/floors/bulk/", {
        building: Number(floorDraft.building),
        rows: floorDraft.rows.map((row) => ({
          floor_number: Number(row.floor_number),
          name: row.name,
        })),
      });
      clearFloorDraft();
      setFloorErrors({});
      setFloorBulkOpen(false);
      await loadData();
      toast.success(text("floorsCreated", "Floors created."));
    } catch (error) {
      setFloorErrors(error?.response?.data?.errors?.rows || {});
    } finally {
      setSaving(false);
    }
  };

  const validateApartmentRows = () => {
    const errors = {};
    const counts = {};
    apartmentDraft.rows.forEach((row) => {
      const key = row.apartment_number.trim().toLocaleLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    apartmentDraft.rows.forEach((row, index) => {
      const rowErrors = {};
      const key = row.apartment_number.trim().toLocaleLowerCase();
      if (!key) rowErrors.apartment_number = text("required", "Required.");
      else if (counts[key] > 1)
        rowErrors.apartment_number = text(
          "duplicateApartment",
          "Duplicate apartment number.",
        );
      if (row.area !== "" && Number(row.area) < 0)
        rowErrors.area = text("nonNegative", "Must be zero or greater.");
      if (row.bedrooms !== "" && Number(row.bedrooms) < 0)
        rowErrors.bedrooms = text("nonNegative", "Must be zero or greater.");
      if (Object.keys(rowErrors).length) errors[index] = rowErrors;
    });
    if (!apartmentDraft.building)
      errors.form = text("selectBuilding", "Select a building.");
    else if (!apartmentDraft.floor)
      errors.form = text("selectFloor", "Select a floor.");
    setApartmentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submitApartments = async (event) => {
    event.preventDefault();
    if (!validateApartmentRows()) return;
    setSaving(true);
    try {
      await instance.post("/projects/apartments/bulk/", {
        project: project.id,
        building: Number(apartmentDraft.building),
        floor: Number(apartmentDraft.floor),
        rows: apartmentDraft.rows.map((row) => ({
          ...row,
          area: row.area === "" ? null : row.area,
          bedrooms: row.bedrooms === "" ? null : Number(row.bedrooms),
        })),
      });
      clearApartmentDraft();
      setApartmentErrors({});
      setApartmentBulkOpen(false);
      await loadData();
      toast.success(text("apartmentsCreated", "Apartments created."));
    } catch (error) {
      setApartmentErrors(error?.response?.data?.errors?.rows || {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      dir={isRTL ? "rtl" : "ltr"}
      className={
        hideHeader
          ? "space-y-6"
          : "overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
      }
    >
      {!hideHeader && (
        <button
          type="button"
          onClick={() => {
            if (!expanded) loadData();
            setExpanded((v) => !v);
          }}
          className="group flex w-full items-center justify-between gap-4 p-5 text-start transition hover:bg-[var(--hover)]/40 sm:p-6"
          aria-expanded={expanded}
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[16px] font-extrabold tracking-tight text-[var(--text)]">
                  {text("title", "Apartment Management")}
                </span>
                {apartments.length > 0 && (
                  <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-extrabold text-[var(--primary)] ring-1 ring-[var(--primary)]/20">
                    {apartments.length} {text("units", "units")} • {soldCount}{" "}
                    {text("sold", "sold")}
                  </span>
                )}
              </span>
              <span className="mt-1 block truncate text-[13px] text-[var(--muted)]">
                {text("subtitle", "Buildings, floors, and apartments")} •{" "}
                {project.name}
              </span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 md:inline-flex dark:text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              {availableCount} {text("available", "available")}
            </span>
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300",
                expanded
                  ? "rotate-180 border-transparent bg-[var(--primary)] text-white shadow-lg"
                  : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)]",
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </span>
          </span>
        </button>
      )}

      {expanded && (
        <div
          className={
            hideHeader
              ? "space-y-6"
              : "space-y-6 border-t border-[var(--border)] bg-[var(--bg)]/40 p-4 sm:p-6"
          }
        >
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="h-6 w-1/3 rounded-lg bg-[var(--hover)]" />
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-2xl bg-[var(--hover)]"
                    />
                  ))}
                </div>
                <div className="mt-4 h-3 rounded-full bg-[var(--hover)]" />
              </div>
              <div className="h-72 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--card)]" />
            </div>
          ) : (
            <>
              <div
                role="tablist"
                aria-label={text("sections", "Apartment management sections")}
                className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1 shadow-sm"
              >
                {[
                  {
                    id: "overview",
                    label: text("overview", "Overview"),
                    icon: LayoutGrid,
                  },
                  {
                    id: "inventory",
                    label: text("inventory", "Inventory"),
                    icon: DoorOpen,
                  },
                  {
                    id: "structure",
                    label: text("manageStructure", "Manage Structure"),
                    icon: Building2,
                  },
                ].map(({ id, label, icon: Icon }) => {
                  const isActive = activeSection === id;
                  return (
                    <button
                      key={id}
                      id={`apartment-${id}-tab`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`apartment-${id}-panel`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => setActiveSection(id)}
                      onKeyDown={(event) => {
                        const sectionIds = ["overview", "inventory", "structure"];
                        const currentIndex = sectionIds.indexOf(id);
                        let nextIndex;
                        if (event.key === "ArrowRight") {
                          nextIndex = (currentIndex + 1) % sectionIds.length;
                        } else if (event.key === "ArrowLeft") {
                          nextIndex =
                            (currentIndex - 1 + sectionIds.length) %
                            sectionIds.length;
                        } else if (event.key === "Home") {
                          nextIndex = 0;
                        } else if (event.key === "End") {
                          nextIndex = sectionIds.length - 1;
                        } else {
                          return;
                        }
                        event.preventDefault();
                        const nextId = sectionIds[nextIndex];
                        setActiveSection(nextId);
                        requestAnimationFrame(() =>
                          document
                            .getElementById(`apartment-${nextId}-tab`)
                            ?.focus(),
                        );
                      }}
                      className={cx(
                        "flex h-8 min-w-max items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30",
                        isActive
                          ? "border-[var(--primary)]/25 bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm"
                          : "border-transparent text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* HERO */}
              {activeSection === "overview" && (
              <div
                id="apartment-overview-panel"
                role="tabpanel"
                aria-labelledby="apartment-overview-tab"
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="text-[17px] font-extrabold tracking-tight text-[var(--text)]">
                          {text("inventoryTitle", "All Apartments")}
                        </h3>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                          {filteredApartments.length} / {apartments.length}
                        </span>
                      </div>
                      <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[var(--muted)]">
                        {text(
                          "inventorySubtitle",
                          "Search the complete project inventory and open any apartment.",
                        )}{" "}
                        {project.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {(selectedBuilding ||
                        selectedFloor ||
                        selectedApartment) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            chooseBuilding("");
                          }}
                        >
                          {text("clearSelection", "Clear selection")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={loadData}
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                      >
                        {text("refresh", "Refresh")}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                    <PremiumStat
                      icon={Building2}
                      label={text("buildings", "Buildings")}
                      value={buildings.length}
                      tone="primary"
                    />
                    <PremiumStat
                      icon={Layers}
                      label={text("floors", "Floors")}
                      value={floors.length}
                      tone="amber"
                    />
                    <PremiumStat
                      icon={DoorOpen}
                      label={text("totalApartments", "Total Apartments")}
                      value={apartments.length}
                      tone="blue"
                    />
                    <PremiumStat
                      icon={CheckCircle2}
                      label={text("availableApartments", "Available")}
                      value={availableCount}
                      tone="emerald"
                    />
                    <PremiumStat
                      icon={BadgeCheck}
                      label={text("soldApartments", "Sold")}
                      value={soldCount}
                      tone="blue"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[var(--muted)]">
                        {text("occupancy", "Occupancy")} • {soldCount}{" "}
                        {text("sold", "sold")}
                      </span>
                      <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 tabular-nums text-[var(--primary)]">
                        {occupancy}%
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--hover)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* INVENTORY */}
              {activeSection === "inventory" && (
              <div
                id="apartment-inventory-panel"
                role="tabpanel"
                aria-labelledby="apartment-inventory-tab"
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--hover)] text-[var(--muted)]">
                      <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[var(--text)]">
                        {text("inventory", "Inventory")}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        {text("clickRow", "Click any row to open details")}
                      </p>
                    </div>
                  </div>
                  {hasInventoryFilters && (
                    <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-extrabold text-[var(--primary)]">
                      {activeFilterCount} {text("active", "active")}
                    </span>
                  )}
                </div>

                <div className="border-b border-[var(--border)] bg-[var(--bg)]/60 p-4 sm:p-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
                    <label className={labelClass}>
                      {text("searchApartments", "Search apartments")}
                      <span className="relative mt-1.5 block">
                        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                          ref={searchRef}
                          type="search"
                          className={cx(inputClass, "ps-10 pe-14")}
                          placeholder={text(
                            "searchPlaceholder",
                            "Number, type, building, or floor",
                          )}
                          value={inventoryFilters.search}
                          onChange={(e) =>
                            setInventoryFilters((c) => ({
                              ...c,
                              search: e.target.value,
                            }))
                          }
                        />
                        <span className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                          {inventoryFilters.search && (
                            <button
                              type="button"
                              aria-label="Clear search"
                              onClick={() =>
                                setInventoryFilters((c) => ({
                                  ...c,
                                  search: "",
                                }))
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <kbd className="hidden h-6 w-6 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--card)] text-[11px] font-bold text-[var(--muted)] sm:inline-flex">
                            /
                          </kbd>
                        </span>
                      </span>
                    </label>
                    {[
                      {
                        k: "building",
                        label: text("building", "Building"),
                        options: buildings.map((b) => ({ v: b.id, l: b.name })),
                        all: text("allBuildings", "All buildings"),
                      },
                      {
                        k: "floor",
                        label: text("floor", "Floor"),
                        options: inventoryFloors.map((f) => ({
                          v: f.id,
                          l: `${f.building_name} · ${f.name || `${text("floor", "Floor")} ${f.floor_number}`}`,
                        })),
                        all: text("allFloors", "All floors"),
                      },
                      {
                        k: "status",
                        label: text("status", "Status"),
                        options: [
                          { v: "AVAILABLE", l: text("AVAILABLE", "Available") },
                          { v: "SOLD", l: text("SOLD", "Sold") },
                        ],
                        all: text("allStatuses", "All statuses"),
                      },
                    ].map((f) => (
                      <label key={f.k} className={labelClass}>
                        {f.label}
                        <span className="relative mt-1.5 block">
                          <select
                            className={cx(inputClass, "appearance-none pe-9")}
                            value={inventoryFilters[f.k]}
                            onChange={(e) =>
                              setInventoryFilters((c) => ({
                                ...c,
                                [f.k]: e.target.value,
                                ...(f.k === "building" ? { floor: "" } : {}),
                              }))
                            }
                          >
                            <option value="">{f.all}</option>
                            {f.options.map((o) => (
                              <option key={o.v} value={o.v}>
                                {o.l}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                        </span>
                      </label>
                    ))}
                    <Button
                      variant="secondary"
                      className="self-end"
                      disabled={!hasInventoryFilters}
                      onClick={() => setInventoryFilters(emptyInventoryFilters)}
                      leftIcon={<FilterX className="h-4 w-4" />}
                    >
                      {text("clearFilters", "Clear")}
                    </Button>
                  </div>
                  {hasInventoryFilters && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {inventoryFilters.search && (
                        <button
                          type="button"
                          onClick={() =>
                            setInventoryFilters((c) => ({ ...c, search: "" }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary)]/15"
                        >
                          “{inventoryFilters.search}” <X className="h-3 w-3" />
                        </button>
                      )}
                      {inventoryFilters.building && (
                        <button
                          type="button"
                          onClick={() =>
                            setInventoryFilters((c) => ({
                              ...c,
                              building: "",
                              floor: "",
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--text)] hover:border-[var(--danger)]/30 hover:text-[var(--danger)]"
                        >
                          <Building2 className="h-3 w-3" />{" "}
                          {getBuildingName(inventoryFilters.building)}{" "}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {inventoryFilters.floor && (
                        <button
                          type="button"
                          onClick={() =>
                            setInventoryFilters((c) => ({ ...c, floor: "" }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--text)] hover:border-[var(--danger)]/30 hover:text-[var(--danger)]"
                        >
                          <Layers className="h-3 w-3" />{" "}
                          {getFloorLabel(inventoryFilters.floor)}{" "}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      {inventoryFilters.status && (
                        <button
                          type="button"
                          onClick={() =>
                            setInventoryFilters((c) => ({ ...c, status: "" }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--text)] hover:border-[var(--danger)]/30 hover:text-[var(--danger)]"
                        >
                          {text(
                            inventoryFilters.status,
                            inventoryFilters.status,
                          )}{" "}
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {!filteredApartments.length ? (
                    <EmptyState
                      icon={DoorOpen}
                      title={
                        apartments.length
                          ? text(
                              "noFilteredApartments",
                              "No apartments match these filters.",
                            )
                          : text("noApartments", "No apartments yet.")
                      }
                      desc={
                        apartments.length
                          ? text(
                              "changeFilters",
                              "Change or clear the filters to see more results.",
                            )
                          : text(
                              "createFirstApartment",
                              "Select a building and floor below to create the first apartment.",
                            )
                      }
                      action={
                        apartments.length ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setInventoryFilters(emptyInventoryFilters)
                            }
                            leftIcon={<FilterX className="h-4 w-4" />}
                          >
                            {text("clearFilters", "Clear")}
                          </Button>
                        ) : null
                      }
                    />
                  ) : (
                    <>
                      <div className="grid gap-3 md:hidden">
                        {filteredApartments.map((apartment) => (
                          <article
                            key={apartment.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 transition hover:border-[var(--primary)]/30 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[15px] font-extrabold text-[var(--primary)]">
                                  {String(apartment.apartment_number)?.[0] ||
                                    "#"}
                                </span>
                                <div>
                                  <p className="text-[16px] font-extrabold text-[var(--text)]">
                                    {apartment.apartment_number}
                                  </p>
                                  <p className="text-xs text-[var(--muted)]">
                                    {apartment.building_name} ·{" "}
                                    {text("floor", "Floor")}{" "}
                                    {apartment.floor_number}
                                  </p>
                                </div>
                              </div>
                              <ApartmentStatusBadge
                                status={apartment.status}
                                text={text}
                              />
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs">
                              <div>
                                <p className="font-semibold text-[var(--muted)]">
                                  {text("apartmentType", "Type")}
                                </p>
                                <p className="mt-0.5 truncate font-bold text-[var(--text)]">
                                  {apartment.apartment_type || "—"}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--muted)]">
                                  {text("area", "Area")}
                                </p>
                                <p className="mt-0.5 font-bold tabular-nums text-[var(--text)]">
                                  {apartment.area
                                    ? `${apartment.area} m²`
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--muted)]">
                                  {text("bedrooms", "Bedrooms")}
                                </p>
                                <p className="mt-0.5 font-bold tabular-nums text-[var(--text)]">
                                  {apartment.bedrooms ?? "—"}
                                </p>
                              </div>
                            </div>
                            <Button
                              className="mt-3 w-full"
                              size="sm"
                              variant="secondary"
                              onClick={() => openApartment(apartment)}
                              leftIcon={<Eye className="h-4 w-4" />}
                            >
                              {text("viewDetails", "View Details")}
                            </Button>
                          </article>
                        ))}
                      </div>

                      <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] md:block">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[920px] text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)] bg-[var(--hover)]/70 text-start text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                                <th className="p-3.5">
                                  {text("apartmentNumber", "Apartment")}
                                </th>
                                <th className="p-3.5">
                                  {text("building", "Building")}
                                </th>
                                <th className="p-3.5">
                                  {text("floor", "Floor")}
                                </th>
                                <th className="p-3.5">
                                  {text("apartmentType", "Type")}
                                </th>
                                <th className="p-3.5 text-end">
                                  {text("area", "Area")}
                                </th>
                                <th className="p-3.5 text-end">
                                  {text("bedrooms", "Bedrooms")}
                                </th>
                                <th className="p-3.5">
                                  {text("status", "Status")}
                                </th>
                                <th className="p-3.5 text-end">
                                  {text("actions", "Actions")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredApartments.map((apartment) => {
                                const isActive =
                                  String(apartment.id) ===
                                  String(selectedApartment);
                                return (
                                  <tr
                                    key={apartment.id}
                                    onClick={() => openApartment(apartment)}
                                    className={cx(
                                      "cursor-pointer border-b border-[var(--border)] transition last:border-0",
                                      isActive
                                        ? "bg-[var(--primary)]/[0.06]"
                                        : "hover:bg-[var(--hover)]/60",
                                    )}
                                  >
                                    <td className="p-3.5">
                                      <span className="flex items-center gap-3">
                                        <span
                                          className={cx(
                                            "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold",
                                            isActive
                                              ? "bg-[var(--primary)] text-white"
                                              : "bg-[var(--primary)]/10 text-[var(--primary)]",
                                          )}
                                        >
                                          {String(
                                            apartment.apartment_number,
                                          )?.[0] || "#"}
                                        </span>
                                        <span>
                                          <span className="block font-extrabold text-[var(--text)]">
                                            {apartment.apartment_number}
                                          </span>
                                          <span className="block text-xs text-[var(--muted)]">
                                            {apartment.apartment_type || "—"}
                                          </span>
                                        </span>
                                      </span>
                                    </td>
                                    <td className="p-3.5">
                                      <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text)]">
                                        <Building2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                                        {apartment.building_name}
                                      </span>
                                    </td>
                                    <td className="p-3.5">
                                      <span className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs font-extrabold tabular-nums">
                                        F {apartment.floor_number}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-[var(--muted)]">
                                      {apartment.apartment_type || "—"}
                                    </td>
                                    <td className="p-3.5 text-end tabular-nums text-[var(--muted)]">
                                      {apartment.area
                                        ? `${apartment.area} m²`
                                        : "—"}
                                    </td>
                                    <td className="p-3.5 text-end tabular-nums text-[var(--muted)]">
                                      {apartment.bedrooms ?? "—"}
                                    </td>
                                    <td className="p-3.5">
                                      <ApartmentStatusBadge
                                        status={apartment.status}
                                        text={text}
                                      />
                                    </td>
                                    <td
                                      className="p-3.5 text-end"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openApartment(apartment)}
                                        leftIcon={<Eye className="h-4 w-4" />}
                                      >
                                        {text("viewDetails", "View Details")}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg)]/60 px-4 py-3 text-xs font-medium text-[var(--muted)]">
                          <span>
                            {text("showing", "Showing")}{" "}
                            <b className="text-[var(--text)]">
                              {filteredApartments.length}
                            </b>{" "}
                            {text("of", "of")}{" "}
                            <b className="text-[var(--text)]">
                              {apartments.length}
                            </b>
                          </span>
                          {hasInventoryFilters && (
                            <button
                              type="button"
                              onClick={() =>
                                setInventoryFilters(emptyInventoryFilters)
                              }
                              className="font-bold text-[var(--primary)] hover:underline"
                            >
                              {text("clearFilters", "Clear")}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              )}

              {/* STRUCTURE */}
              {activeSection === "structure" && (
              <div
                id="apartment-structure-panel"
                role="tabpanel"
                aria-labelledby="apartment-structure-tab"
                className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <LayoutGrid className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[var(--text)]">
                        {text("manageStructure", "Manage Structure")}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        {text(
                          "buildingHelp",
                          "Select a building to manage its floors and apartments.",
                        )}
                      </p>
                    </div>
                  </div>
                  {(selectedBuilding || selectedFloor) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => chooseBuilding("")}
                    >
                      {text("reset", "Reset")}
                    </Button>
                  )}
                </div>

                <div className="space-y-6 bg-[var(--bg)]/40 p-4 sm:p-6">
                  <div className="grid gap-3 lg:grid-cols-3">
                    {[
                      {
                        n: "01",
                        label: text("building", "Building"),
                        value: activeBuilding?.name || text("select", "Select"),
                        done: !!selectedBuilding,
                        active: !selectedBuilding,
                      },
                      {
                        n: "02",
                        label: text("floor", "Floor"),
                        value: activeFloor
                          ? activeFloor.name ||
                            `${text("floor", "Floor")} ${activeFloor.floor_number}`
                          : text("waitingBuilding", "Waiting for building"),
                        done: !!selectedFloor,
                        active: !!selectedBuilding && !selectedFloor,
                      },
                      {
                        n: "03",
                        label: text("apartments", "Apartments"),
                        value: selectedFloor
                          ? `${sortedFloorApartments.length} ${text("units", "units")}`
                          : text("waitingFloor", "Waiting for floor"),
                        done: !!selectedApartment,
                        active: !!selectedFloor && !selectedApartment,
                      },
                    ].map((s) => (
                      <div
                        key={s.n}
                        className={cx(
                          "flex items-center gap-3 rounded-2xl border p-3.5 transition",
                          s.done
                            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                            : s.active
                              ? "border-[var(--primary)]/30 bg-[var(--primary)]/[0.06]"
                              : "border-[var(--border)] bg-[var(--card)] opacity-70",
                        )}
                      >
                        <span
                          className={cx(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold",
                            s.done
                              ? "bg-emerald-500 text-white"
                              : s.active
                                ? "bg-[var(--primary)] text-white shadow-md"
                                : "bg-[var(--hover)] text-[var(--muted)]",
                          )}
                        >
                          {s.done ? <Check className="h-4 w-4" /> : s.n}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                            {s.label}
                          </span>
                          <span className="block truncate text-sm font-extrabold text-[var(--text)]">
                            {s.value}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="flex items-center gap-2.5 text-[15px] font-extrabold text-[var(--text)]">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-extrabold text-white">
                        01
                      </span>
                      {text("buildings", "Buildings")}
                      <span className="rounded-full bg-[var(--hover)] px-2 py-0.5 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                        {buildings.length}
                      </span>
                    </h4>
                    <PermissionWrapper permissions={["buildings.create"]}>
                      <Button
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() =>
                          setBuildingEditor({
                            id: null,
                            values: { name: "", description: "" },
                          })
                        }
                      >
                        {text("addBuilding", "Add Building")}
                      </Button>
                    </PermissionWrapper>
                  </div>

                  {sortedBuildings.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {sortedBuildings.map((building) => {
                        const st = buildingStats[building.id] || {
                          floors: 0,
                          units: 0,
                          sold: 0,
                        };
                        const pct = st.units
                          ? Math.round((st.sold / st.units) * 100)
                          : 0;
                        const isActive =
                          String(building.id) === String(selectedBuilding);
                        return (
                          <div
                            key={building.id}
                            onClick={() => chooseBuilding(building.id)}
                            className={cx(
                              "group relative cursor-pointer overflow-hidden rounded-2xl border-2 bg-[var(--card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                              isActive
                                ? "border-[var(--primary)] shadow-[0_16px_40px_-16px_var(--primary)] ring-4 ring-[var(--primary)]/10"
                                : "border-[var(--border)] hover:border-[var(--primary)]/40",
                            )}
                          >
                            {isActive && (
                              <span className="absolute end-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-md">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <div className="flex items-start gap-3 pe-8">
                              <span
                                className={cx(
                                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition",
                                  isActive
                                    ? "bg-[var(--primary)] text-white shadow-md"
                                    : "bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white",
                                )}
                              >
                                <Building2 className="h-5 w-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-extrabold text-[var(--text)]">
                                  {building.name}
                                </span>
                                <span className="mt-0.5 line-clamp-2 block min-h-8 text-xs leading-relaxed text-[var(--muted)]">
                                  {building.description ||
                                    text("noDescription", "No description")}
                                </span>
                              </span>
                            </div>
                            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-[var(--muted)]">
                                  {st.floors} {text("floors", "Floors")} •{" "}
                                  {st.units} {text("units", "units")}
                                </span>
                                <span className="tabular-nums text-[var(--primary)]">
                                  {pct}% {text("sold", "sold")}
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--hover)]">
                                <div
                                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="mt-2 flex justify-between text-[11px] font-semibold text-[var(--muted)]">
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {st.units - st.sold}{" "}
                                  {text("available", "available")}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                                  {st.sold} {text("sold", "sold")}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                              <span
                                className={cx(
                                  "inline-flex items-center gap-1 text-xs font-extrabold",
                                  isActive
                                    ? "text-[var(--primary)]"
                                    : "text-[var(--muted)] group-hover:text-[var(--primary)]",
                                )}
                              >
                                {isActive
                                  ? text("selected", "Selected")
                                  : text("manage", "Manage")}
                                <ArrowRight
                                  className={cx(
                                    "h-3.5 w-3.5 transition-transform",
                                    isRTL && "rotate-180",
                                    !isActive &&
                                      "group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5",
                                  )}
                                />
                              </span>
                              <span
                                className="flex gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <PermissionWrapper
                                  permissions={["buildings.update"]}
                                >
                                  <IconBtn
                                    label={`${text("edit", "Edit")} ${building.name}`}
                                    onClick={() =>
                                      setBuildingEditor({
                                        id: building.id,
                                        values: {
                                          name: building.name,
                                          description:
                                            building.description || "",
                                        },
                                      })
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </IconBtn>
                                </PermissionWrapper>
                                <PermissionWrapper
                                  permissions={["buildings.delete"]}
                                >
                                  <IconBtn
                                    danger
                                    label={`${text("delete", "Delete")} ${building.name}`}
                                    onClick={() =>
                                      deleteItem(
                                        "buildings",
                                        building.id,
                                        building.name,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </IconBtn>
                                </PermissionWrapper>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Building2}
                      title={text("noBuildings", "No buildings yet.")}
                      desc={text(
                        "noBuildingsDesc",
                        "Create your first building to start organizing floors and apartments.",
                      )}
                      action={
                        <PermissionWrapper permissions={["buildings.create"]}>
                          <Button
                            size="sm"
                            leftIcon={<Plus className="h-4 w-4" />}
                            onClick={() =>
                              setBuildingEditor({
                                id: null,
                                values: { name: "", description: "" },
                              })
                            }
                          >
                            {text("addBuilding", "Add Building")}
                          </Button>
                        </PermissionWrapper>
                      }
                    />
                  )}

                  {!activeBuilding ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--card)]/60 p-8 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--hover)] text-[var(--muted)]">
                        <Layers className="h-6 w-6" />
                      </span>
                      <p className="mt-3 text-sm font-extrabold text-[var(--text)]">
                        {text(
                          "selectBuildingFirst",
                          "Select a building above to manage floors",
                        )}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {text(
                          "selectBuildingHint",
                          "Floors belong to a building. Pick one to continue.",
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="flex min-w-0 items-center gap-2.5 text-[15px] font-extrabold text-[var(--text)]">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-extrabold text-white">
                            02
                          </span>
                          <span className="truncate">
                            {activeBuilding.name}: {text("floors", "Floors")}
                          </span>
                          <span className="rounded-full bg-[var(--hover)] px-2 py-0.5 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                            {sortedBuildingFloors.length}
                          </span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <PermissionWrapper permissions={["floors.create"]}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setFloorEditor({
                                  id: null,
                                  values: { floor_number: "", name: "" },
                                })
                              }
                            >
                              {text("addFloor", "Add Floor")}
                            </Button>
                          </PermissionWrapper>
                          <PermissionWrapper
                            permissions={["floors.bulk_create"]}
                          >
                            <Button
                              size="sm"
                              leftIcon={<Plus className="h-4 w-4" />}
                              onClick={() => {
                                setFloorDraft((c) => ({
                                  ...c,
                                  building: String(activeBuilding.id),
                                }));
                                setFloorBulkOpen(true);
                              }}
                            >
                              {text("bulkFloors", "Bulk Add Floors")}
                            </Button>
                          </PermissionWrapper>
                        </div>
                      </div>
                      {activeBuilding.description && (
                        <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                          {activeBuilding.description}
                        </p>
                      )}
                      <div className="mt-4">
                        {sortedBuildingFloors.length ? (
                          <div className="flex flex-wrap gap-2.5">
                            {sortedBuildingFloors.map((floor) => {
                              const isActive =
                                String(floor.id) === String(selectedFloor);
                              const count = floorStats[floor.id]?.units || 0;
                              return (
                                <div
                                  key={floor.id}
                                  className={cx(
                                    "flex items-center overflow-hidden rounded-2xl border-2 transition-all duration-200",
                                    isActive
                                      ? "scale-[1.02] border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_28px_-10px_var(--primary)]"
                                      : "border-[var(--border)] bg-[var(--bg)] hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-md",
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => chooseFloor(floor.id)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-start"
                                  >
                                    <span
                                      className={cx(
                                        "flex h-8 w-8 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums",
                                        isActive
                                          ? "bg-white/20 text-white"
                                          : "bg-[var(--primary)]/10 text-[var(--primary)]",
                                      )}
                                    >
                                      {floor.floor_number}
                                    </span>
                                    <span>
                                      <span
                                        className={cx(
                                          "block max-w-32 truncate text-sm font-extrabold leading-tight",
                                          isActive
                                            ? "text-white"
                                            : "text-[var(--text)]",
                                        )}
                                      >
                                        {floor.name ||
                                          `${text("floor", "Floor")} ${floor.floor_number}`}
                                      </span>
                                      <span
                                        className={cx(
                                          "block text-[11px] font-bold tabular-nums",
                                          isActive
                                            ? "text-white/80"
                                            : "text-[var(--muted)]",
                                        )}
                                      >
                                        {count} {text("units", "units")}
                                      </span>
                                    </span>
                                  </button>
                                  <span
                                    className={cx(
                                      "flex items-center gap-0.5 pe-2",
                                      isActive ? "text-white" : "",
                                    )}
                                  >
                                    <PermissionWrapper
                                      permissions={["floors.update"]}
                                    >
                                      <button
                                        type="button"
                                        aria-label={`${text("edit", "Edit")} ${floor.floor_number}`}
                                        onClick={() =>
                                          setFloorEditor({
                                            id: floor.id,
                                            values: {
                                              floor_number: floor.floor_number,
                                              name: floor.name || "",
                                            },
                                          })
                                        }
                                        className={cx(
                                          "rounded-lg p-1.5 transition hover:bg-black/10",
                                          isActive
                                            ? "hover:bg-white/20"
                                            : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--primary)]",
                                        )}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    </PermissionWrapper>
                                    <PermissionWrapper
                                      permissions={["floors.delete"]}
                                    >
                                      <button
                                        type="button"
                                        aria-label={`${text("delete", "Delete")} ${floor.floor_number}`}
                                        onClick={() =>
                                          deleteItem(
                                            "floors",
                                            floor.id,
                                            `${text("floor", "Floor")} ${floor.floor_number}`,
                                          )
                                        }
                                        className={cx(
                                          "rounded-lg p-1.5 transition",
                                          isActive
                                            ? "hover:bg-white/20"
                                            : "text-[var(--muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]",
                                        )}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </PermissionWrapper>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <EmptyState
                            icon={Layers}
                            title={text("noFloors", "No floors yet.")}
                            desc={text(
                              "noFloorsDesc",
                              "Add floors one by one or bulk-create a whole range at once.",
                            )}
                            action={
                              <PermissionWrapper
                                permissions={["floors.bulk_create"]}
                              >
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setFloorDraft((c) => ({
                                      ...c,
                                      building: String(activeBuilding.id),
                                    }));
                                    setFloorBulkOpen(true);
                                  }}
                                  leftIcon={<Plus className="h-4 w-4" />}
                                >
                                  {text("bulkFloors", "Bulk Add Floors")}
                                </Button>
                              </PermissionWrapper>
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {activeFloor && activeBuilding && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="flex min-w-0 items-center gap-2.5 text-[15px] font-extrabold text-[var(--text)]">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-extrabold text-white">
                            03
                          </span>
                          <span className="truncate">
                            {activeFloor.name ||
                              `${text("floor", "Floor")} ${activeFloor.floor_number}`}
                            : {text("apartments", "Apartments")}
                          </span>
                          <span className="rounded-full bg-[var(--hover)] px-2 py-0.5 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                            {sortedFloorApartments.length}
                          </span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <PermissionWrapper
                            permissions={["apartments.create"]}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setApartmentEditor({
                                  id: null,
                                  values: blankApartmentRow(),
                                })
                              }
                            >
                              {text("addApartment", "Add Apartment")}
                            </Button>
                          </PermissionWrapper>
                          <PermissionWrapper
                            permissions={["apartments.bulk_create"]}
                          >
                            <Button
                              size="sm"
                              leftIcon={<Plus className="h-4 w-4" />}
                              onClick={() => {
                                setApartmentDraft((c) => ({
                                  ...c,
                                  building: String(activeBuilding.id),
                                  floor: String(activeFloor.id),
                                }));
                                setApartmentBulkOpen(true);
                              }}
                            >
                              {text("bulkApartments", "Bulk Add Apartments")}
                            </Button>
                          </PermissionWrapper>
                        </div>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[680px] text-start text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)] bg-[var(--hover)]/70 text-[11px] font-extrabold uppercase tracking-wider text-[var(--muted)]">
                                <th className="p-3">
                                  {text("apartmentNumber", "Apartment number")}
                                </th>
                                <th className="p-3">
                                  {text("apartmentType", "Type")}
                                </th>
                                <th className="p-3 text-end">
                                  {text("area", "Area")}
                                </th>
                                <th className="p-3 text-end">
                                  {text("bedrooms", "Bedrooms")}
                                </th>
                                <th className="p-3">
                                  {text("status", "Status")}
                                </th>
                                <th className="p-3 text-end">
                                  {text("actions", "Actions")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedFloorApartments.map((apartment) => {
                                const isActive =
                                  String(apartment.id) ===
                                  String(selectedApartment);
                                return (
                                  <tr
                                    key={apartment.id}
                                    onClick={() =>
                                      setSelectedApartment(String(apartment.id))
                                    }
                                    className={cx(
                                      "cursor-pointer border-b border-[var(--border)] transition last:border-0",
                                      isActive
                                        ? "bg-[var(--primary)]/[0.06]"
                                        : "hover:bg-[var(--hover)]/50",
                                    )}
                                  >
                                    <td className="p-3 font-extrabold text-[var(--text)]">
                                      <span className="inline-flex items-center gap-2">
                                        <span
                                          className={cx(
                                            "h-2 w-2 rounded-full",
                                            apartment.status === "SOLD"
                                              ? "bg-[var(--primary)]"
                                              : "bg-emerald-500",
                                          )}
                                        />
                                        {apartment.apartment_number}
                                      </span>
                                    </td>
                                    <td className="p-3 text-[var(--muted)]">
                                      {apartment.apartment_type || "—"}
                                    </td>
                                    <td className="p-3 text-end tabular-nums text-[var(--muted)]">
                                      {apartment.area
                                        ? `${apartment.area} m²`
                                        : "—"}
                                    </td>
                                    <td className="p-3 text-end tabular-nums text-[var(--muted)]">
                                      {apartment.bedrooms ?? "—"}
                                    </td>
                                    <td className="p-3">
                                      <ApartmentStatusBadge
                                        status={apartment.status}
                                        text={text}
                                      />
                                    </td>
                                    <td className="p-3">
                                      <div className="flex justify-end gap-1">
                                        <IconBtn
                                          label={`${text("view", "View")} ${apartment.apartment_number}`}
                                          onClick={() =>
                                            setSelectedApartment(
                                              String(apartment.id),
                                            )
                                          }
                                          className="!text-[var(--primary)] hover:!bg-[var(--primary)]/10"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </IconBtn>
                                        <PermissionWrapper
                                          permissions={["apartments.update"]}
                                        >
                                          <IconBtn
                                            label={`${text("edit", "Edit")} ${apartment.apartment_number}`}
                                            onClick={() =>
                                              setApartmentEditor({
                                                id: apartment.id,
                                                values: {
                                                  apartment_number:
                                                    apartment.apartment_number,
                                                  apartment_type:
                                                    apartment.apartment_type ||
                                                    "",
                                                  area: apartment.area || "",
                                                  bedrooms:
                                                    apartment.bedrooms ?? "",
                                                  description:
                                                    apartment.description || "",
                                                },
                                              })
                                            }
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </IconBtn>
                                        </PermissionWrapper>
                                        <PermissionWrapper
                                          permissions={["apartments.delete"]}
                                        >
                                          <IconBtn
                                            danger
                                            label={`${text("delete", "Delete")} ${apartment.apartment_number}`}
                                            onClick={() =>
                                              deleteItem(
                                                "apartments",
                                                apartment.id,
                                                apartment.apartment_number,
                                              )
                                            }
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </IconBtn>
                                        </PermissionWrapper>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {!sortedFloorApartments.length && (
                          <EmptyState
                            icon={DoorOpen}
                            title={text("noApartments", "No apartments yet.")}
                            desc={text(
                              "noApartmentsDesc",
                              "Add the first apartment on this floor or bulk-create many at once.",
                            )}
                          />
                        )}
                      </div>

                      {activeApartment && (
                        <div
                          ref={apartmentDetailsRef}
                          className="mt-4 scroll-mt-6 overflow-hidden rounded-xl border border-[var(--primary)]/25 bg-[var(--bg)] shadow-sm"
                        >
                          <div className="overflow-hidden border-b border-[var(--border)] bg-[var(--primary)]/[0.04] p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
                                  <span className="truncate">
                                    {project.name}
                                  </span>
                                  <ChevronRight
                                    className={cx(
                                      "h-3.5 w-3.5 shrink-0",
                                      isRTL && "rotate-180",
                                    )}
                                  />
                                  <span className="truncate">
                                    {activeApartment.building_name}
                                  </span>
                                  <ChevronRight
                                    className={cx(
                                      "h-3.5 w-3.5 shrink-0",
                                      isRTL && "rotate-180",
                                    )}
                                  />
                                  <span>F {activeApartment.floor_number}</span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                  <h4 className="text-[22px] font-extrabold tracking-tight text-[var(--text)]">
                                    #{activeApartment.apartment_number}
                                  </h4>
                                  <ApartmentStatusBadge
                                    status={activeApartment.status}
                                    text={text}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                aria-label={text("close", "Close")}
                                onClick={() => setSelectedApartment("")}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--card)] text-[var(--muted)] shadow-sm ring-1 ring-[var(--border)] transition hover:text-[var(--text)]"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              {[
                                {
                                  icon: Home,
                                  k: text("apartmentType", "Type"),
                                  v: activeApartment.apartment_type || "—",
                                },
                                {
                                  icon: Ruler,
                                  k: text("area", "Area"),
                                  v: activeApartment.area
                                    ? `${activeApartment.area} m²`
                                    : "—",
                                },
                                {
                                  icon: BedDouble,
                                  k: text("bedrooms", "Bedrooms"),
                                  v: activeApartment.bedrooms ?? "—",
                                },
                                {
                                  icon: Building2,
                                  k: text("building", "Building"),
                                  v: activeApartment.building_name,
                                },
                              ].map((m) => (
                                <div
                                  key={m.k}
                                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-3 backdrop-blur"
                                >
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                    <m.icon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                                      {m.k}
                                    </span>
                                    <span className="block truncate text-sm font-extrabold text-[var(--text)]">
                                      {m.v}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                            {activeApartment.description && (
                              <div className="mt-3 flex gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/80 p-3.5 text-sm leading-relaxed text-[var(--text)]">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                                <span>{activeApartment.description}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 sm:p-5">
                            <PermissionWrapper
                              permissions={[
                                "apartment_sales.view",
                                "apartment_sales.create",
                                "apartment_sales.update",
                                "apartment_sales.cancel",
                                "apartment_payments.view",
                                "apartment_payments.create",
                              ]}
                            >
                              <ApartmentSalesPanel
                                key={activeApartment.id}
                                apartment={activeApartment}
                                customers={customers}
                                sale={activeSale}
                                project={project}
                                onRefresh={loadData}
                              />
                            </PermissionWrapper>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              )}
            </>
          )}
        </div>
      )}

      {/* BUILDING MODAL */}
      <Modal
        open={!!buildingEditor}
        onClose={() => setBuildingEditor(null)}
        title={
          buildingEditor?.id
            ? text("editBuilding", "Edit Building")
            : text("addBuilding", "Add Building")
        }
        subtitle={project.name}
        icon={Building2}
        footer={
          <>
            <span className="text-xs text-[var(--muted)]">
              {text("requiredFields", "Name is required")}
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBuildingEditor(null)}
              >
                {text("cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                form="building-form"
                disabled={saving}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )
                }
              >
                {text("save", "Save")}
              </Button>
            </span>
          </>
        }
      >
        {buildingEditor && (
          <form
            id="building-form"
            onSubmit={saveBuilding}
            className="grid gap-4"
          >
            <label className={labelClass}>
              {text("buildingName", "Building name")} *
              <input
                autoFocus
                required
                className={cx(inputClass, "mt-1.5")}
                placeholder="e.g. Block A"
                value={buildingEditor.values.name}
                onChange={(e) =>
                  setBuildingEditor((c) => ({
                    ...c,
                    values: { ...c.values, name: e.target.value },
                  }))
                }
              />
            </label>
            <label className={labelClass}>
              {text("description", "Description")}
              <textarea
                rows={3}
                className={cx(
                  inputClass,
                  "mt-1.5 h-auto min-h-20 py-3 leading-relaxed",
                )}
                placeholder={text("buildingDescPh", "Entrance, side, notes…")}
                value={buildingEditor.values.description}
                onChange={(e) =>
                  setBuildingEditor((c) => ({
                    ...c,
                    values: { ...c.values, description: e.target.value },
                  }))
                }
              />
            </label>
          </form>
        )}
      </Modal>

      {/* FLOOR MODAL */}
      <Modal
        open={!!floorEditor}
        onClose={() => setFloorEditor(null)}
        title={
          floorEditor?.id
            ? text("editFloor", "Edit Floor")
            : text("addFloor", "Add Floor")
        }
        subtitle={`${text("building", "Building")}: ${activeBuilding?.name || "—"}`}
        icon={Layers}
        footer={
          <>
            <span className="text-xs text-[var(--muted)]">
              {activeBuilding?.name}
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFloorEditor(null)}
              >
                {text("cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                form="floor-form"
                disabled={saving}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )
                }
              >
                {text("save", "Save")}
              </Button>
            </span>
          </>
        }
      >
        {floorEditor && (
          <form
            id="floor-form"
            onSubmit={saveFloor}
            className="grid gap-4 sm:grid-cols-2"
          >
            <label className={labelClass}>
              {text("floorNumber", "Floor number")} *
              <span className="relative mt-1.5 block">
                <Hash className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  required
                  type="number"
                  className={cx(inputClass, "ps-9")}
                  placeholder="0"
                  value={floorEditor.values.floor_number}
                  onChange={(e) =>
                    setFloorEditor((c) => ({
                      ...c,
                      values: { ...c.values, floor_number: e.target.value },
                    }))
                  }
                />
              </span>
            </label>
            <label className={labelClass}>
              {text("floorName", "Floor name (optional)")}
              <input
                className={cx(inputClass, "mt-1.5")}
                placeholder="e.g. Ground, Penthouse"
                value={floorEditor.values.name}
                onChange={(e) =>
                  setFloorEditor((c) => ({
                    ...c,
                    values: { ...c.values, name: e.target.value },
                  }))
                }
              />
            </label>
          </form>
        )}
      </Modal>

      {/* APARTMENT MODAL */}
      <Modal
        open={!!apartmentEditor}
        onClose={() => setApartmentEditor(null)}
        title={
          apartmentEditor?.id
            ? text("editApartment", "Edit Apartment")
            : text("addApartment", "Add Apartment")
        }
        subtitle={`${activeBuilding?.name || ""} • ${activeFloor?.name || `${text("floor", "Floor")} ${activeFloor?.floor_number || ""}`}`}
        icon={DoorOpen}
        maxWidth="max-w-3xl"
        footer={
          <>
            <span className="text-xs text-[var(--muted)]">
              {text("aptRequired", "Apartment number is required")}
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setApartmentEditor(null)}
              >
                {text("cancel", "Cancel")}
              </Button>
              <Button
                type="submit"
                form="apartment-form"
                disabled={saving}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )
                }
              >
                {text("save", "Save")}
              </Button>
            </span>
          </>
        }
      >
        {apartmentEditor && (
          <form
            id="apartment-form"
            onSubmit={saveApartment}
            className="grid gap-4 sm:grid-cols-2"
          >
            {[
              {
                f: "apartment_number",
                l: text("apartmentNumber", "Apartment number"),
                t: "text",
                req: true,
                ph: "e.g. 101",
              },
              {
                f: "apartment_type",
                l: text("apartmentType", "Apartment type"),
                t: "text",
                ph: "e.g. 2+1",
              },
              { f: "area", l: text("area", "Area"), t: "number", ph: "m²" },
              {
                f: "bedrooms",
                l: text("bedrooms", "Bedrooms"),
                t: "number",
                ph: "e.g. 2",
              },
            ].map((fld) => (
              <label key={fld.f} className={labelClass}>
                {fld.l} {fld.req && "*"}
                <input
                  required={!!fld.req}
                  type={fld.t}
                  min={fld.t === "number" ? 0 : undefined}
                  step={fld.f === "area" ? "0.01" : undefined}
                  placeholder={fld.ph}
                  className={cx(inputClass, "mt-1.5")}
                  value={apartmentEditor.values[fld.f]}
                  onChange={(e) =>
                    setApartmentEditor((c) => ({
                      ...c,
                      values: { ...c.values, [fld.f]: e.target.value },
                    }))
                  }
                />
              </label>
            ))}
            <label className={cx(labelClass, "sm:col-span-2")}>
              {text("description", "Description")}
              <textarea
                rows={3}
                className={cx(inputClass, "mt-1.5 h-auto min-h-20 py-3")}
                placeholder={text("descPh", "View, features, notes…")}
                value={apartmentEditor.values.description}
                onChange={(e) =>
                  setApartmentEditor((c) => ({
                    ...c,
                    values: { ...c.values, description: e.target.value },
                  }))
                }
              />
            </label>
          </form>
        )}
      </Modal>

      {/* BULK FLOORS */}
      <Modal
        open={floorBulkOpen}
        onClose={() => setFloorBulkOpen(false)}
        title={text("bulkFloors", "Bulk Add Floors")}
        subtitle={`${project.name} • ${text("draftAutoSaved", "Draft auto-saves & resumes")}`}
        icon={Layers}
        maxWidth="max-w-3xl"
        footer={
          <>
            <span className="flex items-center gap-2">
              {!floorDraftIsEmpty(floorDraft) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {text("draftSaved", "Draft auto-saved")}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  clearFloorDraft();
                  setFloorErrors({});
                }}
                className="text-xs font-bold text-[var(--muted)] underline-offset-2 hover:text-[var(--danger)] hover:underline"
              >
                {text("discardDraft", "Discard Draft")}
              </button>
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFloorBulkOpen(false)}
              >
                {text("close", "Close")}
              </Button>
              <Button
                type="submit"
                form="bulk-floors-form"
                disabled={saving}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                {text("createFloors", "Create Floors")} •{" "}
                {floorDraft.rows.length}
              </Button>
            </span>
          </>
        }
      >
        <form
          id="bulk-floors-form"
          onSubmit={submitFloors}
          className="space-y-4"
        >
          <label className={labelClass}>
            {text("building", "Building")} *
            <span className="relative mt-1.5 block">
              <select
                className={cx(inputClass, "appearance-none pe-9")}
                value={floorDraft.building}
                onChange={(e) =>
                  setFloorDraft((c) => ({ ...c, building: e.target.value }))
                }
              >
                <option value="">
                  {text("selectBuilding", "Select a building")}
                </option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            </span>
          </label>
          <FieldError value={floorErrors.form} />
          <div className="space-y-3">
            {floorDraft.rows.map((row, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-[var(--hover)] px-2.5 py-1 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                    #{index + 1}
                  </span>
                  <IconBtn
                    danger
                    label={`${text("removeRow", "Remove row")} ${index + 1}`}
                    onClick={() =>
                      setFloorDraft((c) => ({
                        ...c,
                        rows: c.rows.filter((_, i) => i !== index),
                      }))
                    }
                    className={cx(
                      floorDraft.rows.length === 1 &&
                        "pointer-events-none opacity-30",
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                  <label className="text-xs font-bold text-[var(--muted)]">
                    {text("floorNumber", "Floor number")} *
                    <input
                      aria-label={`${text("floorNumber", "Floor number")} ${index + 1}`}
                      required
                      type="number"
                      className={cx(inputClass, "mt-1.5")}
                      value={row.floor_number}
                      onChange={(e) =>
                        updateFloorRow(index, "floor_number", e.target.value)
                      }
                    />
                    <FieldError value={floorErrors[index]?.floor_number} />
                  </label>
                  <label className="text-xs font-bold text-[var(--muted)]">
                    {text("floorName", "Floor name (optional)")}
                    <input
                      aria-label={`${text("floorName", "Floor name")} ${index + 1}`}
                      className={cx(inputClass, "mt-1.5")}
                      value={row.name}
                      onChange={(e) =>
                        updateFloorRow(index, "name", e.target.value)
                      }
                    />
                    <FieldError value={floorErrors[index]?.name} />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setFloorDraft((c) => ({
                ...c,
                rows: [...c.rows, blankFloorRow()],
              }))
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] p-4 text-sm font-extrabold text-[var(--primary)] transition hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
          >
            <Plus className="h-4 w-4" /> {text("addRow", "Add Floor")}
          </button>
        </form>
      </Modal>

      {/* BULK APARTMENTS */}
      <Modal
        open={apartmentBulkOpen}
        onClose={() => setApartmentBulkOpen(false)}
        title={text("bulkApartments", "Bulk Add Apartments")}
        subtitle={`${project.name} • ${text("draftAutoSaved", "Draft auto-saves & resumes")}`}
        icon={DoorOpen}
        maxWidth="max-w-4xl"
        footer={
          <>
            <span className="flex items-center gap-2">
              {!apartmentDraftIsEmpty(apartmentDraft) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {text("draftSaved", "Draft auto-saved")}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  clearApartmentDraft();
                  setApartmentErrors({});
                }}
                className="text-xs font-bold text-[var(--muted)] underline-offset-2 hover:text-[var(--danger)] hover:underline"
              >
                {text("discardDraft", "Discard Draft")}
              </button>
            </span>
            <span className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setApartmentBulkOpen(false)}
              >
                {text("close", "Close")}
              </Button>
              <Button
                type="submit"
                form="bulk-apartments-form"
                disabled={saving}
                leftIcon={
                  saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                {text("createApartments", "Create Apartments")} •{" "}
                {apartmentDraft.rows.length}
              </Button>
            </span>
          </>
        }
      >
        <form
          id="bulk-apartments-form"
          onSubmit={submitApartments}
          className="space-y-4"
        >
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <label className={labelClass}>
              {text("building", "Building")} *
              <span className="relative mt-1.5 block">
                <select
                  className={cx(inputClass, "appearance-none pe-9")}
                  value={apartmentDraft.building}
                  onChange={(e) =>
                    setApartmentDraft((c) => ({
                      ...c,
                      building: e.target.value,
                      floor: "",
                    }))
                  }
                >
                  <option value="">
                    {text("selectBuilding", "Select a building")}
                  </option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </span>
            </label>
            <span className="hidden justify-center pb-3 text-[var(--muted)] sm:flex">
              <ArrowRight className={cx("h-5 w-5", isRTL && "rotate-180")} />
            </span>
            <label className={labelClass}>
              {text("floor", "Floor")} *
              <span className="relative mt-1.5 block">
                <select
                  className={cx(inputClass, "appearance-none pe-9")}
                  value={apartmentDraft.floor}
                  onChange={(e) =>
                    setApartmentDraft((c) => ({ ...c, floor: e.target.value }))
                  }
                >
                  <option value="">
                    {text("selectFloor", "Select a floor")}
                  </option>
                  {floors
                    .filter(
                      (f) =>
                        String(f.building) === String(apartmentDraft.building),
                    )
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name ||
                          `${text("floor", "Floor")} ${f.floor_number}`}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              </span>
            </label>
          </div>
          {apartmentErrors.form && (
            <p className="flex items-center gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-3 text-[13px] font-bold text-[var(--danger)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {firstError(apartmentErrors.form)}
            </p>
          )}
          <div className="space-y-3">
            {apartmentDraft.rows.map((row, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3.5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-lg bg-[var(--hover)] px-2.5 py-1 text-xs font-extrabold tabular-nums text-[var(--muted)]">
                    #{index + 1}
                  </span>
                  <IconBtn
                    danger
                    label={`${text("removeRow", "Remove row")} ${index + 1}`}
                    onClick={() =>
                      setApartmentDraft((c) => ({
                        ...c,
                        rows: c.rows.filter((_, i) => i !== index),
                      }))
                    }
                    className={cx(
                      apartmentDraft.rows.length === 1 &&
                        "pointer-events-none opacity-30",
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      f: "apartment_number",
                      l: text("apartmentNumber", "Apartment number"),
                      ty: "text",
                      req: true,
                    },
                    {
                      f: "apartment_type",
                      l: text("apartmentType", "Apartment type"),
                      ty: "text",
                    },
                    { f: "area", l: text("area", "Area"), ty: "number" },
                    {
                      f: "bedrooms",
                      l: text("bedrooms", "Bedrooms"),
                      ty: "number",
                    },
                  ].map((fld) => (
                    <label
                      key={fld.f}
                      className="text-xs font-bold text-[var(--muted)]"
                    >
                      {fld.l} {fld.req && "*"}
                      <input
                        aria-label={`${fld.l} ${index + 1}`}
                        required={!!fld.req}
                        type={fld.ty}
                        min={fld.ty === "number" ? 0 : undefined}
                        step={fld.f === "area" ? "0.01" : undefined}
                        className={cx(inputClass, "mt-1.5")}
                        value={row[fld.f]}
                        onChange={(e) =>
                          updateApartmentRow(index, fld.f, e.target.value)
                        }
                      />
                      <FieldError value={apartmentErrors[index]?.[fld.f]} />
                    </label>
                  ))}
                  <label className="text-xs font-bold text-[var(--muted)] sm:col-span-2">
                    {text("description", "Description")}
                    <input
                      aria-label={`${text("description", "Description")} ${index + 1}`}
                      className={cx(inputClass, "mt-1.5")}
                      value={row.description}
                      onChange={(e) =>
                        updateApartmentRow(index, "description", e.target.value)
                      }
                    />
                    <FieldError value={apartmentErrors[index]?.description} />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setApartmentDraft((c) => ({
                ...c,
                rows: [...c.rows, blankApartmentRow()],
              }))
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] p-4 text-sm font-extrabold text-[var(--primary)] transition hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5"
          >
            <Plus className="h-4 w-4" />{" "}
            {text("addRowApartment", "Add Apartment Row")}
          </button>
        </form>
      </Modal>
    </section>
  );
}
