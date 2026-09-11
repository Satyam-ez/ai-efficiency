"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/bug-board/api";
import { hydrateRegistry } from "@/lib/bug-board/data";
import { attachmentKindOf } from "@/lib/bug-board/format";
import {
  activeFilterCount,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  filterBugs,
  isOpen,
  sortBugs,
  summarize,
  type ArrayFilterKey,
  type BugFilters,
  type Sort,
  type SortKey,
  type SummaryCard,
} from "@/lib/bug-board/filters";
import type {
  Bug,
  BugDraft,
  DeveloperStatus,
  Priority,
  Project,
  Severity,
  TesterStatus,
} from "@/lib/bug-board/types";

export const PAGE_SIZES = [10, 25, 50] as const;

export type DetailTab = "details" | "activity" | "comments";

/** Everything the project dialog collects. */
export interface ProjectDraft {
  name: string;
  description: string;
}

export interface ProjectStats {
  project: Project;
  total: number;
  open: number;
  unassigned: number;
}

/** `null` targets the current view, otherwise an explicit list of bug ids. */
export type ShareTarget = string[] | null;

export interface AttachmentTarget {
  bugId: string;
  attachmentId: string;
}

export interface NewComment {
  bugId: string;
  body: string;
  code: string | null;
  parentId: string | null;
  /** Files staged in the composer; uploaded before the comment is posted. */
  files: File[];
}

interface BugBoardValue {
  /** Every bug on the board, in every project. */
  bugs: Bug[];
  /** The bugs inside the active project, or all of them when unscoped. */
  scopedBugs: Bug[];
  /** Filtered and sorted, before pagination. */
  visibleBugs: Bug[];
  /** The rows rendered on the current page. */
  pageBugs: Bug[];
  summary: SummaryCard[];
  getBug: (id: string | null | undefined) => Bug | undefined;

  /** True while the first load is in flight. */
  loading: boolean;
  /** Set when the board could not be loaded at all. */
  loadError: string | null;
  refresh: () => Promise<void>;
  /** True while a write is in flight, for disabling destructive controls. */
  saving: boolean;

  projects: Project[];
  /** `null` while the board shows every project at once. */
  activeProjectId: string | null;
  activeProject: Project | undefined;
  setActiveProject: (projectId: string | null) => void;
  getProject: (id: string | null | undefined) => Project | undefined;
  projectName: (id: string | null | undefined) => string;
  /** The project a new bug is filed into unless the user picks another. */
  defaultProjectId: string;
  /** Per-project counts, in board order, for the switcher. */
  projectStats: ProjectStats[];
  createProject: (draft: ProjectDraft) => Promise<Project | undefined>;
  updateProject: (id: string, draft: ProjectDraft) => Promise<void>;
  /**
   * Removes a project. Its bugs move to `moveToId`; passing `null` is only
   * honoured when the project is already empty.
   */
  deleteProject: (id: string, moveToId: string | null) => Promise<void>;
  moveBugsToProject: (ids: string[], projectId: string) => Promise<void>;

  filters: BugFilters;
  filterCount: number;
  setQuery: (query: string) => void;
  patchFilters: (patch: Partial<BugFilters>) => void;
  toggleFilterValue: (key: ArrayFilterKey, value: string) => void;
  clearFilterFacet: (key: ArrayFilterKey) => void;
  resetFilters: () => void;

  sort: Sort;
  toggleSort: (key: SortKey) => void;

  page: number;
  pageSize: number;
  pageCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  selectedIds: string[];
  isSelected: (id: string) => boolean;
  toggleSelected: (id: string) => void;
  /** Replaces the selection with the given ids, or clears it. */
  setSelection: (ids: string[]) => void;

