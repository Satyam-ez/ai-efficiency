"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CURRENT_USER_ID,
  nextBugId,
  personName,
  SEED_BUGS,
  SEED_PROJECTS,
} from "@/lib/bug-board/data";
import { createId, nowStamp } from "@/lib/bug-board/format";
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
import {
  DEVELOPER_STATUS_LABELS,
  SEVERITY_LABELS,
  TESTER_STATUS_LABELS,
  type ActivityEntry,
  type ActivityKind,
  type Attachment,
  type Bug,
  type BugDraft,
  type Comment,
  type DeveloperStatus,
  type Priority,
  type Project,
  type Severity,
  type TesterStatus,
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
  attachments: Attachment[];
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

  projects: Project[];
  /** `null` while the board shows every project at once. */
  activeProjectId: string | null;
  activeProject: Project | undefined;
  setActiveProject: (projectId: string | null) => void;
  getProject: (id: string | null | undefined) => Project | undefined;
  projectName: (id: string | null | undefined) => string;
  /** Per-project counts, in board order, for the switcher. */
  projectStats: ProjectStats[];
  createProject: (draft: ProjectDraft) => Project;
  updateProject: (id: string, draft: ProjectDraft) => void;
  /**
   * Removes a project. Its bugs move to `moveToId`; passing `null` is only
   * honoured when the project is already empty.
   */
  deleteProject: (id: string, moveToId: string | null) => void;
  moveBugsToProject: (ids: string[], projectId: string) => void;

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

  createBug: (draft: BugDraft) => Bug;
  updateBugDetails: (id: string, draft: BugDraft) => void;
  duplicateBug: (id: string) => Bug | undefined;
  deleteBugs: (ids: string[]) => void;
  setTesterStatus: (ids: string[], status: TesterStatus) => void;
  setDeveloperStatus: (ids: string[], status: DeveloperStatus) => void;
  setSeverity: (ids: string[], severity: Severity) => void;
  setPriority: (ids: string[], priority: Priority) => void;
  assignBugs: (ids: string[], assigneeId: string | null) => void;
  addAttachments: (bugId: string, attachments: Attachment[]) => void;
  removeAttachment: (bugId: string, attachmentId: string) => void;
  addComment: (comment: NewComment) => void;
  toggleReaction: (bugId: string, commentId: string, emoji: string) => void;

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

function entry(
  kind: ActivityKind,
  summary: string,
  from?: string,
  to?: string
): ActivityEntry {
  return {
    id: createId("act"),
    kind,
    actorId: CURRENT_USER_ID,
    at: nowStamp(),
    summary,
    from,
    to,
  };
}

/** The steps textarea is free text; numbering the user typed is stripped. */
function splitSteps(value: string): string[] {
  return value
    .split("\n")
    .map((step) => step.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
}

export function BugBoardProvider({ children }: { children: ReactNode }) {
  const [bugs, setBugs] = useState<Bug[]>(SEED_BUGS);
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
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

  /** Applies a patch plus its activity entries to a set of bugs. */
  const patchBugs = useCallback(
    (
      ids: string[],
      build: (bug: Bug) => { patch: Partial<Bug>; activity?: ActivityEntry[] } | null
    ) => {
      const targets = new Set(ids);
      setBugs((previous) =>
        previous.map((bug) => {
          if (!targets.has(bug.id)) return bug;
          const change = build(bug);
          if (!change) return bug;
          return {
            ...bug,
            ...change.patch,
            activity: [...bug.activity, ...(change.activity ?? [])],
            updatedAt: nowStamp(),
          };
        })
      );
    },
    []
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

  const createProject = useCallback((draft: ProjectDraft) => {
    const project: Project = {
      id: createId("proj"),
      name: draft.name.trim(),
      description: draft.description.trim(),
      createdAt: nowStamp(),
    };
    setProjects((previous) => [...previous, project]);
    setActiveProjectId(project.id);
    setSelectedIds([]);
    setPageState(1);
    return project;
  }, []);

  const updateProject = useCallback((id: string, draft: ProjectDraft) => {
    setProjects((previous) =>
      previous.map((project) =>
        project.id === id
          ? {
              ...project,
              name: draft.name.trim(),
              description: draft.description.trim(),
            }
          : project
      )
    );
  }, []);

  const moveBugsToProject = useCallback(
    (ids: string[], projectId: string) =>
      patchBugs(ids, (bug) =>
        bug.projectId === projectId
          ? null
          : {
              patch: { projectId },
              activity: [
                entry(
                  "moved",
                  "moved this to another project",
                  projectName(bug.projectId),
                  projectName(projectId)
                ),
              ],
            }
      ),
    [patchBugs, projectName]
  );

  const deleteProject = useCallback(
    (id: string, moveToId: string | null) => {
      const owned = bugs.filter((bug) => bug.projectId === id);
      if (owned.length > 0) {
        if (!moveToId || moveToId === id) return;
        moveBugsToProject(
          owned.map((bug) => bug.id),
          moveToId
        );
      }
      setProjects((previous) => previous.filter((project) => project.id !== id));
      setActiveProjectId((previous) => (previous === id ? moveToId : previous));
    },
    [bugs, moveBugsToProject]
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
        : { key, direction: key === "createdAt" || key === "updatedAt" ? "desc" : "asc" }
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

  const createBug = useCallback((draft: BugDraft) => {
    const at = nowStamp();
    const steps = splitSteps(draft.stepsToReproduce);

    let created: Bug | undefined;
    setBugs((previous) => {
      const bug: Bug = {
        id: nextBugId(previous),
        projectId: draft.projectId,
        title: draft.title.trim(),
        description: draft.description.trim(),
        module: draft.module,
        component: draft.component,
        severity: draft.severity,
        priority: draft.priority,
        testerStatus: "open",
        developerStatus: draft.assigneeId ? "assigned" : "backlog",
        reporterId: draft.reporterId,
        assigneeId: draft.assigneeId,
        watcherIds: draft.watcherIds,
        environment: draft.environment,
        browser: draft.browser,
        device: draft.device,
        os: draft.os,
        sprint: draft.sprint,
        labels: draft.labels,
        stepsToReproduce: steps,
        expectedResult: draft.expectedResult.trim(),
        actualResult: draft.actualResult.trim(),
        attachments: draft.attachments,
        activity: [
          {
            id: createId("act"),
            kind: "created",
            actorId: draft.reporterId,
            at,
            summary: "reported this bug",
          },
          ...(draft.attachments.length > 0
            ? [
                {
                  id: createId("act"),
                  kind: "attachment" as const,
                  actorId: draft.reporterId,
                  at,
                  summary: `attached ${draft.attachments.length} file${
                    draft.attachments.length === 1 ? "" : "s"
                  }`,
                },
              ]
            : []),
          ...(draft.assigneeId
            ? [
                {
                  id: createId("act"),
                  kind: "assigned" as const,
                  actorId: draft.reporterId,
                  at,
                  summary: `assigned this to ${personName(draft.assigneeId)}`,
                },
              ]
            : []),
        ],
        comments: [],
        createdAt: at,
        updatedAt: at,
      };
      created = bug;
      return [bug, ...previous];
    });
    setPageState(1);
    return created as Bug;
  }, []);

  const updateBugDetails = useCallback(
    (id: string, draft: BugDraft) =>
      patchBugs([id], (bug) => {
        const activity: ActivityEntry[] = [entry("edited", "edited the details")];
        if (bug.severity !== draft.severity) {
          activity.push(
            entry(
              "severity",
              "changed severity",
              SEVERITY_LABELS[bug.severity],
              SEVERITY_LABELS[draft.severity]
            )
          );
        }
        if (bug.priority !== draft.priority) {
          activity.push(
            entry("priority", "changed priority", bug.priority, draft.priority)
          );
        }
        if (bug.projectId !== draft.projectId) {
          activity.push(
            entry(
              "moved",
              "moved this to another project",
              projectName(bug.projectId),
              projectName(draft.projectId)
            )
          );
        }
        if (bug.assigneeId !== draft.assigneeId) {
          activity.push(
            entry(
              "assigned",
              draft.assigneeId
                ? `assigned this to ${personName(draft.assigneeId)}`
                : "removed the assignee",
              bug.assigneeId ? personName(bug.assigneeId) : "Unassigned",
              draft.assigneeId ? personName(draft.assigneeId) : "Unassigned"
            )
          );
        }

        return {
          patch: {
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
            stepsToReproduce: splitSteps(draft.stepsToReproduce),
            expectedResult: draft.expectedResult.trim(),
            actualResult: draft.actualResult.trim(),
            attachments: draft.attachments,
            developerStatus:
              draft.assigneeId && bug.developerStatus === "backlog"
                ? "assigned"
                : bug.developerStatus,
          },
          activity,
        };
      }),
    [patchBugs, projectName]
  );

  const duplicateBug = useCallback(
    (id: string) => {
      const source = bugs.find((bug) => bug.id === id);
      if (!source) return undefined;
      const at = nowStamp();
      let copy: Bug | undefined;
      setBugs((previous) => {
        const bug: Bug = {
          ...source,
          id: nextBugId(previous),
          title: `${source.title} (copy)`,
          testerStatus: "open",
          developerStatus: source.assigneeId ? "assigned" : "backlog",
          comments: [],
          activity: [
            {
              id: createId("act"),
              kind: "created",
              actorId: CURRENT_USER_ID,
              at,
              summary: `duplicated ${source.id}`,
            },
          ],
          createdAt: at,
          updatedAt: at,
        };
        copy = bug;
        return [bug, ...previous];
      });
      setPageState(1);
      return copy;
    },
    [bugs]
  );

  const deleteBugs = useCallback((ids: string[]) => {
    const targets = new Set(ids);
    setBugs((previous) => previous.filter((bug) => !targets.has(bug.id)));
    setSelectedIds((previous) => previous.filter((id) => !targets.has(id)));
    setDetailBugId((previous) => (previous && targets.has(previous) ? null : previous));
  }, []);

  const setTesterStatus = useCallback(
    (ids: string[], status: TesterStatus) =>
      patchBugs(ids, (bug) =>
        bug.testerStatus === status
          ? null
          : {
              patch: { testerStatus: status },
              activity: [
                entry(
                  status === "verified"
                    ? "verified"
                    : status === "closed"
                      ? "closed"
                      : status === "reopened"
                        ? "reopened"
                        : "status",
                  "changed tester status",
                  TESTER_STATUS_LABELS[bug.testerStatus],
                  TESTER_STATUS_LABELS[status]
                ),
              ],
            }
      ),
    [patchBugs]
  );

  const setDeveloperStatus = useCallback(
    (ids: string[], status: DeveloperStatus) =>
      patchBugs(ids, (bug) =>
        bug.developerStatus === status
          ? null
          : {
              patch: { developerStatus: status },
              activity: [
                entry(
                  status === "fixed" ? "fixed" : "status",
                  "changed developer status",
                  DEVELOPER_STATUS_LABELS[bug.developerStatus],
                  DEVELOPER_STATUS_LABELS[status]
                ),
              ],
            }
      ),
    [patchBugs]
  );

  const setSeverity = useCallback(
    (ids: string[], severity: Severity) =>
      patchBugs(ids, (bug) =>
        bug.severity === severity
          ? null
          : {
              patch: { severity },
              activity: [
                entry(
                  "severity",
                  "changed severity",
                  SEVERITY_LABELS[bug.severity],
                  SEVERITY_LABELS[severity]
                ),
              ],
            }
      ),
    [patchBugs]
  );

  const setPriority = useCallback(
    (ids: string[], priority: Priority) =>
      patchBugs(ids, (bug) =>
        bug.priority === priority
          ? null
          : {
              patch: { priority },
              activity: [
                entry("priority", "changed priority", bug.priority, priority),
              ],
            }
      ),
    [patchBugs]
  );

  const assignBugs = useCallback(
    (ids: string[], assigneeId: string | null) =>
      patchBugs(ids, (bug) =>
        bug.assigneeId === assigneeId
          ? null
          : {
              patch: {
                assigneeId,
                developerStatus:
                  assigneeId && bug.developerStatus === "backlog"
                    ? "assigned"
                    : bug.developerStatus,
              },
              activity: [
                entry(
                  "assigned",
                  assigneeId
                    ? `assigned this to ${personName(assigneeId)}`
                    : "removed the assignee",
                  bug.assigneeId ? personName(bug.assigneeId) : "Unassigned",
                  assigneeId ? personName(assigneeId) : "Unassigned"
                ),
              ],
            }
      ),
    [patchBugs]
  );

  const addAttachments = useCallback(
    (bugId: string, attachments: Attachment[]) =>
      patchBugs([bugId], (bug) => ({
        patch: { attachments: [...bug.attachments, ...attachments] },
        activity: attachments.map((attachment) =>
          entry("attachment", `attached ${attachment.name}`)
        ),
      })),
    [patchBugs]
  );

  const removeAttachment = useCallback(
    (bugId: string, attachmentId: string) =>
      patchBugs([bugId], (bug) => {
        const removed = bug.attachments.find((item) => item.id === attachmentId);
        if (!removed) return null;
        return {
          patch: {
            attachments: bug.attachments.filter(
              (item) => item.id !== attachmentId
            ),
          },
          activity: [entry("attachment", `removed ${removed.name}`)],
        };
      }),
    [patchBugs]
  );

  const addComment = useCallback(
    ({ bugId, body, code, parentId, attachments }: NewComment) =>
      patchBugs([bugId], (bug) => {
        const comment: Comment = {
          id: createId("cmt"),
          authorId: CURRENT_USER_ID,
          at: nowStamp(),
          body: body.trim(),
          parentId,
          code,
          attachments,
          reactions: [],
        };
        return {
          patch: {
            comments: [...bug.comments, comment],
            attachments:
              attachments.length > 0
                ? [...bug.attachments, ...attachments]
                : bug.attachments,
          },
          activity: [
            entry("comment", parentId ? "replied to a comment" : "added a comment"),
          ],
        };
      }),
    [patchBugs]
  );

  const toggleReaction = useCallback(
    (bugId: string, commentId: string, emoji: string) =>
      patchBugs([bugId], (bug) => ({
        patch: {
          comments: bug.comments.map((comment) => {
            if (comment.id !== commentId) return comment;
            const existing = comment.reactions.find(
              (reaction) => reaction.emoji === emoji
            );
            if (!existing) {
              return {
                ...comment,
                reactions: [
                  ...comment.reactions,
                  { emoji, byIds: [CURRENT_USER_ID] },
                ],
              };
            }
            const byIds = existing.byIds.includes(CURRENT_USER_ID)
              ? existing.byIds.filter((id) => id !== CURRENT_USER_ID)
              : [...existing.byIds, CURRENT_USER_ID];
            return {
              ...comment,
              reactions: comment.reactions
                .map((reaction) =>
                  reaction.emoji === emoji ? { ...reaction, byIds } : reaction
                )
                .filter((reaction) => reaction.byIds.length > 0),
            };
          }),
        },
      })),
    [patchBugs]
  );

  const value = useMemo<BugBoardValue>(
    () => ({
      bugs,
      scopedBugs,
      visibleBugs,
      pageBugs,
      summary,
      getBug,
      projects,
      activeProjectId,
      activeProject,
      setActiveProject,
      getProject,
      projectName,
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
      removeAttachment,
      resetFilters,
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
