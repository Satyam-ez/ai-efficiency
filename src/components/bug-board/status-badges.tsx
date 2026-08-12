import {
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleSlashIcon,
  ClipboardListIcon,
  EyeIcon,
  FileArchiveIcon,
  FileTextIcon,
  GlobeIcon,
  ImageIcon,
  LoaderIcon,
  MinusIcon,
  MonitorPlayIcon,
  MoveDownIcon,
  MoveUpIcon,
  PaperclipIcon,
  RotateCcwIcon,
  ScrollTextIcon,
  ServerIcon,
  TerminalIcon,
  TriangleAlertIcon,
  UserIcon,
  VideoIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ATTACHMENT_KIND_LABELS,
  DEVELOPER_STATUS_LABELS,
  ENVIRONMENT_LABELS,
  SEVERITY_LABELS,
  TESTER_STATUS_LABELS,
  type AttachmentKind,
  type DeveloperStatus,
  type Environment,
  type Priority,
  type Severity,
  type TesterStatus,
} from "@/lib/bug-board/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface Look {
  variant: BadgeVariant;
  icon: LucideIcon;
  className?: string;
}

/**
 * The palette is intentionally monochrome, so weight carries meaning: solid for
 * decisive states, muted grey for in-flight work, outline for the quietest, and
 * `destructive` reserved for the states that need attention.
 */
const SEVERITY_LOOK: Record<Severity, Look> = {
  critical: { variant: "destructive", icon: TriangleAlertIcon },
  high: { variant: "default", icon: MoveUpIcon },
  medium: { variant: "secondary", icon: MinusIcon },
  low: { variant: "outline", icon: MoveDownIcon, className: "text-muted-foreground" },
};

const PRIORITY_LOOK: Record<Priority, BadgeVariant> = {
  P0: "destructive",
  P1: "default",
  P2: "secondary",
  P3: "outline",
};

const TESTER_LOOK: Record<TesterStatus, Look> = {
  open: { variant: "outline", icon: CircleDotIcon },
  "under-review": { variant: "secondary", icon: EyeIcon },
  verified: { variant: "default", icon: CircleCheckIcon },
  reopened: { variant: "destructive", icon: RotateCcwIcon },
  closed: {
    variant: "secondary",
    icon: CircleSlashIcon,
    className: "text-muted-foreground",
  },
};

const DEVELOPER_LOOK: Record<DeveloperStatus, Look> = {
  backlog: {
    variant: "outline",
    icon: CircleDashedIcon,
    className: "text-muted-foreground",
  },
  assigned: { variant: "outline", icon: UserIcon },
  "in-progress": { variant: "secondary", icon: LoaderIcon },
  "ready-for-qa": { variant: "secondary", icon: ClipboardListIcon },
  fixed: { variant: "default", icon: WrenchIcon },
  blocked: { variant: "destructive", icon: BanIcon },
};

const ENVIRONMENT_ICONS: Record<Environment, LucideIcon> = {
  production: GlobeIcon,
  staging: ServerIcon,
  development: TerminalIcon,
};

export const ATTACHMENT_ICONS: Record<AttachmentKind, LucideIcon> = {
  image: ImageIcon,
  video: VideoIcon,
  recording: MonitorPlayIcon,
  pdf: FileTextIcon,
  archive: FileArchiveIcon,
  log: ScrollTextIcon,
  file: PaperclipIcon,
};

function LookBadge({
  look,
  children,
  className,
}: {
  look: Look;
  children: string;
  className?: string;
}) {
  const Icon = look.icon;
  return (
    <Badge variant={look.variant} className={cn(look.className, className)}>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {children}
    </Badge>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <LookBadge look={SEVERITY_LOOK[severity]} className={className}>
      {SEVERITY_LABELS[severity]}
    </LookBadge>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: Priority;
  className?: string;
}) {
  return (
    <Badge
      variant={PRIORITY_LOOK[priority]}
      className={cn("tabular-nums", className)}
    >
      {priority}
    </Badge>
  );
}

export function TesterStatusBadge({
  status,
  className,
}: {
  status: TesterStatus;
  className?: string;
}) {
  return (
    <LookBadge look={TESTER_LOOK[status]} className={className}>
      {TESTER_STATUS_LABELS[status]}
    </LookBadge>
  );
}

export function DeveloperStatusBadge({
  status,
  className,
}: {
  status: DeveloperStatus;
  className?: string;
}) {
  return (
    <LookBadge look={DEVELOPER_LOOK[status]} className={className}>
      {DEVELOPER_STATUS_LABELS[status]}
    </LookBadge>
  );
}

export function EnvironmentBadge({
  environment,
  className,
}: {
  environment: Environment;
  className?: string;
}) {
  return (
    <LookBadge
      look={{ variant: "outline", icon: ENVIRONMENT_ICONS[environment] }}
      className={className}
    >
      {ENVIRONMENT_LABELS[environment]}
    </LookBadge>
  );
}

export function AttachmentKindLabel({ kind }: { kind: AttachmentKind }) {
  return <>{ATTACHMENT_KIND_LABELS[kind]}</>;
}