  createBug: (draft: BugDraft, files: File[]) => Promise<Bug | undefined>;
  updateBugDetails: (
    id: string,
    draft: BugDraft,
    files: File[]
  ) => Promise<void>;
  duplicateBug: (id: string) => Promise<Bug | undefined>;
  deleteBugs: (ids: string[]) => Promise<void>;
  setTesterStatus: (ids: string[], status: TesterStatus) => Promise<void>;
  setDeveloperStatus: (ids: string[], status: DeveloperStatus) => Promise<void>;
  setSeverity: (ids: string[], severity: Severity) => Promise<void>;
  setPriority: (ids: string[], priority: Priority) => Promise<void>;
  assignBugs: (ids: string[], assigneeId: string | null) => Promise<void>;
  addAttachments: (bugId: string, files: File[]) => Promise<void>;
  removeAttachment: (bugId: string, attachmentId: string) => Promise<void>;
  addComment: (comment: NewComment) => Promise<void>;
  toggleReaction: (
    bugId: string,
    commentId: string,
    emoji: string
  ) => Promise<void>;

  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
  /** Set while the form dialog is editing an existing bug. */
  editBugId: string | null;
  openEdit: (bugId: string) => void;
  detailBugId: string | null;
  detailTab: DetailTab;
  openDetail: (bugId: string, tab?: DetailTab) => void;
  setDetailTab: (tab: DetailTab) => void;
  closeDetail: () => void;
  preview: AttachmentTarget | null;
  openPreview: (target: AttachmentTarget) => void;
  closePreview: () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;

  /** `create`, or the id of the project being edited. */
  projectDialog: "create" | string | null;
  openProjectDialog: (target: "create" | string) => void;
  closeProjectDialog: () => void;
  /** The bugs being handed over, or `null` when the dialog is closed. */
  shareTarget: ShareTarget | undefined;
  openShare: (target?: ShareTarget) => void;
  closeShare: () => void;
}

const BugBoardContext = createContext<BugBoardValue | null>(null);

/** The payload shape the create/update endpoints take. */
function toPayload(draft: BugDraft): Record<string, unknown> {
  return {
    projectId: draft.projectId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    module: draft.module,
    component: draft.component,
    severity: draft.severity,
    priority: draft.priority,
    reporterId: draft.reporterId,
    assigneeId: draft.assigneeId,
    watcherIds: draft.watcherIds,
    environment: draft.environment,
    browser: draft.browser,
    device: draft.device,
    os: draft.os,
    sprint: draft.sprint,
    labels: draft.labels,
    // Sent as the raw textarea string; the server strips any numbering the user
    // typed and splits it into steps, so both ends agree on one rule.
    stepsToReproduce: draft.stepsToReproduce,
    expectedResult: draft.expectedResult.trim(),
    actualResult: draft.actualResult.trim(),
  };
}

