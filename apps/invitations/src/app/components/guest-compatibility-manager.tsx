'use client';

import { useMemo, useState } from 'react';
import type { GuestSeatingProfile, SeatingGuest } from '@/lib/seating-types';

type Locale = 'ru' | 'az' | 'en';
type Relation = 'required' | 'preferred' | 'excluded' | 'none';
type Profile = Pick<GuestSeatingProfile, 'side' | 'group' | 'requiredNeighbors' | 'preferredNeighbors' | 'excludedNeighbors' | 'isVip'>;
type GuestGroup = { id: string; name: string };

const copy = {
  ru: {
    title: 'Совместимость гостей',
    subtitle: 'Укажите, кого нужно посадить вместе, кого желательно объединить, а кого разделить.',
    required: 'Обязательно вместе',
    preferred: 'Желательно вместе',
    excluded: 'Не сажать вместе',
    none: 'Без предпочтений',
    legend: 'Нажимайте на ячейку, чтобы изменить отношение. Изменение применяется к обоим гостям.',
    guests: 'Гости',
    groups: 'Группы',
    group: 'Группа гостя',
    side: 'Сторона',
    bride: 'Невеста',
    groom: 'Жених',
    shared: 'Общие',
    vip: 'VIP-гость',
    all: 'Все гости',
    selectGuest: 'Выберите гостя',
    addGroup: 'Добавить группу',
    groupName: 'Название группы',
    save: 'Сохранить',
    saving: 'Сохранение…',
    saved: 'Все изменения сохранены',
    unsaved: 'Есть несохранённые изменения',
    error: 'Не удалось сохранить изменения',
    empty: 'Пока нет гостей. Сначала добавьте гостей в разделе «Гости».',
    matrix: 'Матрица совместимости',
    mobile: 'Отношения выбранного гостя',
    conflict: 'Конфликт: гости, которых нужно посадить вместе, отмечены как нежелательные соседи.',
    noRelations: 'Отношения пока не заданы',
  },
  az: {
    title: 'Qonaqların uyğunluğu',
    subtitle: 'Birlikdə oturmalı, birlikdə oturması arzu olunan və ayrı oturmalı qonaqları seçin.',
    required: 'Mütləq birlikdə',
    preferred: 'Birlikdə olması arzuolunandır',
    excluded: 'Birlikdə oturmasın',
    none: 'Seçim yoxdur',
    legend: 'Münasibəti dəyişmək üçün xanaya klikləyin. Dəyişiklik hər iki qonağa tətbiq olunur.',
    guests: 'Qonaqlar',
    groups: 'Qruplar',
    group: 'Qonağın qrupu',
    side: 'Tərəf',
    bride: 'Gəlin',
    groom: 'Bəy',
    shared: 'Ümumi',
    vip: 'VIP qonaq',
    all: 'Bütün qonaqlar',
    selectGuest: 'Qonaq seçin',
    addGroup: 'Qrup əlavə et',
    groupName: 'Qrupun adı',
    save: 'Yadda saxla',
    saving: 'Yadda saxlanılır…',
    saved: 'Bütün dəyişikliklər saxlanılıb',
    unsaved: 'Saxlanılmamış dəyişikliklər var',
    error: 'Dəyişiklikləri saxlamaq mümkün olmadı',
    empty: 'Hələ qonaq yoxdur. Əvvəlcə «Qonaqlar» bölməsində qonaq əlavə edin.',
    matrix: 'Uyğunluq matrisi',
    mobile: 'Seçilmiş qonağın münasibətləri',
    conflict: 'Ziddiyyət: birlikdə oturmalı qonaqlar arzuolunmaz qonşu kimi qeyd edilib.',
    noRelations: 'Hələ münasibət təyin edilməyib',
  },
  en: {
    title: 'Guest compatibility',
    subtitle: 'Choose who must sit together, who would prefer to sit together, and who should be separated.',
    required: 'Must sit together',
    preferred: 'Prefer together',
    excluded: 'Keep apart',
    none: 'No preference',
    legend: 'Click a cell to change the relationship. Changes apply to both guests.',
    guests: 'Guests',
    groups: 'Groups',
    group: 'Guest group',
    side: 'Side',
    bride: 'Bride',
    groom: 'Groom',
    shared: 'Shared',
    vip: 'VIP guest',
    all: 'All guests',
    selectGuest: 'Select a guest',
    addGroup: 'Add group',
    groupName: 'Group name',
    save: 'Save',
    saving: 'Saving…',
    saved: 'All changes saved',
    unsaved: 'Unsaved changes',
    error: 'Could not save changes',
    empty: 'No guests yet. Add guests in the Guests section first.',
    matrix: 'Compatibility matrix',
    mobile: 'Selected guest relationships',
    conflict: 'Conflict: guests required to sit together are marked as incompatible.',
    noRelations: 'No relationships defined yet',
  },
};

