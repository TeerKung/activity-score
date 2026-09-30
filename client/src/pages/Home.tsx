import { trpc } from "@/lib/trpc";
import {
  Check,
  Cloud,
  Loader2,
  Pencil,
  RefreshCw,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type Player = {
  id: number;
  slot: number;
  name: string;
  imageUrl: string | null;
  score: number;
  updatedAt: Date;
};

type EditForm = {
  name: string;
  imageUrl: string;
};

const initialsFor = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "?";

const formatSyncTime = (value?: Date) => {
  if (!value) return "รอการซิงก์ครั้งแรก";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

function PlayerAvatar({ player }: { player: Player }) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [player.imageUrl]);

  return (
    <div className="player-avatar" aria-label={`รูปของ ${player.name}`}>
      {player.imageUrl && !imageError ? (
        <img src={player.imageUrl} alt="" onError={() => setImageError(true)} />
      ) : (
        <span>{initialsFor(player.name)}</span>
      )}
    </div>
  );
}

function ScoreRail({
  player,
  busy,
  onAddPoint,
}: {
  player: Player;
  busy: boolean;
  onAddPoint: (player: Player) => void;
}) {
  const complete = player.score >= 10;

  return (
    <div className="score-rail-wrap">
      <div className="score-rail" aria-label={`คะแนนของ ${player.name} ${player.score} จาก 10`}>
        {Array.from({ length: 10 }, (_, index) => {
          const filled = index < player.score;
          const next = index === player.score;
          return (
            <button
              key={index}
              type="button"
              className={`score-cell ${filled ? "is-filled" : ""} ${next ? "is-next" : ""}`}
              disabled={!next || busy || complete}
              onClick={() => onAddPoint(player)}
              aria-label={filled ? `คะแนนที่ ${index + 1} ได้รับแล้ว` : `เพิ่มคะแนนที่ ${index + 1}`}
              title={filled ? "คะแนนนี้ได้รับแล้ว" : next ? "กดเพื่อเพิ่ม 1 คะแนน" : "รอคะแนนก่อนหน้า"}
            >
              {filled ? <Check size={13} strokeWidth={3} /> : index + 1}
            </button>
          );
        })}
      </div>
      <div className="score-rail-caption">
        {complete ? "ครบ 10 คะแนนแล้ว" : busy ? "กำลังบันทึก…" : "กดช่องถัดไปเพื่อเพิ่ม 1 คะแนน"}
      </div>
    </div>
  );
}

