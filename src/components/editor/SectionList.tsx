"use client";
import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Lock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useConfirm } from "@/components/ui/Confirm";
import { SECTION_META, makeSection } from "@/domain/doc/sections";
import type { SectionConfig } from "@/domain/doc/schema";
import { useDraft } from "@/components/admin/draft";

function Row({ s, active, onSelect, locked }: { s: SectionConfig; active: boolean; onSelect: () => void; locked: boolean }) {
  const { update } = useDraft();
  const ask = useConfirm();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const meta = SECTION_META[s.type];
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group", isDragging && "z-10 opacity-80")}>
      <div className={cn("flex items-center gap-1 rounded-md border px-1.5 py-1 transition-colors", active ? "border-accent bg-surface shadow-[var(--shadow-1)]" : "border-transparent hover:bg-paper-2")}>
        <button type="button" {...attributes} {...listeners} className="grid size-8 shrink-0 cursor-grab place-items-center rounded text-muted hover:text-ink active:cursor-grabbing" aria-label={`Reorder ${meta.label}. Use space, then arrow keys.`}><GripVertical className="size-4" /></button>
        <button type="button" onClick={onSelect} aria-current={active} className="min-w-0 flex-1 py-1.5 text-left"><span className={cn("block truncate text-[14px]", !s.enabled && "text-muted line-through decoration-rule-strong")}>{meta.label}</span><span className="block truncate text-[11.5px] text-muted">{locked ? "Not in this package" : s.variant}</span></button>
        {locked ? <Lock className="mr-2 size-3.5 text-brass" aria-label="Not in this package" /> : (
          <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label={s.enabled ? `Hide ${meta.label}` : `Show ${meta.label}`} aria-pressed={s.enabled} onClick={() => update((d) => { const x = d.sections.find((y) => y.id === s.id); if (x) x.enabled = !x.enabled; })}>{s.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4 text-muted" />}</button>
        )}
        <button type="button" className="btn btn-ghost btn-sm !px-2 text-muted opacity-0 hover:text-bad focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Remove ${meta.label}`} onClick={async () => { if (await ask({ title: `Remove “${meta.label}”?`, message: "The section leaves the invitation. Your content is kept — you can add the section back any time.", confirmLabel: "Remove", tone: "danger" })) update((d) => void (d.sections = d.sections.filter((y) => y.id !== s.id).map((y, i) => ({ ...y, order: i })))); }}><Trash2 className="size-4" /></button>
      </div>
    </li>
  );
}

export function SectionList({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { doc, update, has } = useDraft();
  const [adding, setAdding] = useState(false);
  const sections = [...doc.sections].sort((a, b) => a.order - b.order);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = sections.map((s) => s.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    update((d) => void d.sections.forEach((s) => (s.order = next.indexOf(s.id))));
  };
  const present = new Set(doc.sections.map((s) => s.type));
  const addable = (Object.keys(SECTION_META) as (keyof typeof SECTION_META)[]).filter((t) => !present.has(t));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3"><h2 className="eyebrow">Sections</h2><Button size="sm" variant="quiet" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>Add</Button></div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
            {sections.map((s) => {
              const f = SECTION_META[s.type].feature;
              return <Row key={s.id} s={s} active={selected === s.id} onSelect={() => onSelect(s.id)} locked={!!f && !has(f)} />;
            })}
          </ul>
        </SortableContext>
      </DndContext>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a section" description="Sections are the building blocks of the invitation. Locked ones need a higher package.">
        {addable.length === 0 ? <p className="text-muted">Every section is already on the invitation.</p> : (
          <ul className="divide-y divide-rule">
            {addable.map((t) => {
              const m = SECTION_META[t];
              const locked = !!m.feature && !has(m.feature);
              return (
                <li key={t} className="flex items-center gap-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{m.label} {locked && <Lock className="ml-1 inline size-3.5 text-brass" />}</p><p className="text-[13px] text-muted">{m.description}</p></div><Button size="sm" variant="quiet" disabled={locked} onClick={() => { const s = makeSection(t, { order: doc.sections.length }); update((d) => void d.sections.push(s)); setAdding(false); onSelect(s.id); }}>Add</Button></li>
              );
            })}
          </ul>
        )}
      </Sheet>
    </div>
  );
}
