import React, { useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import MidArea from "./components/MidArea";
import PreviewArea from "./components/PreviewArea";
import "./styles.css";

const spriteKinds = [
  { kind: "cat", icon: "🐱", color: "#ffab19" },
  { kind: "dog", icon: "🐶", color: "#c88954" },
  { kind: "robot", icon: "🤖", color: "#4c97ff" },
  { kind: "rocket", icon: "🚀", color: "#9966ff" },
  { kind: "ball", icon: "⚽", color: "#0fbd8c" }
];

const initialSprites = [{ id: 1, name: "Sprite 1", kind: "cat", icon: "🐱", x: -110, y: 0, direction: 90, visible: true, color: "#ffab19", script: [] }];

const makeBlock = (type) => ({ id: `${Date.now()}-${Math.random()}`, type, steps: 10, degrees: 15, x: 0, y: 0, text: "Hello!", seconds: 2, times: 4, children: [] });

export default function App() {
  const [sprites, setSprites] = useState(initialSprites);
  const [selectedId, setSelectedId] = useState(1);
  const [category, setCategory] = useState("Motion");
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const spritesRef = useRef(initialSprites);
  const runIdRef = useRef(0);
  const waitersRef = useRef(new Set());
  const selected = sprites.find((sprite) => sprite.id === selectedId) || sprites[0];

  const commitSprites = (update) => {
    const next = typeof update === "function" ? update(spritesRef.current) : update;
    spritesRef.current = next;
    setSprites(next);
  };

  const updateSprite = (id, changes) => commitSprites((current) => current.map((sprite) => sprite.id === id ? { ...sprite, ...changes } : sprite));
  const updateScript = (id, script) => updateSprite(id, { script });
  const addSprite = () => {
    const id = Date.now();
    const kind = spriteKinds[(spritesRef.current.length) % spriteKinds.length];
    const count = spritesRef.current.length;
    const next = { id, name: `Sprite ${count + 1}`, ...kind, x: count % 2 ? 110 : -110, y: 0, direction: 90, visible: true, script: [] };
    commitSprites((current) => [...current, next]);
    setSelectedId(id);
  };
  const removeSprite = (id) => {
    if (spritesRef.current.length < 2) return;
    const next = spritesRef.current.filter((sprite) => sprite.id !== id);
    commitSprites(next);
    if (selectedId === id) setSelectedId(next[0].id);
  };
  const addBlock = (block, index) => {
    const next = [...selected.script];
    next.splice(index == null ? next.length : index, 0, block);
    updateScript(selectedId, next);
  };
  const moveSprite = (id, dx, dy) => commitSprites((current) => current.map((sprite) => sprite.id === id ? { ...sprite, x: Math.max(-225, Math.min(225, sprite.x + dx)), y: Math.max(-155, Math.min(155, sprite.y + dy)) } : sprite));

  const stop = () => {
    runIdRef.current += 1;
    waitersRef.current.forEach((cancel) => cancel());
    waitersRef.current.clear();
    commitSprites((current) => current.map((sprite) => ({ ...sprite, bubble: "" })));
    setPlaying(false);
    setNotice("");
  };

  const run = async () => {
    if (playing) {
      stop();
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isRunning = () => runIdRef.current === runId;
    const wait = (duration) => new Promise((resolve) => {
      let cancel;
      const timer = setTimeout(() => {
        waitersRef.current.delete(cancel);
        resolve();
      }, Math.max(0, duration));
      cancel = () => {
        clearTimeout(timer);
        waitersRef.current.delete(cancel);
        resolve();
      };
      waitersRef.current.add(cancel);
    });

    setPlaying(true);
    setNotice("");
    const collisions = new Set();

    const checkCollision = () => {
      const current = spritesRef.current.filter((sprite) => sprite.visible);
      for (let left = 0; left < current.length; left += 1) {
        for (let right = left + 1; right < current.length; right += 1) {
          const first = current[left];
          const second = current[right];
          const key = [first.id, second.id].sort().join(":");
          const distance = Math.hypot(first.x - second.x, first.y - second.y);
          if (distance > 90) collisions.delete(key);
          if (distance <= 70 && !collisions.has(key)) {
            collisions.add(key);
            commitSprites((items) => items.map((sprite) => sprite.id === first.id ? { ...sprite, script: second.script } : sprite.id === second.id ? { ...sprite, script: first.script } : sprite));
            setNotice(`${first.name} and ${second.name} collided — scripts swapped`);
            return true;
          }
        }
      }
      return false;
    };

    const runSequence = async (spriteId, program, blocks) => {
      for (const block of blocks) {
        if (!isRunning()) return false;
        const currentSprite = spritesRef.current.find((sprite) => sprite.id === spriteId);
        if (!currentSprite || currentSprite.script !== program) return false;

        if (block.type === "move") {
          const direction = currentSprite.direction * Math.PI / 180;
          moveSprite(spriteId, Math.sin(direction) * Number(block.steps || 0), Math.cos(direction) * Number(block.steps || 0));
          await wait(280);
        } else if (block.type === "turn") {
          updateSprite(spriteId, { direction: ((currentSprite.direction + Number(block.degrees || 0)) % 360 + 360) % 360 });
          await wait(280);
        } else if (block.type === "goto") {
          updateSprite(spriteId, { x: Number(block.x || 0), y: Number(block.y || 0) });
          await wait(280);
        } else if (block.type === "say" || block.type === "think") {
          updateSprite(spriteId, { bubble: block.text || "", thought: block.type === "think" });
          await wait(Number(block.seconds || 0) * 1000);
          updateSprite(spriteId, { bubble: "" });
        } else if (block.type === "repeat") {
          const times = Math.max(0, Math.min(100, Math.floor(Number(block.times) || 0)));
          for (let count = 0; count < times; count += 1) {
            const completed = await runSequence(spriteId, program, block.children || []);
            if (!completed) return false;
          }
        }

        if (checkCollision()) await wait(220);
        const afterAction = spritesRef.current.find((sprite) => sprite.id === spriteId);
        if (!isRunning() || !afterAction || afterAction.script !== program) return false;
      }
      return true;
    };

    const runSprite = async (spriteId) => {
      while (isRunning()) {
        const sprite = spritesRef.current.find((item) => item.id === spriteId);
        if (!sprite || !sprite.script.length) return;
        const program = sprite.script;
        const completed = await runSequence(spriteId, program, program);
        if (completed) return;
      }
    };

    await Promise.all(spritesRef.current.map((sprite) => runSprite(sprite.id)));
    if (isRunning()) {
      runIdRef.current += 1;
      setPlaying(false);
    }
  };

  const resetPositions = () => commitSprites((items) => items.map((sprite, index) => ({ ...sprite, x: index % 2 ? 110 : -110, y: 0, direction: 90, bubble: "" })));

  return (
    <main className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark">✳</span><span>playground</span></div><div className="top-actions"><button className="quiet-button" onClick={() => { stop(); commitSprites(initialSprites); setSelectedId(1); }}>Reset</button><button className="share-button">Share project <span>↗</span></button></div></header>
      <div className="editor-layout">
        <section className="coding-panel"><div className="panel-heading"><div><span className="eyebrow">BUILD</span><h1>Code</h1></div></div>
          <div className="code-content"><Sidebar category={category} setCategory={setCategory} onAddBlock={addBlock} /><MidArea key={selectedId} script={selected.script} onChange={(script) => updateScript(selectedId, script)} makeBlock={makeBlock} /></div>
        </section>
        <section className="stage-panel"><div className="stage-heading"><div><span className="eyebrow">PREVIEW</span><h1>Stage</h1></div><div className="stage-controls"><button className={`play-button ${playing ? "stop" : ""}`} onClick={run}>{playing ? "■ Stop" : "▶ Run"}</button><button className="icon-button" title="Reset positions" onClick={resetPositions}>↺</button></div></div>
          <PreviewArea sprites={sprites} selectedId={selectedId} onSelect={setSelectedId} playing={playing} />
          <div className="sprite-footer"><div className="sprite-list-title"><span>Sprites</span><button onClick={addSprite} aria-label="Add sprite">＋</button></div><div className="sprite-list">{sprites.map((sprite) => <button key={sprite.id} className={`sprite-card ${selectedId === sprite.id ? "active" : ""}`} onClick={() => setSelectedId(sprite.id)}><span className="sprite-thumb" style={{ "--sprite-color": sprite.color }}>{sprite.icon}</span><span className="sprite-card-name">{sprite.name}</span><span className="sprite-card-x" onClick={(event) => { event.stopPropagation(); removeSprite(sprite.id); }}>×</span></button>)}</div>
            <div className="sprite-properties"><div className="property-name"><span className="eyebrow">SELECTED SPRITE</span><input value={selected.name} onChange={(event) => updateSprite(selectedId, { name: event.target.value })} /></div><label>x <input type="number" value={Math.round(selected.x)} onChange={(event) => updateSprite(selectedId, { x: Number(event.target.value) })} /></label><label>y <input type="number" value={Math.round(selected.y)} onChange={(event) => updateSprite(selectedId, { y: Number(event.target.value) })} /></label><label>↻ <input type="number" value={selected.direction} onChange={(event) => updateSprite(selectedId, { direction: Number(event.target.value) })} /></label></div>
          </div>{notice && <div className="toast">✦ {notice}</div>}
        </section>
      </div>
    </main>
  );
}