const relationOrder: Relation[] = ['none', 'preferred', 'required', 'excluded'];

const relationPriority: Record<Relation, number> = {
  none: 0,
  preferred: 1,
  required: 2,
  excluded: 3,
};

function normalizeRelations(
  profiles: Record<string, Profile>,
  guestIds: string[],
): Record<string, Profile> {
  const normalized = Object.fromEntries(
    Object.entries(profiles).map(([id, profile]) => [
      id,
      {
        ...profile,
        requiredNeighbors: [...profile.requiredNeighbors],
        preferredNeighbors: [...profile.preferredNeighbors],
        excludedNeighbors: [...profile.excludedNeighbors],
      },
    ])
  ) as Record<string, Profile>;

  function readRelation(profile: Profile, otherId: string): Relation {
    if (profile.excludedNeighbors.includes(otherId)) return 'excluded';
    if (profile.requiredNeighbors.includes(otherId)) return 'required';
    if (profile.preferredNeighbors.includes(otherId)) return 'preferred';
    return 'none';
  }

  for (let i = 0; i < guestIds.length; i++) {
    for (let j = i + 1; j < guestIds.length; j++) {
      const a = guestIds[i];
      const b = guestIds[j];
      const pa = normalized[a];
      const pb = normalized[b];
      if (!pa || !pb) continue;

      const relations = [
        readRelation(pa, b),
        readRelation(pb, a),
      ];

      const relation = relations.reduce((best, current) =>
        relationPriority[current] > relationPriority[best] ? current : best
      , 'none' as Relation);

      for (const profile of [pa, pb]) {
        profile.requiredNeighbors = profile.requiredNeighbors.filter(id => id !== (profile === pa ? b : a));
        profile.preferredNeighbors = profile.preferredNeighbors.filter(id => id !== (profile === pa ? b : a));
        profile.excludedNeighbors = profile.excludedNeighbors.filter(id => id !== (profile === pa ? b : a));
      }

      if (relation !== 'none') {
        const field = relation === 'required'
          ? 'requiredNeighbors'
          : relation === 'preferred'
            ? 'preferredNeighbors'
            : 'excludedNeighbors';

        pa[field].push(b);
        pb[field].push(a);
      }
    }
  }

  return normalized;
}

