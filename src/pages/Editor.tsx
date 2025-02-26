import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  DefaultEdgeOptions,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  NodeChange,
  EdgeChange,
  MiniMap,
  SelectionMode,
} from 'reactflow';
import type { MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  LabelNode,
  EventNode, 
  IfNode, 
  BuyNode,
  SellNode,
} from '../components/Nodes';
import { Toolbar } from '../components/Toolbar';
import styles from '../styles/Editor.module.css';

const nodeTypes: NodeTypes = {
  label: LabelNode,
  event: EventNode,
  if: IfNode,
  buy: BuyNode,
  sell: SellNode,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: 'arrow' as MarkerType,
    color: '#b1b1b7',
  },
  style: {
    stroke: '#b1b1b7',
    strokeWidth: 2,
    //strokeDasharray: "10 5"
  },
};

const savedBoard = JSON.parse(localStorage.getItem("board") || "{}");

const initialNodes: Node[] = Array.isArray(savedBoard.nodes) ? savedBoard.nodes : [];
const initialEdges: Edge[] = Array.isArray(savedBoard.edges) ? savedBoard.edges : [];

const Editor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const checkCircularLogic = useCallback((source: string, target: string) => {
    if (target.length == 0 || target == source) {
      console.warn("Attempt to connect node to itself denied.")
      return false
    }
    let checks: string[] = [target]
    while (checks.length > 0) {
      let newChecks: string[] = []
      checks.forEach((checkId) => {
        let children: string[] = []
        edges.forEach((edge: Edge) => {
          if (edge.source == checkId) {
            children.push(edge.target)
          }
        })
        newChecks = newChecks.concat(children)
      }) 
      if (newChecks.includes(source)) {
        console.warn("Attempt to connect node to its own ancestor denied.")
        alert("You cannot connect these nodes because it will create an infinite loop.")
        return false;
      }
      checks = [...newChecks]
    }
    return true
  },[edges])

  const onConnectStart = useCallback(() => {
    // User started dragging node
  }, []);

  const onConnectEnd = useCallback(() => {
    // Mouse release on connection
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      // Successful mouse release on connection
      if (checkCircularLogic(connection.source || "", connection.target || "")) {
        setEdges((eds) => addEdge(connection, eds));
      }
    },
    [edges]
  );

  const addNode = useCallback((type: string, screenToFlowPosition: (pos: {x: number, y: number}) => {x: number, y: number}) => {
    const screenPosition = { x: window.innerWidth/2, y: window.innerHeight/2 };
    const flowPosition = screenToFlowPosition(screenPosition);

    const defaultData = {
      ...(type === 'if' && { left: '', right: '', comparison: '=' }),
      ...(type === 'label' && { left: '' }),
      ...(type === 'if' && { left: '', right: '', comparison: '=' , stocks: ['DEFAULT'] }),
      ...(type === 'buy' && { left: '', stocks: ['DEFAULT'] }),
      ...(type === 'sell' && { left: '', stocks: ['DEFAULT'] }),
    };
  
    const newNode: Node = {
      id: `node-${crypto.randomUUID()}`,
      position: flowPosition,
      type,
      data: defaultData,
    };
  
    setNodes(nds => [...nds, newNode]);
  }, []);

  // Delete functionality
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') {
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
        deleteKeyCode={['Delete']} // Enable built-in delete key handling
        selectionMode={SelectionMode.Partial}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        {/* Add SVG wrapper around defs */}
        <svg>
          <defs>
            <marker
              id="react-flow__arrowclosed"
              viewBox="0 0 10 10"
              refX="10"
              refY="10"
              markerWidth="12"
              markerHeight="12"
              orient="auto"
            >
              <path d="M 0 0 L 20 5 L 0 20 z" fill="#b1b1b7" />
            </marker>
          </defs>
        </svg>
        <MiniMap pannable zoomable />
        <Background gap={20} size={2} />
        <Controls />
        <Panel position="top-left"><Toolbar 
          addNode={addNode}
          nodes={nodes}
          setNodes={setNodes}
          edges={edges}
          setEdges={setEdges}
        /></Panel>
      </ReactFlow>
    </div>
  );
};

export default Editor;