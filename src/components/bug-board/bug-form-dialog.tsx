"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { BugIcon, ChevronDownIcon, SaveIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { AttachmentPreviewDialog } from "@/components/bug-board/attachment-preview";
import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { EvidenceUploader } from "@/components/bug-board/evidence-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_UPLOAD_BYTES,
  useEvidenceUploads,
} from "@/hooks/use-evidence-uploads";
import {
  BROWSERS,
  COMPONENTS,
  CURRENT_USER_ID,
  DEFAULT_ENVIRONMENT,
  DEFAULT_PROJECT_ID,
  DEFAULT_PRIORITY,
  DEFAULT_SEVERITY,
  DEVELOPERS,
  DEVICES,
  LABELS,
  MODULES,
  OPERATING_SYSTEMS,
  PEOPLE,
  personName,
  SPRINTS,
  TESTERS,
} from "@/lib/bug-board/data";
import { formatFileSize } from "@/lib/bug-board/format";
import {
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  PRIORITIES,
  SEVERITIES,
  SEVERITY_LABELS,
  type BugDraft,
  type Environment,
  type Priority,
  type Severity,
} from "@/lib/bug-board/types";
import { cn } from "@/lib/utils";

const EMPTY_DRAFT: Omit<BugDraft, "attachments"> = {
  projectId: DEFAULT_PROJECT_ID,
  title: "",
  description: "",
  module: MODULES[0],
  component: COMPONENTS[0],
  severity: DEFAULT_SEVERITY,
  priority: DEFAULT_PRIORITY,
  sprint: SPRINTS[0],
  labels: [],
  environment: DEFAULT_ENVIRONMENT,
  browser: BROWSERS[0],
  device: DEVICES[0],
  os: OPERATING_SYSTEMS[0],
  stepsToReproduce: "",
  expectedResult: "",
  actualResult: "",
  reporterId: CURRENT_USER_ID,
  assigneeId: null,
  watcherIds: [],
};

type FieldName =
  | "title"
  | "description"
  | "stepsToReproduce"
  | "expectedResult"
  | "actualResult";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="font-heading text-sm leading-none font-semibold">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Chip based multi select used for labels and watchers. */