export default function CompatibilityManager({
  locale,
  guests,
  initialProfiles,
  initialGroups,
}: {
  locale: Locale;
  guests: SeatingGuest[];
  initialProfiles: Record<string, GuestSeatingProfile>;
  initialGroups: GuestGroup[];
}) {
  const t = copy[locale];

  const [profiles, setProfiles] = useState<Record<string, Profile>>(() => {
    const initial = Object.fromEntries(guests.map(guest => {
      const profile = initialProfiles[guest.id];
      return [guest.id, {
        side: profile?.side ?? 'shared',
        isVip: profile?.isVip ?? false,
        group: profile?.group ?? 'other',
        requiredNeighbors: profile?.requiredNeighbors ?? [],
        preferredNeighbors: profile?.preferredNeighbors ?? [],
        excludedNeighbors: profile?.excludedNeighbors ?? [],
      }];
    })) as Record<string, Profile>;

    return normalizeRelations(initial, guests.map(guest => guest.id));
  });

  const [groups, setGroups] = useState<GuestGroup[]>(initialGroups);
  const [selectedGuest, setSelectedGuest] = useState(guests[0]?.id ?? '');
  const [newGroupName, setNewGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState('');

  const guestMap = useMemo(() => new Map(guests.map(g => [g.id, g.name])), [guests]);

  function getRelation(a: string, b: string): Relation {
    const profile = profiles[a];
    if (!profile) return 'none';
    if (profile.requiredNeighbors.includes(b)) return 'required';
    if (profile.preferredNeighbors.includes(b)) return 'preferred';
    if (profile.excludedNeighbors.includes(b)) return 'excluded';
    return 'none';
  }

  function setRelation(a: string, b: string, relation: Relation) {
    if (a === b) return;

    setProfiles(current => {
      const next = { ...current };

      for (const id of [a, b]) {
        const other = id === a ? b : a;
        const profile = current[id] ?? {
          side: 'shared',
          isVip: false,
          group: 'other',
          requiredNeighbors: [],
          preferredNeighbors: [],
          excludedNeighbors: [],
        };

        next[id] = {
          ...profile,
          requiredNeighbors: profile.requiredNeighbors.filter(item => item !== other),
          preferredNeighbors: profile.preferredNeighbors.filter(item => item !== other),
          excludedNeighbors: profile.excludedNeighbors.filter(item => item !== other),
        };

        if (relation !== 'none') {
          const field = relation === 'required'
            ? 'requiredNeighbors'
            : relation === 'preferred'
              ? 'preferredNeighbors'
              : 'excludedNeighbors';

          next[id] = {
            ...next[id],
            [field]: [...next[id][field], other],
          };
        }
      }

      return next;
    });

    setSaved(false);
    setError('');
  }

  function setGuestVip(guestId: string, isVip: boolean) {
    setProfiles(current => ({
      ...current,
      [guestId]: { ...current[guestId], isVip },
    }));
    setSaved(false);
    setError('');
  }

  function setGuestSide(guestId: string, side: 'bride' | 'groom' | 'shared') {
    setProfiles(current => ({
      ...current,
      [guestId]: { ...current[guestId], side },
    }));
    setSaved(false);
    setError('');
  }

  function setGuestGroup(guestId: string, group: string) {
    setProfiles(current => ({
      ...current,
      [guestId]: { ...current[guestId], group },
    }));
    setSaved(false);
  }

  function addGroup() {
    const name = newGroupName.trim();
    if (!name) return;

    const id = `group-${crypto.randomUUID()}`;
    setGroups(current => [...current, { id, name }]);
    setNewGroupName('');
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/guests/compatibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles, guestGroups: groups }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || t.error);
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  function relationLabel(relation: Relation) {
    if (relation === 'required') return '++';
    if (relation === 'preferred') return '+';
    if (relation === 'excluded') return '−';
    return '·';
  }

  function cycleRelation(a: string, b: string) {
    const current = getRelation(a, b);
    const next = relationOrder[(relationOrder.indexOf(current) + 1) % relationOrder.length];
    setRelation(a, b, next);
  }

  const conflicts = useMemo(() => {
    const result: string[] = [];
    for (const guest of guests) {
      const profile = profiles[guest.id];
      if (!profile) continue;
      for (const otherId of profile.requiredNeighbors) {
        if (profile.excludedNeighbors.includes(otherId)) {
          result.push(`${guest.name} — ${guestMap.get(otherId) ?? otherId}`);
        }
      }
    }
    return [...new Set(result)];
  }, [guests, profiles, guestMap]);

  if (!guests.length) {
    return (
      <section className="gc-page">
        <div className="gc-heading">
          <span className="gc-eyebrow">ELARIO / GUEST MANAGEMENT</span>
          <h1>{t.title}</h1>
          <p>{t.empty}</p>
        </div>
      </section>
    );
  }

  const selectedProfile = profiles[selectedGuest];

  return (
    <section className="gc-page">
      <div className="gc-heading">
        <span className="gc-eyebrow">ELARIO / GUEST MANAGEMENT</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>

      <div className="gc-legend">
        <span><b className="gc-symbol gc-required">++</b>{t.required}</span>
        <span><b className="gc-symbol gc-preferred">+</b>{t.preferred}</span>
        <span><b className="gc-symbol gc-excluded">−</b>{t.excluded}</span>
        <span><b className="gc-symbol gc-none">·</b>{t.none}</span>
      </div>

      <p className="gc-hint">{t.legend}</p>

      {conflicts.length > 0 && (
        <div className="gc-conflict">
          <strong>{t.conflict}</strong>
          <span>{conflicts.join(', ')}</span>
        </div>
      )}

      <div className="gc-toolbar">
        <div className="gc-save-state">
          <span className={`gc-status-dot ${saved ? 'is-saved' : 'is-dirty'}`} />
          {saving ? t.saving : saved ? t.saved : t.unsaved}
          {error && <span className="gc-error">{error}</span>}
        </div>
        <button className="gc-save-button" onClick={save} disabled={saving || saved}>
          {saving ? t.saving : t.save}
        </button>
      </div>

      <div className="gc-mobile-controls">
        <label>
          {t.selectGuest}
          <select value={selectedGuest} onChange={event => setSelectedGuest(event.target.value)}>
            {guests.map(guest => <option key={guest.id} value={guest.id}>{guest.name}</option>)}
          </select>
        </label>

        {selectedProfile && (
          <>
            <label>
              {t.side}
              <select value={selectedProfile.side} onChange={event => setGuestSide(selectedGuest, event.target.value as 'bride' | 'groom' | 'shared')}>
                <option value="bride">{t.bride}</option>
                <option value="groom">{t.groom}</option>
                <option value="shared">{t.shared}</option>
              </select>
            </label>
            <label className="gc-vip-toggle">
              <input
                type="checkbox"
                checked={selectedProfile.isVip}
                onChange={event => setGuestVip(selectedGuest, event.target.checked)}
              />
              {t.vip}
            </label>
            <label>
              {t.group}
              <select value={selectedProfile.group} onChange={event => setGuestGroup(selectedGuest, event.target.value)}>
                <option value="other">—</option>
                <option value="family">{locale === 'ru' ? 'Семья' : locale === 'az' ? 'Ailə' : 'Family'}</option>
                <option value="friends">{locale === 'ru' ? 'Друзья' : locale === 'az' ? 'Dostlar' : 'Friends'}</option>
                <option value="colleagues">{locale === 'ru' ? 'Коллеги' : locale === 'az' ? 'Həmkarlar' : 'Colleagues'}</option>
                {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>

            <div className="gc-mobile-relations">
              <h3>{t.mobile}</h3>
              {guests.filter(guest => guest.id !== selectedGuest).map(guest => {
                const relation = getRelation(selectedGuest, guest.id);
                return (
                  <div className="gc-mobile-row" key={guest.id}>
                    <span>{guest.name}</span>
                    <button
                      type="button"
                      className={`gc-cell gc-${relation}`}
                      onClick={() => cycleRelation(selectedGuest, guest.id)}
                      aria-label={`${guest.name}: ${relation}`}
                    >
                      {relationLabel(relation)}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="gc-desktop-matrix">
        <div className="gc-matrix-title">
          <h2>{t.matrix}</h2>
          <span>{guests.length} {t.guests.toLowerCase()}</span>
        </div>
        <div className="gc-matrix-scroll">
          <table className="gc-matrix">
            <thead>
              <tr>
                <th className="gc-corner">{t.guests}</th>
                <th className="gc-group-heading">{t.side}</th>
                <th className="gc-group-heading">{t.vip}</th>
                {guests.map(guest => (
                  <th className="gc-column-name" key={guest.id}>
                    <span>{guest.name}</span>
                  </th>
                ))}
                <th className="gc-group-heading">{t.groups}</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(guest => (
                <tr key={guest.id}>
                  <th className="gc-row-name">{guest.name}</th>
                  <td className="gc-group-cell">
                    <select
                      aria-label={`${t.side}: ${guest.name}`}
                      value={profiles[guest.id]?.side ?? 'shared'}
                      onChange={event => setGuestSide(guest.id, event.target.value as 'bride' | 'groom' | 'shared')}
                    >
                      <option value="bride">{t.bride}</option>
                      <option value="groom">{t.groom}</option>
                      <option value="shared">{t.shared}</option>
                    </select>
                  </td>
                  <td className="gc-group-cell">
                    <input
                      type="checkbox"
                      aria-label={`${t.vip}: ${guest.name}`}
                      checked={profiles[guest.id]?.isVip ?? false}
                      onChange={event => setGuestVip(guest.id, event.target.checked)}
                    />
                  </td>
                  {guests.map(other => {
                    const relation = guest.id === other.id ? 'none' : getRelation(guest.id, other.id);
                    return (
                      <td key={other.id}>
                        <button
                          type="button"
                          disabled={guest.id === other.id}
                          className={`gc-cell gc-${guest.id === other.id ? 'diagonal' : relation}`}
                          onClick={() => cycleRelation(guest.id, other.id)}
                          title={`${guest.name} — ${other.name}`}
                        >
                          {guest.id === other.id ? '—' : relationLabel(relation)}
                        </button>
                      </td>
                    );
                  })}
                  <td className="gc-group-cell">
                    <select
                      aria-label={`${t.group}: ${guest.name}`}
                      value={profiles[guest.id]?.group ?? 'other'}
                      onChange={event => setGuestGroup(guest.id, event.target.value)}
                    >
                      <option value="other">—</option>
                      <option value="family">{locale === 'ru' ? 'Семья' : locale === 'az' ? 'Ailə' : 'Family'}</option>
                      <option value="friends">{locale === 'ru' ? 'Друзья' : locale === 'az' ? 'Dostlar' : 'Friends'}</option>
                      <option value="colleagues">{locale === 'ru' ? 'Коллеги' : locale === 'az' ? 'Həmkarlar' : 'Colleagues'}</option>
                      {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="gc-groups-panel">
        <div>
          <h3>{t.groups}</h3>
          <p>{locale === 'ru' ? 'Создавайте собственные группы для удобной организации гостей.' : locale === 'az' ? 'Qonaqları təşkil etmək üçün öz qruplarınızı yaradın.' : 'Create custom groups to organize guests.'}</p>
        </div>
        <div className="gc-add-group">
          <input
            value={newGroupName}
            onChange={event => setNewGroupName(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && addGroup()}
            placeholder={t.groupName}
            maxLength={100}
          />
          <button type="button" onClick={addGroup} disabled={!newGroupName.trim()}>{t.addGroup}</button>
        </div>
        {groups.length > 0 && (
          <div className="gc-group-tags">
            {groups.map(group => (
              <span key={group.id}>{group.name}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
