"use client";

import { useState, type ReactNode } from "react";
import {
  CopyIcon,
  CopyPlusIcon,
  LinkIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { ActivityTimeline } from "@/components/bug-board/activity-timeline";
import { AttachmentCard } from "@/components/bug-board/attachment-card";
import {
  useBugBoard,
  type DetailTab,
} from "@/components/bug-board/bug-board-provider";
import {
  copyText,
  shareLinkFor,
} from "@/components/bug-board/bug-row-actions";
import { CommentThread } from "@/components/bug-board/comment-thread";
import { EvidenceUploader } from "@/components/bug-board/evidence-uploader";
import { PersonChip, PersonStack } from "@/components/bug-board/person-chip";
import {
  DeveloperStatusBadge,
  EnvironmentBadge,
  PriorityBadge,
  SeverityBadge,
  TesterStatusBadge,
} from "@/components/bug-board/status-badges";
import { ConfirmDialog } from "@/components/todo-notes/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MAX_UPLOAD_BYTES,
  useEvidenceUploads,
} from "@/hooks/use-evidence-uploads";
import { DEVELOPERS, personName } from "@/lib/bug-board/data";
import { formatDateTime, formatFileSize } from "@/lib/bug-board/format";
import {
  DEVELOPER_STATUSES,
  DEVELOPER_STATUS_LABELS,
  PRIORITIES,
  SEVERITIES,
  SEVERITY_LABELS,
  TESTER_STATUSES,
  TESTER_STATUS_LABELS,
  type Bug,
  type DeveloperStatus,
  type Priority,
  type Severity,
  type TesterStatus,
} from "@/lib/bug-board/types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="py-1 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-center py-1 text-sm">{children}</dd>
    </>
  );
}