function TokenSelect({
  label,
  placeholder,
  options,
  selected,
  onToggle,
}: {
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate text-muted-foreground">
              {selected.length === 0
                ? placeholder
                : `${selected.length} selected`}
            </span>
            <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 min-w-64">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
              onSelect={(event) => event.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="pr-1">
              {options.find((option) => option.value === value)?.label ?? value}
              <button
                type="button"
                onClick={() => onToggle(value)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={`Remove ${value}`}
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BugFormDialog() {
  const {
    activeProjectId,
    createOpen,
    closeCreate,
    editBugId,
    getBug,
    createBug,
    projects,
    updateBugDetails,
    openDetail,
    projectName,
  } = useBugBoard();

  const editing = getBug(editBugId);
  const [draft, setDraft] = useState<Omit<BugDraft, "attachments">>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { attachments, addFiles, remove, reset } = useEvidenceUploads();
  const titleRef = useRef<HTMLInputElement>(null);

  // Reloads the form whenever the dialog opens on a different target.
  const sessionKey = `${createOpen ? "open" : "closed"}:${editBugId ?? "new"}`;
  const [session, setSession] = useState(sessionKey);
  if (session !== sessionKey) {
    setSession(sessionKey);
    setErrors({});
    setPreviewId(null);
    if (editing) {
      setDraft({
        projectId: editing.projectId,
        title: editing.title,
        description: editing.description,
        module: editing.module,
        component: editing.component,
        severity: editing.severity,
        priority: editing.priority,
        sprint: editing.sprint,
        labels: editing.labels,
        environment: editing.environment,
        browser: editing.browser,
        device: editing.device,
        os: editing.os,
        stepsToReproduce: editing.stepsToReproduce
          .map((step, index) => `${index + 1}. ${step}`)
          .join("\n"),
        expectedResult: editing.expectedResult,
        actualResult: editing.actualResult,
        reporterId: editing.reporterId,
        assigneeId: editing.assigneeId,
        watcherIds: editing.watcherIds,
      });
      reset(editing.attachments);
    } else {
      // A new bug lands in the project the tester is working in.
      setDraft({
        ...EMPTY_DRAFT,
        projectId:
          activeProjectId ?? projects[0]?.id ?? EMPTY_DRAFT.projectId,
      });
      reset([]);
    }
  }

  function update(patch: Partial<Omit<BugDraft, "attachments">>) {
    setDraft((previous) => ({ ...previous, ...patch }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(patch) as FieldName[]) delete next[key];
      return next;
    });
  }

  function toggleInList(key: "labels" | "watcherIds", value: string) {
    setDraft((previous) => {
      const current = previous[key];
      return {
        ...previous,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  }

  function handleAdd(files: File[]) {
    const { rejected } = addFiles(files);
    if (rejected.length > 0) {
      toast.error(
        `Too large for upload (max ${formatFileSize(MAX_UPLOAD_BYTES)}): ${rejected
          .map((file) => file.name)
          .join(", ")}`
      );
    }
  }

  function handleSubmit() {
    const nextErrors: Partial<Record<FieldName, string>> = {};
    if (!draft.title.trim()) nextErrors.title = "A bug needs a title.";
    if (!draft.description.trim()) {
      nextErrors.description = "Describe what is broken.";
    }
    if (!draft.stepsToReproduce.trim()) {
      nextErrors.stepsToReproduce = "Add at least one step, one per line.";
    }
    if (!draft.expectedResult.trim()) {
      nextErrors.expectedResult = "State what should have happened.";
    }
    if (!draft.actualResult.trim()) {
      nextErrors.actualResult = "State what happened instead.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.title) titleRef.current?.focus();
      return;
    }

    const payload: BugDraft = { ...draft, attachments };

    if (editing) {
      updateBugDetails(editing.id, payload);
      toast.success(`${editing.id} updated`);
    } else {
      const bug = createBug(payload);
      toast.success(`${bug.id} created`, {
        description: `Filed in ${projectName(bug.projectId)}.`,
        action: {
          label: "View",
          onClick: () => openDetail(bug.id),
        },
      });
    }
    closeCreate();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate();
        }}
      >
        <DialogContent
          className="max-h-[92dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl"
          onKeyDown={handleKeyDown}
        >
          <DialogHeader className="flex-row items-start gap-3 border-b p-4 pr-12">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BugIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <DialogTitle>
                {editing ? `Edit ${editing.id}` : "Create bug"}
              </DialogTitle>
              <DialogDescription>
                Capture what broke, how to reproduce it, and who picks it up.
                Press ⌘/Ctrl + Enter to save.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-5 overflow-y-auto p-4">
            <Section
              title="Basic information"
              description="What went wrong and how another engineer can see it for themselves."
            >
              <Field
                label="Project"
                htmlFor="bug-project"
                required
                hint="The developers on this project are the ones who receive it."
              >
                <Select
                  value={draft.projectId}
                  onValueChange={(value) => update({ projectId: value })}
                >
                  <SelectTrigger id="bug-project" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Bug title"
                htmlFor="bug-title"
                required
                error={errors.title}
              >
                <Input
                  id="bug-title"
                  ref={titleRef}
                  value={draft.title}
                  onChange={(event) => update({ title: event.target.value })}
                  placeholder="Short summary, e.g. Invoice PDF totals ignore tax rounding"
                  aria-invalid={Boolean(errors.title)}
                  autoFocus
                />
              </Field>

              <Field
                label="Description"
                htmlFor="bug-description"
                required
                error={errors.description}
              >
                <Textarea
                  id="bug-description"
                  value={draft.description}
                  onChange={(event) =>
                    update({ description: event.target.value })
                  }
                  placeholder="What is broken, who it affects, and how often it happens."
                  className="min-h-20"
                  aria-invalid={Boolean(errors.description)}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Module" htmlFor="bug-module" required>
                  <Select
                    value={draft.module}
                    onValueChange={(value) => update({ module: value })}
                  >
                    <SelectTrigger id="bug-module" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Component" htmlFor="bug-component">
                  <Select
                    value={draft.component}
                    onValueChange={(value) => update({ component: value })}
                  >
                    <SelectTrigger id="bug-component" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPONENTS.map((component) => (
                        <SelectItem key={component} value={component}>
                          {component}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field
                label="Steps to reproduce"
                htmlFor="bug-steps"
                required
                error={errors.stepsToReproduce}
                hint="One step per line. Numbering is added automatically."
              >
                <Textarea
                  id="bug-steps"
                  value={draft.stepsToReproduce}
                  onChange={(event) =>
                    update({ stepsToReproduce: event.target.value })
                  }
                  placeholder={"Open the billing page\nDownload the invoice PDF\nCompare the total"}
                  className="min-h-24"
                  aria-invalid={Boolean(errors.stepsToReproduce)}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Expected result"
                  htmlFor="bug-expected"
                  required
                  error={errors.expectedResult}
                >
                  <Textarea
                    id="bug-expected"
                    value={draft.expectedResult}
                    onChange={(event) =>
                      update({ expectedResult: event.target.value })
                    }
                    placeholder="What should have happened."
                    aria-invalid={Boolean(errors.expectedResult)}
                  />
                </Field>
                <Field
                  label="Actual result"
                  htmlFor="bug-actual"
                  required
                  error={errors.actualResult}
                >
                  <Textarea
                    id="bug-actual"
                    value={draft.actualResult}
                    onChange={(event) =>
                      update({ actualResult: event.target.value })
                    }
                    placeholder="What happened instead."
                    aria-invalid={Boolean(errors.actualResult)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Environment" htmlFor="bug-environment">
                  <Select
                    value={draft.environment}
                    onValueChange={(value) =>
                      update({ environment: value as Environment })
                    }
                  >
                    <SelectTrigger id="bug-environment" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENVIRONMENTS.map((environment) => (
                        <SelectItem key={environment} value={environment}>
                          {ENVIRONMENT_LABELS[environment]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Browser" htmlFor="bug-browser">
                  <Select
                    value={draft.browser}
                    onValueChange={(value) => update({ browser: value })}
                  >
                    <SelectTrigger id="bug-browser" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BROWSERS.map((browser) => (
                        <SelectItem key={browser} value={browser}>
                          {browser}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Device" htmlFor="bug-device">
                  <Select
                    value={draft.device}
                    onValueChange={(value) => update({ device: value })}
                  >
                    <SelectTrigger id="bug-device" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICES.map((device) => (
                        <SelectItem key={device} value={device}>
                          {device}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Operating system" htmlFor="bug-os">
                  <Select
                    value={draft.os}
                    onValueChange={(value) => update({ os: value })}
                  >
                    <SelectTrigger id="bug-os" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATING_SYSTEMS.map((os) => (
                        <SelectItem key={os} value={os}>
                          {os}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Section>

            <Separator />

            <Section
              title="Classification"
              description="How the bug is triaged and where it sits in the plan."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Severity" htmlFor="bug-severity">
                  <Select
                    value={draft.severity}
                    onValueChange={(value) =>
                      update({ severity: value as Severity })
                    }
                  >
                    <SelectTrigger id="bug-severity" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          {SEVERITY_LABELS[severity]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority" htmlFor="bug-priority">
                  <Select
                    value={draft.priority}
                    onValueChange={(value) =>
                      update({ priority: value as Priority })
                    }
                  >
                    <SelectTrigger id="bug-priority" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Sprint" htmlFor="bug-sprint">
                  <Select
                    value={draft.sprint}
                    onValueChange={(value) => update({ sprint: value })}
                  >
                    <SelectTrigger id="bug-sprint" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPRINTS.map((sprint) => (
                        <SelectItem key={sprint} value={sprint}>
                          {sprint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Labels">
                <TokenSelect
                  label="Labels"
                  placeholder="Add labels"
                  options={LABELS.map((label) => ({
                    value: label,
                    label,
                  }))}
                  selected={draft.labels}
                  onToggle={(value) => toggleInList("labels", value)}
                />
              </Field>
            </Section>

            <Separator />

            <Section
              title="Assignment"
              description="Who reported it, who fixes it, and who wants to follow along."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tester name" htmlFor="bug-reporter">
                  <Select
                    value={draft.reporterId}
                    onValueChange={(value) => update({ reporterId: value })}
                  >
                    <SelectTrigger id="bug-reporter" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TESTERS.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Assigned developer" htmlFor="bug-assignee">
                  <Select
                    value={draft.assigneeId ?? "unassigned"}
                    onValueChange={(value) =>
                      update({ assigneeId: value === "unassigned" ? null : value })
                    }
                  >
                    <SelectTrigger id="bug-assignee" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {DEVELOPERS.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Watchers">
                <TokenSelect
                  label="Watchers"
                  placeholder="Add watchers"
                  options={PEOPLE.map((person) => ({
                    value: person.id,
                    label: `${person.name} · ${person.role}`,
                  }))}
                  selected={draft.watcherIds}
                  onToggle={(value) => toggleInList("watcherIds", value)}
                />
              </Field>
            </Section>

            <Separator />

            <Section
              title="Upload evidence"
              description="Screenshots and recordings cut triage time more than any other field."
            >
              <EvidenceUploader
                attachments={attachments}
                onAdd={handleAdd}
                onRemove={remove}
                onPreview={(attachment) => setPreviewId(attachment.id)}
                pasteEnabled={createOpen && previewId === null}
              />
            </Section>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0">
            <span className="mr-auto hidden text-xs text-muted-foreground sm:block">
              {editing
                ? `Reported by ${personName(editing.reporterId)}`
                : `Opens in ${projectName(draft.projectId)} with tester status Open.`}
            </span>
            <Button variant="outline" size="sm" onClick={closeCreate}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              <SaveIcon aria-hidden="true" />
              {editing ? "Save changes" : "Create bug"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog
        attachments={attachments}
        activeId={previewId}
        onSelect={setPreviewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
