import { Handle, Position } from 'reactflow';

function LabelNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div>
        <textarea name="label" id="label" className='nodrag'></textarea>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export { LabelNode }