function Overview({ bug }: { bug: Bug }) {
  const {
    setTesterStatus,
    setDeveloperStatus,
    setSeverity,
    setPriority,
    assignBugs,
    moveBugsToProject,
    projects,
  } = useBugBoard();

  return (
    <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center gap-x-3">
      <Row label="Project">
        <Select
          value={bug.projectId}
          onValueChange={(value) => moveBugsToProject([bug.id], value)}
        >
          <SelectTrigger size="sm" className="w-44">
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
      </Row>
      <Row label="Tester status">
        <Select
          value={bug.testerStatus}
          onValueChange={(value) =>
            setTesterStatus([bug.id], value as TesterStatus)
          }
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TESTER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {TESTER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row label="Developer status">
        <Select
          value={bug.developerStatus}
          onValueChange={(value) =>
            setDeveloperStatus([bug.id], value as DeveloperStatus)
          }
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEVELOPER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {DEVELOPER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row label="Severity">
        <Select
          value={bug.severity}
          onValueChange={(value) => setSeverity([bug.id], value as Severity)}
        >
          <SelectTrigger size="sm" className="w-44">
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
      </Row>
      <Row label="Priority">
        <Select
          value={bug.priority}
          onValueChange={(value) => setPriority([bug.id], value as Priority)}
        >
          <SelectTrigger size="sm" className="w-44">
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
      </Row>
      <Row label="Assigned developer">
        <Select
          value={bug.assigneeId ?? "unassigned"}
          onValueChange={(value) =>
            assignBugs([bug.id], value === "unassigned" ? null : value)
          }
        >
          <SelectTrigger size="sm" className="w-44">
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
      </Row>
      <Row label="Tester">
        <PersonChip personId={bug.reporterId} />
      </Row>
      <Row label="Watchers">
        <PersonStack personIds={bug.watcherIds} />
      </Row>
      <Row label="Module">
        {bug.module}
        <span className="text-muted-foreground">&nbsp;· {bug.component}</span>
      </Row>
      <Row label="Sprint">{bug.sprint}</Row>
      <Row label="Environment">
        <span className="flex flex-wrap items-center gap-1.5">
          <EnvironmentBadge environment={bug.environment} />
          <span className="text-muted-foreground">
            {bug.browser} · {bug.device} · {bug.os}
          </span>
        </span>
      </Row>
      <Row label="Labels">
        {bug.labels.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {bug.labels.map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </span>
        )}
      </Row>
      <Row label="Created">
        <span className="text-muted-foreground">
          {formatDateTime(bug.createdAt)}
        </span>
      </Row>
      <Row label="Updated">
        <span className="text-muted-foreground">
          {formatDateTime(bug.updatedAt)}
        </span>
      </Row>
    </dl>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-heading text-sm leading-none font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function DetailsTab({ bug }: { bug: Bug }) {
  const { addAttachments, removeAttachment, openPreview } = useBugBoard();
  const { attachments: pending, addFiles, remove, reset } = useEvidenceUploads();

  function handleAdd(files: File[]) {
    const { accepted, rejected } = addFiles(files);
    if (rejected.length > 0) {
      toast.error(
        `Too large for upload (max ${formatFileSize(MAX_UPLOAD_BYTES)}): ${rejected
          .map((file) => file.name)
          .join(", ")}`
      );
    }
    if (accepted.length === 0) return;
    // Uploads land on the bug once the simulated transfer finishes.
    window.setTimeout(() => {
      addAttachments(
        bug.id,
        accepted.map((attachment) => ({
          ...attachment,
          progress: 100,
          status: "ready" as const,
        }))
      );
      reset([]);
      toast.success(
        accepted.length === 1
          ? `${accepted[0].name} attached to ${bug.id}`
          : `${accepted.length} files attached to ${bug.id}`
      );
    }, 1200);
  }

  return (
    <div className="flex flex-col gap-5">
      <Block title="Overview">
        <Overview bug={bug} />
      </Block>

      <Block title="Description">
        <div className="flex flex-col gap-2 text-sm">
          {bug.description.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Block>

      <Block title="Reproduction steps">
        {bug.stepsToReproduce.length === 0 ? (
          <p className="text-sm text-muted-foreground">No steps recorded.</p>
        ) : (
          <ol className="flex flex-col gap-1.5 pl-5 text-sm">
            {bug.stepsToReproduce.map((step, index) => (
              <li key={index} className="list-decimal">
                {step}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground">
              Expected result
            </span>
            <span className="text-sm">{bug.expectedResult}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3">
            <span className="text-xs font-medium text-muted-foreground">
              Actual result
            </span>
            <span className="text-sm">{bug.actualResult}</span>
          </div>
        </div>
      </Block>

      <Block title={`Attachments (${bug.attachments.length})`}>
        {bug.attachments.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {bug.attachments.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                onOpen={() =>
                  openPreview({ bugId: bug.id, attachmentId: attachment.id })
                }
                onRemove={() => removeAttachment(bug.id, attachment.id)}
              />
            ))}
          </div>
        ) : null}
        <EvidenceUploader
          attachments={pending}
          onAdd={handleAdd}
          onRemove={remove}
          pasteEnabled
        />
      </Block>
    </div>
  );
}

export function BugDetailsDrawer() {
  const {
    detailBugId,
    detailTab,
    setDetailTab,
    closeDetail,
    getBug,
    openEdit,
    duplicateBug,
    deleteBugs,
  } = useBugBoard();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bug = getBug(detailBugId);

  return (
    <Sheet
      open={Boolean(bug)}
      onOpenChange={(open) => {
        if (!open) closeDetail();
      }}
    >
      <SheetContent className="gap-0 sm:max-w-2xl">
        {bug ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium tabular-nums">{bug.id}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyText(bug.id, `Copied ${bug.id}`)}
                  aria-label={`Copy ${bug.id}`}
                >
                  <CopyIcon aria-hidden="true" />
                </Button>
                <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyText(shareLinkFor(bug.id), "Share link copied")}
                  aria-label="Copy share link"
                >
                  <LinkIcon aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    const copy = duplicateBug(bug.id);
                    if (copy) toast.success(`Duplicated as ${copy.id}`);
                  }}
                  aria-label="Duplicate bug"
                >
                  <CopyPlusIcon aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(bug.id)}
                  aria-label="Edit bug"
                >
                  <PencilIcon aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Delete bug"
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </div>
              <SheetTitle>{bug.title}</SheetTitle>
              <SheetDescription className="sr-only">
                Details, activity history and discussion for {bug.id}.
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5">
                <SeverityBadge severity={bug.severity} />
                <PriorityBadge priority={bug.priority} />
                <TesterStatusBadge status={bug.testerStatus} />
                <DeveloperStatusBadge status={bug.developerStatus} />
                <EnvironmentBadge environment={bug.environment} />
                <span className="text-xs text-muted-foreground">
                  Reported by {personName(bug.reporterId)}
                </span>
              </div>
            </SheetHeader>

            <Tabs
              value={detailTab}
              onValueChange={(value) => setDetailTab(value as DetailTab)}
              className="min-h-0 flex-1 gap-0"
            >
              <TabsList variant="line" className="w-full justify-start border-b px-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">
                  Activity
                  <Badge variant="secondary" className="tabular-nums">
                    {bug.activity.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="comments">
                  Comments
                  <Badge variant="secondary" className="tabular-nums">
                    {bug.comments.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="min-h-0 overflow-y-auto p-4">
                <DetailsTab bug={bug} />
              </TabsContent>
              <TabsContent value="activity" className="min-h-0 overflow-y-auto p-4">
                <ActivityTimeline bug={bug} />
              </TabsContent>
              <TabsContent
                value="comments"
                className="flex min-h-0 flex-col data-[state=inactive]:hidden"
              >
                <CommentThread bug={bug} />
              </TabsContent>
            </Tabs>

            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title={`Delete ${bug.id}?`}
              description="The bug, its attachments, comments and activity history are removed from the board. This cannot be undone."
              confirmLabel="Delete bug"
              onConfirm={() => {
                deleteBugs([bug.id]);
                setConfirmOpen(false);
                toast.success(`${bug.id} deleted`);
              }}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
