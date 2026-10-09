import React from "react";

function ScriptBlock({ block, index, parentId, onChange, onRemove, onDrop, onDragStart }) {
  const field = (key, width = 54) => <input className="block-input" style={{ width }} value={block[key] == null ? "" : block[key]} onChange={(event) => onChange(block.id, { [key]: event.target.value })} onClick={(event) => event.stopPropagation()} />;
  return <div className={`script-block block-${block.type}`} draggable onDragStart={(event) => onDragStart(event, block.id, parentId)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, index, false, parentId)}>
    <button className="remove-block" onClick={() => onRemove(block.id)}>×</button>
    {block.type === "move" && <>move {field("steps")} steps</>}
    {block.type === "turn" && <>turn ↻ {field("degrees")} degrees</>}
    {block.type === "goto" && <>go to x: {field("x")} y: {field("y")}</>}
    {block.type === "say" && <>say {field("text", 88)} for {field("seconds", 42)} secs</>}
    {block.type === "think" && <>think {field("text", 88)} for {field("seconds", 42)} secs</>}
    {block.type === "repeat" && <><div className="repeat-title">repeat {field("times", 42)}</div><div className="repeat-inner" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.stopPropagation(); onDrop(event, (block.children || []).length, true, block.id); }}>{(block.children || []).map((child, childIndex) => <ScriptBlock key={child.id} block={child} index={childIndex} parentId={block.id} onChange={onChange} onRemove={onRemove} onDrop={onDrop} onDragStart={onDragStart} />)}{!block.children?.length && <span className="drop-hint">drop blocks here</span>}</div><div className="repeat-end">end</div></>}
  </div>;
}

const findBlock = (blocks, id) => {
  for (const block of blocks) {
    if (block.id === id) return block;
    const child = findBlock(block.children || [], id);
    if (child) return child;
  }
  return null;
};

const removeBlock = (blocks, id) => {
  let removed = null;
  const next = blocks.reduce((result, block) => {
    if (block.id === id) {
      removed = block;
      return result;
    }
    const [children, found] = removeBlock(block.children || [], id);
    if (found) removed = found;
    result.push(block.children ? { ...block, children } : block);
    return result;
  }, []);
  return [next, removed];
};

const insertInto = (blocks, parentId, index, item) => {
  if (!parentId) {
    const next = [...blocks];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
    return next;
  }
  return blocks.map((block) => block.id === parentId
    ? { ...block, children: (() => { const next = [...(block.children || [])]; next.splice(Math.max(0, Math.min(index, next.length)), 0, item); return next; })() }
    : block.children ? { ...block, children: insertInto(block.children, parentId, index, item) } : block);
};

export default function MidArea({ script, onChange, makeBlock }) {
  const onRemove = (id) => onChange(removeBlock(script, id)[0]);
  const onChangeBlock = (id, changes) => {
    const update = (blocks) => blocks.map((block) => block.id === id ? { ...block, ...changes } : block.children ? { ...block, children: update(block.children) } : block);
    onChange(update(script));
  };
  const receiveDrop = (event, index, nested = false, parentId = null) => {
    event.preventDefault();
    event.stopPropagation();
    const existing = event.dataTransfer.getData("application/scratch-existing");
    if (existing) {
      const source = JSON.parse(existing);
      const dragged = findBlock(script, source.id);
      if (!dragged || dragged.id === parentId || (dragged.type === "repeat" && findBlock(dragged.children || [], parentId))) return;
      const [remaining, item] = removeBlock(script, source.id);
      onChange(insertInto(remaining, nested ? parentId : null, index, item));
      return;
    }
    const raw = event.dataTransfer.getData("application/scratch-block");
    if (!raw) return;
    const data = JSON.parse(raw);
    const block = makeBlock(data.type);
    if (data.type === "move") block.steps = data.value;
    if (data.type === "turn") block.degrees = data.value;
    if (data.type === "goto") { block.x = data.value; block.y = data.secondValue; }
    if (data.type === "say" || data.type === "think") { block.text = data.value; block.seconds = data.secondValue; }
    if (data.type === "repeat") block.times = data.value;
    onChange(insertInto(script, nested ? parentId : null, index, block));
  };
  const startDrag = (event, id, parentId) => event.dataTransfer.setData("application/scratch-existing", JSON.stringify({ id, parentId }));

  return <section className="workspace" onDragOver={(event) => event.preventDefault()} onDrop={(event) => receiveDrop(event, script.length)}><div className="workspace-toolbar"><span className="eyebrow">SCRIPT</span><span className="workspace-tip">Snap blocks together to build a sequence</span><button className="clear-script" onClick={() => onChange([])}>Clear all</button></div><div className="script-stack">{script.map((block, index) => <ScriptBlock key={block.id} block={block} index={index} onChange={onChangeBlock} onRemove={onRemove} onDrop={receiveDrop} onDragStart={startDrag} />)}{script.length === 0 && <div className="empty-workspace"><div className="empty-icon">↙</div><strong>Your script starts here</strong><span>Drag blocks from the palette or click one to add it.</span></div>}</div><div className="workspace-grid" /></section>;
}
