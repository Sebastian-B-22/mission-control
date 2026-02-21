"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Heart, Phone, Mail, MessageCircle, Plus, Pencil, Trash2,
  Clock, Star, Gift, Check, Users, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

type Occasion = { name: string; date: string };
type Contact = {
  _id: Id<"contacts">;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  birthday?: string;
  keyFacts?: string;
  memories?: string;
  lastContactDate?: number;
  lastContactMethod?: string;
  lastContactNote?: string;
  nextAction?: string;
  nextActionNote?: string;
  occasions?: Occasion[];
  priority?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

// ─── Config ───────────────────────────────────────────────────────────────

const RELATIONSHIP_COLORS: Record<string, string> = {
  friend:    "bg-pink-100 text-pink-800 border-pink-200",
  family:    "bg-purple-100 text-purple-800 border-purple-200",
  mentor:    "bg-blue-100 text-blue-800 border-blue-200",
  community: "bg-green-100 text-green-800 border-green-200",
  colleague: "bg-amber-100 text-amber-800 border-amber-200",
  other:     "bg-gray-100 text-gray-700 border-gray-200",
};

const METHOD_ICONS: Record<string, string> = {
  "voice-text": "🎙",
  "call":       "📞",
  "text":       "💬",
  "in-person":  "🤝",
  "card":       "✉️",
  "gift":       "🎁",
};

const NEXT_ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  "send-note": { label: "Send Note",  color: "bg-amber-100 text-amber-800", icon: "✉️" },
  "call":      { label: "Call",       color: "bg-blue-100 text-blue-800",   icon: "📞" },
  "gift":      { label: "Send Gift",  color: "bg-pink-100 text-pink-800",   icon: "🎁" },
  "card":      { label: "Send Card",  color: "bg-green-100 text-green-800", icon: "📮" },
  "nothing":   { label: "Nothing",    color: "bg-gray-100 text-gray-500",   icon: "" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function daysUntilOccasion(mmdd: string): number {
  const [month, day] = mmdd.split("-").map(Number);
  const today = new Date();
  const thisYear = today.getFullYear();
  let occ = new Date(thisYear, month - 1, day);
  if (occ.getTime() < today.getTime() - 86400000) occ = new Date(thisYear + 1, month - 1, day);
  return Math.ceil((occ.getTime() - today.getTime()) / 86400000);
}

function formatMMDD(mmdd: string): string {
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Log Contact Modal ────────────────────────────────────────────────────

function LogContactModal({
  contact,
  open,
  onClose,
  onLog,
}: {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onLog: (id: Id<"contacts">, method: string, note: string) => void;
}) {
  const [method, setMethod] = useState("text");
  const [note, setNote] = useState("");

  if (!contact) return null;

  const handleSubmit = () => {
    onLog(contact._id, method, note);
    setMethod("text");
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Contact - {contact.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>How did you reach out?</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(METHOD_ICONS).map(([key, icon]) => (
                <button
                  key={key}
                  onClick={() => setMethod(key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all ${
                    method === key
                      ? "border-amber-400 bg-amber-50 text-amber-800 font-semibold"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs capitalize">{key.replace("-", " ")}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quick note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you talk about / send?"
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 text-black">
            Log It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contact Form Modal ───────────────────────────────────────────────────

function ContactFormModal({
  contact,
  open,
  onClose,
  onSave,
}: {
  contact?: Contact | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Contact> & { name: string; relationship: string }) => void;
}) {
  const isEdit = !!contact;
  const [name, setName] = useState(contact?.name ?? "");
  const [relationship, setRelationship] = useState(contact?.relationship ?? "friend");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [birthday, setBirthday] = useState(contact?.birthday ?? "");
  const [keyFacts, setKeyFacts] = useState(contact?.keyFacts ?? "");
  const [memories, setMemories] = useState(contact?.memories ?? "");
  const [nextAction, setNextAction] = useState(contact?.nextAction ?? "nothing");
  const [nextActionNote, setNextActionNote] = useState(contact?.nextActionNote ?? "");
  const [priority, setPriority] = useState(contact?.priority ?? "medium");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      relationship,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      birthday: birthday.trim() || undefined,
      keyFacts: keyFacts.trim() || undefined,
      memories: memories.trim() || undefined,
      nextAction: nextAction || undefined,
      nextActionNote: nextActionNote.trim() || undefined,
      priority,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit - ${contact!.name}` : "Add Person"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["friend", "family", "mentor", "community", "colleague", "other"].map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Birthday (MM-DD)</Label>
              <Input value={birthday} onChange={(e) => setBirthday(e.target.value)} placeholder="02-22" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." type="email" />
          </div>

          <div className="space-y-1">
            <Label>Key Facts</Label>
            <Textarea
              value={keyFacts}
              onChange={(e) => setKeyFacts(e.target.value)}
              placeholder="Kids names, job, what they care about, where they live..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label>Memories & Context</Label>
            <Textarea
              value={memories}
              onChange={(e) => setMemories(e.target.value)}
              placeholder="Meaningful shared moments, inside jokes, last time you saw them..."
              rows={3}
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Next Action</Label>
              <Select value={nextAction} onValueChange={setNextAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nothing">Nothing needed</SelectItem>
                  <SelectItem value="send-note">Send Note</SelectItem>
                  <SelectItem value="call">Make a Call</SelectItem>
                  <SelectItem value="card">Send Card</SelectItem>
                  <SelectItem value="gift">Send Gift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {nextAction && nextAction !== "nothing" && (
            <div className="space-y-1">
              <Label>Action Note</Label>
              <Input
                value={nextActionNote}
                onChange={(e) => setNextActionNote(e.target.value)}
                placeholder="What specifically? e.g. 'Congrats on new job'"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="bg-amber-500 hover:bg-amber-600 text-black">
            {isEdit ? "Save Changes" : "Add Person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contact Detail Modal ─────────────────────────────────────────────────

function ContactDetailModal({
  contact,
  open,
  onClose,
  onEdit,
  onLog,
  onDelete,
}: {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onEdit: (c: Contact) => void;
  onLog: (c: Contact) => void;
  onDelete: (id: Id<"contacts">) => void;
}) {
  if (!contact) return null;
  const na = contact.nextAction && NEXT_ACTION_CONFIG[contact.nextAction];
  const dueOccasions = [
    ...(contact.birthday ? [{ name: "Birthday", date: contact.birthday }] : []),
    ...(contact.occasions ?? []),
  ].filter((o) => daysUntilOccasion(o.date) <= 30);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{contact.name}</span>
            <Badge className={`text-xs capitalize ${RELATIONSHIP_COLORS[contact.relationship] ?? RELATIONSHIP_COLORS.other}`}>
              {contact.relationship}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {/* Last contact */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last contact:</span>
            <span className="font-medium">
              {contact.lastContactDate
                ? `${timeAgo(contact.lastContactDate)} ${contact.lastContactMethod ? `via ${METHOD_ICONS[contact.lastContactMethod]} ${contact.lastContactMethod}` : ""}`
                : "Never"}
            </span>
          </div>
          {contact.lastContactNote && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-2 italic">"{contact.lastContactNote}"</p>
          )}

          {/* Upcoming occasions */}
          {dueOccasions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Coming up</p>
              {dueOccasions.map((o) => (
                <p key={o.name + o.date} className="text-sm text-amber-900">
                  {o.name} - {formatMMDD(o.date)} ({daysUntilOccasion(o.date)}d away)
                </p>
              ))}
            </div>
          )}

          {/* Next action */}
          {na && na.label !== "Nothing" && (
            <div className={`rounded-lg p-3 border text-sm font-medium ${na.color} border-current/20`}>
              {na.icon} Action needed: {na.label}
              {contact.nextActionNote && <span className="font-normal"> - {contact.nextActionNote}</span>}
            </div>
          )}

          {/* Contact info */}
          {(contact.phone || contact.email) && (
            <div className="flex items-center gap-3 flex-wrap">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <Phone className="h-3 w-3" /> {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                  <Mail className="h-3 w-3" /> {contact.email}
                </a>
              )}
            </div>
          )}

          {/* Key facts */}
          {contact.keyFacts && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Key Facts</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.keyFacts}</p>
            </div>
          )}

          {/* Memories */}
          {contact.memories && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Memories & Context</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.memories}</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between !flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { onDelete(contact._id); onClose(); }}
            className="border-red-200 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(contact); }}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => { onClose(); onLog(contact); }}
            >
              <Check className="h-3 w-3 mr-1" /> Log Contact
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────

function ContactCard({
  contact,
  onClick,
  onLog,
}: {
  contact: Contact;
  onClick: () => void;
  onLog: (e: React.MouseEvent) => void;
}) {
  const daysSince = contact.lastContactDate
    ? Math.floor((Date.now() - contact.lastContactDate) / 86400000)
    : null;
  const na = contact.nextAction && contact.nextAction !== "nothing" && NEXT_ACTION_CONFIG[contact.nextAction];

  const allOccasions = [
    ...(contact.birthday ? [{ name: "Birthday", date: contact.birthday }] : []),
    ...(contact.occasions ?? []),
  ];
  const upcomingOccasion = allOccasions.find((o) => daysUntilOccasion(o.date) <= 14);

  return (
    <Card
      onClick={onClick}
      className="border border-gray-200 hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all duration-150 bg-white"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{contact.name}</p>
            <Badge className={`text-xs capitalize border ${RELATIONSHIP_COLORS[contact.relationship] ?? RELATIONSHIP_COLORS.other}`}>
              {contact.relationship}
            </Badge>
          </div>
          {contact.priority === "high" && <Star className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" />}
        </div>

        {/* Last contact */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          {daysSince === null
            ? "Never contacted"
            : daysSince === 0
            ? `Contacted today ${contact.lastContactMethod ? `via ${METHOD_ICONS[contact.lastContactMethod]}` : ""}`
            : `${timeAgo(contact.lastContactDate!)} ${contact.lastContactMethod ? `via ${METHOD_ICONS[contact.lastContactMethod]}` : ""}`}
        </p>

        {/* Upcoming occasion */}
        {upcomingOccasion && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5 flex items-center gap-1">
            <Gift className="h-3 w-3 shrink-0" />
            {upcomingOccasion.name} in {daysUntilOccasion(upcomingOccasion.date)}d
          </p>
        )}

        {/* Next action */}
        {na && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${na.color}`}>
            {na.icon} {na.label}
          </span>
        )}

        {/* Key facts preview */}
        {contact.keyFacts && (
          <p className="text-xs text-gray-500 line-clamp-1">{contact.keyFacts}</p>
        )}

        {/* Log button */}
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700"
            onClick={onLog}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Log Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Surprise Card (for Daily Tab) ───────────────────────────────────────

export function SurpriseCard({ clerkId }: { clerkId: string }) {
  const dueContacts = (useQuery(api.contacts.getDueForOutreach, { clerkId }) ?? []) as Contact[];
  const logContact = useMutation(api.contacts.logContact);
  const [dismissed, setDismissed] = useState(false);
  const [showLog, setShowLog] = useState(false);

  if (dismissed || dueContacts.length === 0) return null;
  const person = dueContacts[0];

  const handleLog = async (method: string, note: string) => {
    await logContact({ id: person._id, method, note });
    setDismissed(true);
  };

  const daysSince = person.lastContactDate
    ? Math.floor((Date.now() - person.lastContactDate) / 86400000)
    : null;

  return (
    <>
      <Card className="border border-amber-200 bg-amber-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide flex items-center gap-1">
              <Heart className="h-3 w-3" fill="currentColor" />
              Who could you surprise today?
            </p>
            <button onClick={() => setDismissed(true)} className="text-xs text-amber-600 hover:text-amber-800">
              Not today
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{person.name}</p>
            <p className="text-sm text-gray-600 capitalize">{person.relationship}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {daysSince === null ? "Never been in touch" : `Last contact: ${timeAgo(person.lastContactDate!)} ${person.lastContactMethod ? `via ${METHOD_ICONS[person.lastContactMethod]}` : ""}`}
            </p>
            {person.keyFacts && <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">{person.keyFacts}</p>}
          </div>
          {person.nextAction && person.nextAction !== "nothing" && (
            <p className="text-sm font-medium text-amber-800">
              {NEXT_ACTION_CONFIG[person.nextAction]?.icon} Suggested: {NEXT_ACTION_CONFIG[person.nextAction]?.label}
              {person.nextActionNote && ` - ${person.nextActionNote}`}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black text-xs" onClick={() => setShowLog(true)}>
              Log Contact
            </Button>
            <Button size="sm" variant="outline" className="text-xs border-amber-300" onClick={() => setDismissed(true)}>
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
      <LogContactModal
        contact={showLog ? person : null}
        open={showLog}
        onClose={() => setShowLog(false)}
        onLog={async (_, method, note) => { await handleLog(method, note); setShowLog(false); }}
      />
    </>
  );
}

// ─── Main PersonalCRM Component ───────────────────────────────────────────

export function PersonalCRM() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";

  const [filter, setFilter] = useState<"all" | "due" | "high">("all");
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loggingContact, setLoggingContact] = useState<Contact | null>(null);

  const allContacts = (useQuery(api.contacts.list, clerkId ? { clerkId } : "skip") ?? []) as Contact[];
  const dueContacts = (useQuery(api.contacts.getDueForOutreach, clerkId ? { clerkId } : "skip") ?? []) as Contact[];

  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);
  const logContact    = useMutation(api.contacts.logContact);

  // Filter and search
  const baseList = filter === "due" ? dueContacts : filter === "high" ? allContacts.filter((c) => c.priority === "high") : allContacts;
  const displayed = search.trim()
    ? baseList.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.relationship.toLowerCase().includes(search.toLowerCase()))
    : baseList;

  const handleCreate = async (data: Parameters<typeof createContact>[0] extends { clerkId: string } ? Omit<Parameters<typeof createContact>[0], "clerkId"> : never) => {
    await createContact({ clerkId, ...data } as any);
  };

  const handleUpdate = async (data: Omit<Contact, "_id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!editingContact) return;
    await updateContact({ id: editingContact._id, ...data } as any);
  };

  const handleDelete = async (id: Id<"contacts">) => {
    if (!confirm("Remove this person from your CRM?")) return;
    await removeContact({ id });
    setSelectedContact(null);
  };

  const handleLog = async (id: Id<"contacts">, method: string, note: string) => {
    await logContact({ id, method, note });
  };

  if (!clerkId) return <p className="text-gray-500 text-sm">Sign in to use Personal CRM.</p>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-500">{allContacts.length} people - {dueContacts.length} need attention</p>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
          <Plus className="h-4 w-4 mr-1" />
          Add Person
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 h-8 text-sm border-gray-200"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { value: "all" as const, label: `All (${allContacts.length})` },
            { value: "due" as const, label: `Due (${dueContacts.length})` },
            { value: "high" as const, label: "High Priority" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                filter === opt.value
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{allContacts.length === 0 ? "Add your first person to start." : "No contacts match your filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map((contact) => (
            <ContactCard
              key={contact._id}
              contact={contact}
              onClick={() => setSelectedContact(contact)}
              onLog={(e) => { e.stopPropagation(); setLoggingContact(contact); }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ContactDetailModal
        contact={selectedContact}
        open={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onEdit={(c) => { setSelectedContact(null); setEditingContact(c); }}
        onLog={(c) => setLoggingContact(c)}
        onDelete={handleDelete}
      />

      <ContactFormModal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        onSave={handleCreate as any}
      />

      <ContactFormModal
        contact={editingContact}
        open={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSave={handleUpdate as any}
      />

      <LogContactModal
        contact={loggingContact}
        open={!!loggingContact}
        onClose={() => setLoggingContact(null)}
        onLog={handleLog}
      />
    </div>
  );
}
