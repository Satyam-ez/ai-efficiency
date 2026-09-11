"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AtSignIcon,
  CodeIcon,
  CornerDownRightIcon,
  ImagePlusIcon,
  MessageSquareIcon,
  SendIcon,
  SmilePlusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useBugBoard } from "@/components/bug-board/bug-board-provider";
import { AttachmentCard } from "@/components/bug-board/attachment-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useEvidenceUploads } from "@/hooks/use-evidence-uploads";
import {
  boardNowMs,
  getCurrentUserId,
  PEOPLE,
  personName,
  personOf,
  REACTION_EMOJI,
} from "@/lib/bug-board/data";
import { formatDateTime, formatRelative, toEpochMs } from "@/lib/bug-board/format";
import type { Bug, Comment } from "@/lib/bug-board/types";
import { cn } from "@/lib/utils";

const MENTION_NAMES = PEOPLE.map((person) => person.name);

/** Highlights `@Name` mentions of known people, leaving the rest as plain text. */
function CommentBody({ body }: { body: string }) {
  const parts = useMemo(() => {
    const pattern = new RegExp(
      `@(${MENTION_NAMES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "g"
    );
    const segments: Array<{ text: string; mention: boolean }> = [];
    let cursor = 0;
    for (const match of body.matchAll(pattern)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        segments.push({ text: body.slice(cursor, start), mention: false });
      }
      segments.push({ text: match[0], mention: true });
      cursor = start + match[0].length;
    }
    if (cursor < body.length) {
      segments.push({ text: body.slice(cursor), mention: false });
    }
    return segments;
  }, [body]);

  return (
    <p className="text-sm whitespace-pre-wrap">
      {parts.map((part, index) =>
        part.mention ? (
          <span
            key={index}
            className="rounded-sm bg-muted px-1 font-medium text-foreground"
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </p>
  );
}

function Reactions({ bug, comment }: { bug: Bug; comment: Comment }) {
  const { toggleReaction } = useBugBoard();

  return (
    <div className="flex flex-wrap items-center gap-1">
      {comment.reactions.map((reaction) => {
        const mine = reaction.byIds.includes(getCurrentUserId() ?? "");
        return (
          <Button
            key={reaction.emoji}
            variant={mine ? "secondary" : "outline"}
            size="xs"
            onClick={() => toggleReaction(bug.id, comment.id, reaction.emoji)}
            title={reaction.byIds.map((id) => personName(id)).join(", ")}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            <span className="tabular-nums">{reaction.byIds.length}</span>
          </Button>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Add a reaction">
            <SmilePlusIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-fit min-w-0">
          <div className="flex gap-0.5">
            {REACTION_EMOJI.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="icon-sm"
                onClick={() => toggleReaction(bug.id, comment.id, emoji)}
                aria-label={`React with ${emoji}`}
              >
                <span aria-hidden="true">{emoji}</span>
              </Button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function CommentCard({
  bug,
  comment,
  replies,
  onReply,
  depth = 0,
}: {
  bug: Bug;
  comment: Comment;
  replies: Comment[];
  onReply: (comment: Comment) => void;
  depth?: number;
}) {
  const { openPreview } = useBugBoard();
  const author = personOf(comment.authorId);

  return (
    <li className={cn("flex flex-col gap-2", depth > 0 && "pl-6")}>
      <div className="flex gap-2.5">
        <Avatar className="mt-0.5">
          <AvatarFallback>{author?.initials ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {personName(comment.authorId)}
            </span>
            {author?.role ? (
              <Badge variant="outline" className="text-muted-foreground capitalize">
                {author.role}
              </Badge>
            ) : null}
            <span
              className="text-xs text-muted-foreground"
              title={formatDateTime(comment.at)}
            >
              {formatRelative(comment.at, boardNowMs())}
            </span>
          </p>

          <CommentBody body={comment.body} />

          {comment.code ? (
            <pre className="overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-xs">
              <code>{comment.code}</code>
            </pre>
          ) : null}

          {comment.attachments.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {comment.attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  onOpen={() =>
                    openPreview({ bugId: bug.id, attachmentId: attachment.id })
                  }
                />
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-1">
            <Reactions bug={bug} comment={comment} />
            <Button variant="ghost" size="xs" onClick={() => onReply(comment)}>
              <CornerDownRightIcon data-icon="inline-start" aria-hidden="true" />
              Reply
            </Button>
          </div>
        </div>
      </div>

      {replies.length > 0 ? (
        <ul className="flex flex-col gap-4 border-l pl-3">
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              bug={bug}
              comment={reply}
              replies={[]}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Composer({
  bug,
  replyTo,
  onCancelReply,
}: {
  bug: Bug;
  replyTo: Comment | null;
  onCancelReply: () => void;
}) {
  const { addComment } = useBugBoard();
  const [body, setBody] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const { attachments, files, addFiles, remove, reset } = useEvidenceUploads();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!body.trim() && !code?.trim() && files.length === 0) return;
    // Cleared up front so the composer feels immediate; the posted values are
    // already captured in this closure.
    const posted = { body: body.trim(), code, files, parentId: replyTo?.id ?? null };
    setBody("");
    setCode(null);
    reset([]);
    onCancelReply();

    await addComment({
      bugId: bug.id,
      body: posted.body,
      code: posted.code?.trim() ? posted.code : null,
      parentId: posted.parentId,
      files: posted.files,
    });
    toast.success(replyTo ? "Reply posted" : "Comment added");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  function mention(name: string) {
    setBody((previous) => `${previous}${previous.endsWith(" ") || !previous ? "" : " "}@${name} `);
    bodyRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-2 border-t bg-muted/50 p-3">
      {replyTo ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CornerDownRightIcon className="size-3" aria-hidden="true" />
          Replying to {personName(replyTo.authorId)}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <XIcon aria-hidden="true" />
          </Button>
        </p>
      ) : null}

      <div className="flex gap-2.5">
        <Avatar className="mt-0.5">
          <AvatarFallback>
            {personOf(getCurrentUserId())?.initials ?? "ME"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Textarea
            ref={bodyRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment. Mention a teammate with @, attach a screenshot, or paste a stack trace as code."
            className="min-h-16 bg-background"
          />

          {code !== null ? (
            <div className="flex flex-col gap-1">
              <Textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Paste a snippet, log line or stack trace"
                className="min-h-20 bg-background font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="xs"
                className="self-start"
                onClick={() => setCode(null)}
              >
                Remove snippet
              </Button>
            </div>
          ) : null}

          {attachments.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {attachments.map((attachment) => (
                <AttachmentCard
                  key={attachment.id}
                  attachment={attachment}
                  onRemove={() => remove(attachment.id)}
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <AtSignIcon data-icon="inline-start" aria-hidden="true" />
                  Mention
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 min-w-52">
                <DropdownMenuLabel>Mention a teammate</DropdownMenuLabel>
                {PEOPLE.map((person) => (
                  <DropdownMenuItem
                    key={person.id}
                    onSelect={() => mention(person.name)}
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                    {person.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCode((previous) => (previous === null ? "" : previous))}
            >
              <CodeIcon data-icon="inline-start" aria-hidden="true" />
              Code snippet
            </Button>

            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlusIcon data-icon="inline-start" aria-hidden="true" />
              Image
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > 0) addFiles(files);
                event.target.value = "";
              }}
            />

            <Button size="sm" className="ml-auto" onClick={submit}>
              <SendIcon data-icon="inline-start" aria-hidden="true" />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommentThread({ bug }: { bug: Bug }) {
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const { roots, repliesByParent } = useMemo(() => {
    const sorted = [...bug.comments].sort(
      (a, b) => toEpochMs(a.at) - toEpochMs(b.at)
    );
    const byParent = new Map<string, Comment[]>();
    for (const comment of sorted) {
      if (!comment.parentId) continue;
      const existing = byParent.get(comment.parentId) ?? [];
      existing.push(comment);
      byParent.set(comment.parentId, existing);
    }
    return {
      roots: sorted.filter((comment) => !comment.parentId),
      repliesByParent: byParent,
    };
  }, [bug.comments]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {roots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MessageSquareIcon className="size-4" aria-hidden="true" />
            </span>
            <p className="font-medium">No discussion yet</p>
            <p className="text-sm text-muted-foreground">
              Ask for a reproduction detail, or share what you have already ruled out.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {roots.map((comment) => (
              <CommentCard
                key={comment.id}
                bug={bug}
                comment={comment}
                replies={repliesByParent.get(comment.id) ?? []}
                onReply={setReplyTo}
              />
            ))}
          </ul>
        )}
      </div>
      <Composer
        bug={bug}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
