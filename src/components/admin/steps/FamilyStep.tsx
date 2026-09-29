"use client";
import { SelectField } from "@/components/ui/Field";
import { newId } from "@/lib/id";
import type { FamilyMember, PartyMember } from "@/domain/doc/schema";
import { FormCard, Grid, Hint, LText, ListEditor } from "../forms";
import { MediaField } from "../MediaField";
import { useDraft } from "../draft";

export function FamilyStep() {
  const { doc, update, has } = useDraft();
  const f = doc.family;
  const sideName = (m: FamilyMember) => m.name.en || "Unnamed";
  return (
    <div className="space-y-6">
      <FormCard title="Both families" description="Parents, grandparents, siblings — the people who raised the couple. Guests see them as an editorial list, or as an interactive family tree on Signature and Luxury.">
        <Grid>
          <LText label="Bride’s family name" value={f.brideFamilyName} onChange={(v) => update((d) => void (d.family.brideFamilyName = v))} placeholder="The Nair family" />
          <LText label="Groom’s family name" value={f.groomFamilyName} onChange={(v) => update((d) => void (d.family.groomFamilyName = v))} placeholder="The Menon family" />
        </Grid>
        <ListEditor
          items={f.members}
          onChange={(items) => update((d) => void (d.family.members = items))}
          keyOf={(m) => m.id}
          title={(m) => `${sideName(m)}${m.relation.en ? " — " + m.relation.en : ""}${m.side === "groom" ? " (groom’s side)" : ""}`}
          make={() => ({ id: newId(), side: "bride", name: {}, relation: {}, blurb: {} }) as FamilyMember}
          addLabel="Add a family member"
          empty="Add the parents first, then grandparents and siblings."
          render={(m, _i, up) => (
            <>
              <Grid>
                <SelectField label="Whose family?" value={m.side} onChange={(e) => up({ side: e.target.value as never, parentId: undefined, spouseOf: undefined })}><option value="bride">Bride’s side</option><option value="groom">Groom’s side</option></SelectField>
                <LText label="Relation to the couple" value={m.relation} onChange={(v) => up({ relation: v })} placeholder="Father of the bride" />
              </Grid>
              <LText label="Name" required value={m.name} onChange={(v) => up({ name: v })} />
              <LText label="A line about them (optional)" multiline value={m.blurb} onChange={(v) => up({ blurb: v })} />
              {has("family_tree") && (
                <Grid>
                  <SelectField label="Child of (for the family tree)" value={m.parentId ?? ""} onChange={(e) => up({ parentId: e.target.value || undefined })}>
                    <option value="">— top of the tree —</option>
                    {f.members.filter((x) => x.id !== m.id && x.side === m.side && !x.spouseOf).map((x) => (<option key={x.id} value={x.id}>{sideName(x)}</option>))}
                  </SelectField>
                  <SelectField label="Spouse of" value={m.spouseOf ?? ""} onChange={(e) => up({ spouseOf: e.target.value || undefined })} hint="Shows the couple side by side in the tree.">
                    <option value="">— not a spouse entry —</option>
                    {f.members.filter((x) => x.id !== m.id && x.side === m.side && !x.spouseOf).map((x) => (<option key={x.id} value={x.id}>{sideName(x)}</option>))}
                  </SelectField>
                </Grid>
              )}
              <MediaField label="Photo (optional)" value={m.photo} category="FAMILY" aspect="aspect-square" onChange={(id) => up({ photo: id })} />
            </>
          )}
        />
        {!has("family_tree") && <Hint>The interactive family tree and relationship map are part of the Signature package.</Hint>}
      </FormCard>

      <FormCard title="The wedding party" description="Bridesmaids, groomsmen, best friends and siblings who stand beside the couple.">
        <ListEditor
          items={f.party}
          onChange={(items) => update((d) => void (d.family.party = items))}
          keyOf={(p) => p.id}
          title={(p) => `${p.name.en || "Unnamed"}${p.role.en ? " — " + p.role.en : ""}`}
          make={() => ({ id: newId(), side: "bride", name: {}, role: {}, note: {} }) as PartyMember}
          addLabel="Add someone"
          render={(p, _i, up) => (
            <>
              <Grid>
                <LText label="Name" required value={p.name} onChange={(v) => up({ name: v })} />
                <LText label="Role" value={p.role} onChange={(v) => up({ role: v })} placeholder="Maid of honour" />
              </Grid>
              <SelectField label="Standing with" value={p.side} onChange={(e) => up({ side: e.target.value as never })}><option value="bride">The bride</option><option value="groom">The groom</option></SelectField>
              <MediaField label="Photo (optional)" value={p.photo} category="FAMILY" aspect="aspect-square" onChange={(id) => up({ photo: id })} />
            </>
          )}
        />
      </FormCard>
    </div>
  );
}
