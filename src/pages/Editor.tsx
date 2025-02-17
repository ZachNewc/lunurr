import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MiniMap,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LabelNode } from '../components/Nodes';
import { Toolbar } from '../components/Toolbar';
import styles from '../styles/Editor.module.css';


const nodeTypes =  { label: LabelNode }

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

const Editor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Connection handlers
  const onConnectStart = useCallback(() => {
    console.log('Connection started - user is dragging a connection');
  }, []);

  const onConnectEnd = useCallback(() => {
    console.log(nodes);
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      console.log('Connection completed between:', connection.source, 'and', connection.target);
      setEdges((eds) => addEdge(connection, eds));
    },
    []
  );

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`, // Unique ID based on timestamp
      position: {
        x: Math.random() * 400, // Random X position for demo (adjust as needed)
        y: Math.random() * 400, // Random Y position for demo (adjust as needed)
      },
      type: type,
      data: {
        label: 'New Node', // Default label
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Delete functionality
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  // Node/edge change handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Delete', 'Backspace']} // Enable built-in delete key handling
        selectionOnDrag={true}
        panOnDrag={[2,3]}
        selectionMode={SelectionMode.Partial}
      >
        <MiniMap pannable zoomable />
        <Background gap={20} size={2} />
        <Controls />
        <Panel position="top-left"><Toolbar addNode={addNode}/></Panel>
      </ReactFlow>
    </div>
  );
};

export default Editor;