export function BugBoardProvider({ children }: { children: ReactNode }) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BugFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGE_SIZES[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editBugId, setEditBugId] = useState<string | null>(null);
  const [detailBugId, setDetailBugId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("details");
  const [preview, setPreview] = useState<AttachmentTarget | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [projectDialog, setProjectDialog] = useState<"create" | string | null>(
    null
  );
  const [shareTarget, setShareTarget] = useState<ShareTarget | undefined>(
    undefined
  );

  const refresh = useCallback(async () => {
    const [meta, nextProjects, nextBugs] = await Promise.all([
      api.meta(),
      api.projects(),
      api.bugs(),
    ]);
    // People and the dropdown option lists are read synchronously all over the
    // component tree, so they are filled in before the bugs land.
    hydrateRegistry(meta);
    setProjects(nextProjects);
    setBugs(nextBugs);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Everything that touches state does so after the await, so the effect body
    // itself stays free of synchronous renders.
    async function load() {
      try {
        await refresh();
      } catch (error: unknown) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "The board failed to load."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  /**
   * Runs a write, then reports failure where the user can see it.
   *
   * Returning `undefined` on failure is what lets call sites skip their success
   * toast without every one of them growing a try/catch.
   */
  const run = useCallback(
    async <T,>(work: () => Promise<T>): Promise<T | undefined> => {
      setSaving(true);
      try {
        return await work();
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "That change could not be saved."
        );
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  /** Replaces one bug with the server's copy, activity and comments included. */
  const syncBug = useCallback(async (key: string) => {
    const fresh = await api.bug(key);
    setBugs((previous) =>
      previous.map((bug) => (bug.id === key ? fresh : bug))
    );
    return fresh;
  }, []);

  const syncBugs = useCallback(async (keys: string[]) => {
    const fresh = await Promise.all(keys.map((key) => api.bug(key)));
    const byId = new Map(fresh.map((bug) => [bug.id, bug]));
    setBugs((previous) => previous.map((bug) => byId.get(bug.id) ?? bug));
  }, []);

  // The project scope sits above the filters: everything below this line, the
  // summary cards included, only ever sees the active project's bugs.
  const scopedBugs = useMemo(
    () =>
      activeProjectId
        ? bugs.filter((bug) => bug.projectId === activeProjectId)
        : bugs,
    [activeProjectId, bugs]
  );

  const visibleBugs = useMemo(
    () => sortBugs(filterBugs(scopedBugs, filters), sort),
    [scopedBugs, filters, sort]
  );

  const pageCount = Math.max(1, Math.ceil(visibleBugs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageBugs = useMemo(
    () =>
      visibleBugs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, visibleBugs]
  );

  const summary = useMemo(() => summarize(scopedBugs), [scopedBugs]);

  const getBug = useCallback(
    (id: string | null | undefined) =>
      id ? bugs.find((bug) => bug.id === id) : undefined,
    [bugs]
  );

  const getProject = useCallback(
    (id: string | null | undefined) =>
      id ? projects.find((project) => project.id === id) : undefined,
    [projects]
  );

  const projectName = useCallback(
    (id: string | null | undefined) => getProject(id)?.name ?? "No project",
    [getProject]
  );

  const activeProject = getProject(activeProjectId);

  const projectStats = useMemo<ProjectStats[]>(
    () =>
      projects.map((project) => {
        const owned = bugs.filter((bug) => bug.projectId === project.id);
        const open = owned.filter(isOpen);
        return {
          project,
          total: owned.length,
          open: open.length,
          unassigned: open.filter((bug) => !bug.assigneeId).length,
        };
      }),
    [bugs, projects]
  );

  /**
   * Switching project starts a clean view: no stale selection, page one. An id
   * this board does not know, such as a link to a project made elsewhere, falls
   * back to showing everything rather than an empty board.
   */
  const setActiveProject = useCallback(
    (projectId: string | null) => {
      setActiveProjectId(
        projectId && projects.some((project) => project.id === projectId)
          ? projectId
          : null
      );
      setSelectedIds([]);
      setPageState(1);
      setFilters((previous) => ({ ...previous, projectIds: [], bugIds: [] }));
    },
    [projects]
  );

  const createProject = useCallback(
    async (draft: ProjectDraft) => {
      const project = await run(() =>
        api.createProject({
          name: draft.name.trim(),
          description: draft.description.trim(),
        })
      );
      if (!project) return undefined;
      setProjects((previous) => [...previous, project]);
      setActiveProjectId(project.id);
      setSelectedIds([]);
      setPageState(1);
      return project;
    },
    [run]
  );

  const updateProject = useCallback(
    async (id: string, draft: ProjectDraft) => {
      const project = await run(() =>
        api.updateProject(id, {
          name: draft.name.trim(),
          description: draft.description.trim(),
        })
      );
      if (!project) return;
      setProjects((previous) =>
        previous.map((item) => (item.id === id ? project : item))
      );
    },
    [run]
  );

  const moveBugsToProject = useCallback(
    async (ids: string[], projectId: string) => {
      const result = await run(() => api.bulk(ids, "move", projectId));
      if (!result) return;
      await syncBugs(ids);
    },
    [run, syncBugs]
  );

  const deleteProject = useCallback(
    async (id: string, moveToId: string | null) => {
      const owned = bugs.filter((bug) => bug.projectId === id);
      // The server refuses to orphan bugs, so a destination is required
      // whenever the project still holds any.
      if (owned.length > 0 && (!moveToId || moveToId === id)) return;
      const done = await run(async () => {
        await api.deleteProject(id, owned.length > 0 ? moveToId : null);
        return true;
      });
      if (!done) return;
      setProjects((previous) => previous.filter((project) => project.id !== id));
      setActiveProjectId((previous) => (previous === id ? moveToId : previous));
      if (owned.length > 0) {
        await syncBugs(owned.map((bug) => bug.id));
      }
    },
    [bugs, run, syncBugs]
  );

  const setQuery = useCallback((query: string) => {
    setFilters((previous) => ({ ...previous, query }));
    setPageState(1);
  }, []);

  const patchFilters = useCallback((patch: Partial<BugFilters>) => {
    setFilters((previous) => ({ ...previous, ...patch }));
    setPageState(1);
  }, []);

  const toggleFilterValue = useCallback(
    (key: ArrayFilterKey, value: string) => {
      setFilters((previous) => {
        const current = previous[key] as string[];
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...previous, [key]: next };
      });
      setPageState(1);
    },
    []
  );

  const clearFilterFacet = useCallback((key: ArrayFilterKey) => {
    setFilters((previous) => ({ ...previous, [key]: [] }));
    setPageState(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters((previous) => ({ ...EMPTY_FILTERS, query: previous.query }));
    setPageState(1);
  }, []);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
        : {
            key,
            direction:
              key === "createdAt" || key === "updatedAt" ? "desc" : "asc",
          }
    );
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }, []);

  /** Uploads staged evidence onto a bug that now exists. */
  const uploadFiles = useCallback(async (key: string, files: File[]) => {
    for (const file of files) {
      await api.uploadAttachment(key, file, attachmentKindOf(file));
    }
  }, []);

  const createBug = useCallback(
    async (draft: BugDraft, files: File[]) => {
      const created = await run(async () => {
        const bug = await api.createBug(toPayload(draft));
        // The bug has to exist before its evidence can hang off it, so the
        // files follow the create rather than riding along with it.
        if (files.length > 0) {
          await uploadFiles(bug.id, files);
          return api.bug(bug.id);
        }
        return bug;
      });
      if (!created) return undefined;
      setBugs((previous) => [created, ...previous]);
      setPageState(1);
      return created;
    },
    [run, uploadFiles]
  );

  const updateBugDetails = useCallback(
    async (id: string, draft: BugDraft, files: File[]) => {
      const done = await run(async () => {
        await api.updateBug(id, toPayload(draft));
        if (files.length > 0) await uploadFiles(id, files);
        return true;
      });
      if (!done) return;
      await syncBug(id);
    },
    [run, syncBug, uploadFiles]
  );

  const duplicateBug = useCallback(
    async (id: string) => {
      const copy = await run(() => api.duplicateBug(id));
      if (!copy) return undefined;
      setBugs((previous) => [copy, ...previous]);
      setPageState(1);
      return copy;
    },
    [run]
  );

  const deleteBugs = useCallback(
    async (ids: string[]) => {
      const done = await run(() => api.bulk(ids, "delete"));
      if (!done) return;
      const targets = new Set(ids);
      setBugs((previous) => previous.filter((bug) => !targets.has(bug.id)));
      setSelectedIds((previous) => previous.filter((id) => !targets.has(id)));
      setDetailBugId((previous) =>
        previous && targets.has(previous) ? null : previous
      );
    },
    [run]
  );

  /** Every status-style change is the same shape: one bulk call, then resync. */
  const applyBulk = useCallback(
    async (
      ids: string[],
      action: "testerStatus" | "developerStatus" | "severity" | "priority" | "assign",
      value: string | null
    ) => {
      const result = await run(() => api.bulk(ids, action, value));
      if (!result) return;
      await syncBugs(ids);
    },
    [run, syncBugs]
  );

  const setTesterStatus = useCallback(
    (ids: string[], status: TesterStatus) =>
      applyBulk(ids, "testerStatus", status),
    [applyBulk]
  );

  const setDeveloperStatus = useCallback(
    (ids: string[], status: DeveloperStatus) =>
      applyBulk(ids, "developerStatus", status),
    [applyBulk]
  );

  const setSeverity = useCallback(
    (ids: string[], severity: Severity) => applyBulk(ids, "severity", severity),
    [applyBulk]
  );

  const setPriority = useCallback(
    (ids: string[], priority: Priority) => applyBulk(ids, "priority", priority),
    [applyBulk]
  );

  const assignBugs = useCallback(
    (ids: string[], assigneeId: string | null) =>
      applyBulk(ids, "assign", assigneeId),
    [applyBulk]
  );

  const addAttachments = useCallback(
    async (bugId: string, files: File[]) => {
      if (files.length === 0) return;
      const done = await run(async () => {
        await uploadFiles(bugId, files);
        return true;
      });
      if (!done) return;
      await syncBug(bugId);
    },
    [run, syncBug, uploadFiles]
  );

  const removeAttachment = useCallback(
    async (bugId: string, attachmentId: string) => {
      const done = await run(async () => {
        await api.deleteAttachment(attachmentId);
        return true;
      });
      if (!done) return;
      await syncBug(bugId);
    },
    [run, syncBug]
  );

  const addComment = useCallback(
    async ({ bugId, body, code, parentId, files }: NewComment) => {
      const done = await run(async () => {
        // Evidence is uploaded to the bug first, then claimed by the comment,
        // which is what makes it show up in both places.
        const uploaded = [];
        for (const file of files) {
          uploaded.push(
            await api.uploadAttachment(bugId, file, attachmentKindOf(file))
          );
        }
        await api.addComment(bugId, {
          body: body.trim(),
          code,
          parentId,
          attachmentIds: uploaded.map((attachment) => attachment.id),
        });
        return true;
      });
      if (!done) return;
      await syncBug(bugId);
    },
    [run, syncBug]
  );

  const toggleReaction = useCallback(
    async (bugId: string, commentId: string, emoji: string) => {
      const done = await run(async () => {
        await api.toggleReaction(commentId, emoji);
        return true;
      });
      if (!done) return;
      await syncBug(bugId);
    },
    [run, syncBug]
  );

  const defaultProjectId = activeProjectId ?? projects[0]?.id ?? "";

  const value = useMemo<BugBoardValue>(
    () => ({
      bugs,
      scopedBugs,
      visibleBugs,
      pageBugs,
      summary,
      getBug,
      loading,
      loadError,
      refresh,
      saving,
      projects,
      activeProjectId,
      activeProject,
      setActiveProject,
      getProject,
      projectName,
      defaultProjectId,
      projectStats,
      createProject,
      updateProject,
      deleteProject,
      moveBugsToProject,
      filters,
      filterCount: activeFilterCount(filters),
      setQuery,
      patchFilters,
      toggleFilterValue,
      clearFilterFacet,
      resetFilters,
      sort,
      toggleSort,
      page: currentPage,
      pageSize,
      pageCount,
      setPage: setPageState,
      setPageSize,
      selectedIds,
      isSelected,
      toggleSelected,
      setSelection: setSelectedIds,
      createBug,
      updateBugDetails,
      duplicateBug,
      deleteBugs,
      setTesterStatus,
      setDeveloperStatus,
      setSeverity,
      setPriority,
      assignBugs,
      addAttachments,
      removeAttachment,
      addComment,
      toggleReaction,
      createOpen,
      openCreate: () => {
        setEditBugId(null);
        setCreateOpen(true);
      },
      closeCreate: () => setCreateOpen(false),
      editBugId,
      openEdit: (bugId: string) => {
        setEditBugId(bugId);
        setCreateOpen(true);
      },
      detailBugId,
      detailTab,
      openDetail: (bugId: string, tab: DetailTab = "details") => {
        setDetailBugId(bugId);
        setDetailTab(tab);
      },
      setDetailTab,
      closeDetail: () => setDetailBugId(null),
      preview,
      openPreview: setPreview,
      closePreview: () => setPreview(null),
      shortcutsOpen,
      setShortcutsOpen,
      projectDialog,
      openProjectDialog: setProjectDialog,
      closeProjectDialog: () => setProjectDialog(null),
      shareTarget,
      openShare: (target: ShareTarget = null) => setShareTarget(target),
      closeShare: () => setShareTarget(undefined),
    }),
    [
      activeProject,
      activeProjectId,
      addAttachments,
      addComment,
      assignBugs,
      bugs,
      clearFilterFacet,
      createBug,
      createOpen,
      createProject,
      currentPage,
      defaultProjectId,
      deleteBugs,
      deleteProject,
      detailBugId,
      detailTab,
      duplicateBug,
      editBugId,
      filters,
      getBug,
      getProject,
      isSelected,
      loadError,
      loading,
      moveBugsToProject,
      pageBugs,
      pageCount,
      pageSize,
      patchFilters,
      preview,
      projectDialog,
      projectName,
      projectStats,
      projects,
      refresh,
      removeAttachment,
      resetFilters,
      saving,
      scopedBugs,
      selectedIds,
      setActiveProject,
      setDeveloperStatus,
      setPageSize,
      setPriority,
      setQuery,
      setSeverity,
      setTesterStatus,
      shareTarget,
      shortcutsOpen,
      sort,
      summary,
      toggleFilterValue,
      toggleReaction,
      toggleSelected,
      toggleSort,
      updateBugDetails,
      updateProject,
      visibleBugs,
    ]
  );

  return (
    <BugBoardContext.Provider value={value}>{children}</BugBoardContext.Provider>
  );
}

export function useBugBoard(): BugBoardValue {
  const context = useContext(BugBoardContext);
  if (!context) {
    throw new Error("useBugBoard must be used inside a BugBoardProvider");
  }
  return context;
}