function EditPlayerDialog({
  player,
  form,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  player: Player;
  form: EditForm;
  onChange: (form: EditForm) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-player-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="dialog-head">
          <div>
            <p className="eyebrow">แก้ไขข้อมูลผู้เล่น {player.slot}</p>
            <h2 id="edit-player-title">ปรับชื่อและรูปภาพ</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="ปิดหน้าต่าง">
            <X size={18} />
          </button>
        </div>

        <div className="dialog-preview">
          <div className="player-avatar preview-avatar">
            {form.imageUrl ? <img src={form.imageUrl} alt="ตัวอย่างรูปผู้เล่น" /> : <span>{initialsFor(form.name)}</span>}
          </div>
          <div>
            <p className="preview-name">{form.name || "ยังไม่ได้ตั้งชื่อ"}</p>
            <p className="muted-copy">คะแนนปัจจุบัน {player.score}/10 จะไม่เปลี่ยนจากหน้าต่างนี้</p>
          </div>
        </div>

        <label className="field-label" htmlFor="player-name">ชื่อผู้เล่น</label>
        <input
          id="player-name"
          className="text-input"
          value={form.name}
          maxLength={80}
          onChange={event => onChange({ ...form, name: event.target.value })}
          autoFocus
        />

        <label className="field-label" htmlFor="player-image">ลิงก์รูปภาพ (ถ้ามี)</label>
        <input
          id="player-image"
          className="text-input"
          value={form.imageUrl}
          maxLength={500}
          placeholder="https://…"
          onChange={event => onChange({ ...form, imageUrl: event.target.value })}
        />
        <p className="field-hint">ใช้ลิงก์รูปที่ขึ้นต้นด้วย http:// หรือ https:// และปล่อยว่างเพื่อใช้ตัวอักษรย่อ</p>

        <div className="dialog-actions">
          <button type="button" className="button button-quiet" onClick={onClose} disabled={saving}>ยกเลิก</button>
          <button type="button" className="button button-primary" onClick={onSave} disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 size={17} className="spin" /> : <Check size={17} />}
            {saving ? "กำลังบันทึก" : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const utils = trpc.useUtils();
  const { data: players, isLoading, isFetching, error } = trpc.scoreboard.list.useQuery(undefined, {
    refetchInterval: 8000,
    staleTime: 1500,
  });
  const [busyPlayerId, setBusyPlayerId] = React.useState<number | null>(null);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);
  const [editForm, setEditForm] = React.useState<EditForm>({ name: "", imageUrl: "" });

  const addPoint = trpc.scoreboard.addPoint.useMutation({
    onSuccess: async () => {
      await utils.scoreboard.list.invalidate();
    },
    onError: error => toast.error(error.message || "เพิ่มคะแนนไม่สำเร็จ"),
  });

  const updatePlayer = trpc.scoreboard.updatePlayer.useMutation({
    onSuccess: async () => {
      await utils.scoreboard.list.invalidate();
      setEditingPlayer(null);
      toast.success("บันทึกข้อมูลผู้เล่นแล้ว");
    },
    onError: error => toast.error(error.message || "บันทึกข้อมูลไม่สำเร็จ"),
  });

  const handleAddPoint = (player: Player) => {
    if (busyPlayerId !== null || player.score >= 10) return;
    setBusyPlayerId(player.id);
    addPoint.mutate(
      { id: player.id },
      { onSettled: () => setBusyPlayerId(null) },
    );
  };

  const openEditor = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({ name: player.name, imageUrl: player.imageUrl ?? "" });
  };

  const savePlayer = () => {
    if (!editingPlayer || !editForm.name.trim()) return;
    updatePlayer.mutate({
      id: editingPlayer.id,
      name: editForm.name.trim(),
      imageUrl: editForm.imageUrl.trim(),
    });
  };

  const playerList = (players ?? []) as Player[];
  const totalScore = playerList.reduce((sum, player) => sum + player.score, 0);
  const completePlayers = playerList.filter(player => player.score >= 10).length;
  const latestUpdate = playerList.reduce<Date | undefined>((latest, player) => {
    const current = new Date(player.updatedAt);
    return !latest || current > latest ? current : latest;
  }, undefined);

  return (
    <main className="scoreboard-shell">
      <div className="page-grid" aria-hidden="true" />
      <header className="site-header">
        <div className="brand-lockup">
          <img src="/scoreboard-mark.svg" alt="" className="brand-mark" />
          <div>
            <p className="brand-kicker">SHARED SCOREBOARD / 01</p>
            <p className="brand-name">คะแนนกลาง</p>
          </div>
        </div>
        <div className="sync-chip" aria-live="polite">
          <Cloud size={15} />
          <span>{isFetching ? "กำลังซิงก์" : "ข้อมูลกลาง"}</span>
          <span className="sync-dot" />
        </div>
      </header>

      <section className="hero-block">
        <div className="hero-copy">
          <p className="eyebrow">กระดานคะแนน 4 คน</p>
          <h1>ให้คะแนน<br /><span>เห็นพร้อมกัน</span></h1>
          <p className="hero-description">ทุกการกดจะบันทึกไว้ในข้อมูลกลางชุดเดียวกัน ไม่ว่าจะเปิดจากมือถือหรือคอมพิวเตอร์</p>
        </div>
        <div className="hero-note">
          <span className="note-number">10</span>
          <p>คะแนนสูงสุด<br />ต่อคน</p>
        </div>
      </section>

      <section className="summary-strip" aria-label="สรุปคะแนน">
        <div className="summary-item summary-total">
          <div className="summary-icon"><Trophy size={17} /></div>
          <div><span className="summary-label">คะแนนรวม</span><strong>{totalScore}<small> / 40</small></strong></div>
        </div>
        <div className="summary-item">
          <div className="summary-icon blue"><UsersRound size={17} /></div>
          <div><span className="summary-label">ครบเป้าแล้ว</span><strong>{completePlayers}<small> / 4 คน</small></strong></div>
        </div>
        <div className="summary-item summary-sync">
          <RefreshCw size={16} className={isFetching ? "spin" : ""} />
          <span>อัปเดตล่าสุด {formatSyncTime(latestUpdate)}</span>
        </div>
      </section>

      <section className="board-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAYER ROSTER</p>
            <h2>ผู้เล่นทั้งหมด</h2>
          </div>
          <p className="section-hint">แตะช่องว่างถัดไปเพื่อเพิ่ม 1 คะแนน<br />แก้ชื่อและรูปได้จากปุ่มดินสอ</p>
        </div>

        {isLoading ? (
          <div className="state-card"><Loader2 size={22} className="spin" /><span>กำลังโหลดข้อมูลกลาง…</span></div>
        ) : error ? (
          <div className="state-card state-error"><strong>โหลดกระดานคะแนนไม่สำเร็จ</strong><span>กรุณาลองรีเฟรชหน้าอีกครั้ง</span></div>
        ) : (
          <div className="player-grid">
            {playerList.map(player => (
              <article className={`player-card player-card-${player.slot}`} key={player.id}>
                <div className="card-topline">
                  <span className="player-number">0{player.slot}</span>
                  <button type="button" className="edit-button" onClick={() => openEditor(player)} aria-label={`แก้ไขข้อมูล ${player.name}`}>
                    <Pencil size={15} />
                    <span>แก้ข้อมูล</span>
                  </button>
                </div>
                <div className="player-identity">
                  <PlayerAvatar player={player} />
                  <div className="player-name-block">
                    <h3>{player.name}</h3>
                    <p>{player.score >= 10 ? "เสร็จสมบูรณ์" : "กำลังเก็บคะแนน"}</p>
                  </div>
                  <div className="score-number"><strong>{player.score}</strong><span>/10</span></div>
                </div>
                <ScoreRail player={player} busy={busyPlayerId === player.id} onAddPoint={handleAddPoint} />
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <p><span className="footer-mark">●</span> คะแนนกลางเก็บข้อมูลชุดเดียวกันสำหรับทุกคน</p>
        <p className="footer-meta">อัปเดตอัตโนมัติทุก 8 วินาที</p>
      </footer>

      {editingPlayer ? (
        <EditPlayerDialog
          player={editingPlayer}
          form={editForm}
          onChange={setEditForm}
          onClose={() => setEditingPlayer(null)}
          onSave={savePlayer}
          saving={updatePlayer.isPending}
        />
      ) : null}
    </main>
  );
}
