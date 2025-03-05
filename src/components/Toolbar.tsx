import React, { useState, Dispatch, SetStateAction } from 'react';
import { useReactFlow, Node, Edge } from 'reactflow';
import styles from "../styles/Toolbar.module.css";
import { StorageService } from '../services/StorageService';
import { BacktestModal } from './BacktestModal';

interface toolbarProps { 
  addNode: (type: string, screenToFlowPosition: (pos: {x: number, y: number}) => {x: number, y: number}) => void,
  nodes: Node[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
}

const Toolbar: React.FC<toolbarProps> = ({ addNode, nodes, setNodes, edges, setEdges }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const handleNew = () => {
    try {
      const newState = StorageService.handleNew();
      setNodes(newState.nodes);
      setEdges(newState.edges);
    } catch (error) {
      console.error('Failed to create new board:', error);
      // TODO: Add user notification of failure
    }
  };

  const handleSave = () => {
    try {
      StorageService.handleSave(nodes, edges);
    } catch (error) {
      console.error('Failed to save:', error);
      // TODO: Add user notification of failure
    }
  };

  return (
    <>
      <div className={styles.toolbarContainer}>
        {/* File Menu */}
        <div 
          className={styles.toolbarItem}
          onMouseEnter={() => setActiveMenu('file')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button className={styles.toolbarButton}>File</button>
          {activeMenu === 'file' && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem} onClick={handleNew}>New</button>
              <button className={styles.menuItem} >Open</button>
              <button className={styles.menuItem} onClick={handleSave}>Save</button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div 
          className={styles.toolbarItem}
          onMouseEnter={() => setActiveMenu('edit')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button className={styles.toolbarButton}>Edit</button>
          {activeMenu === 'edit' && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem}>Undo</button>
              <button className={styles.menuItem}>Redo</button>
              <button className={styles.menuItem}>Preferences</button>
            </div>
          )}
        </div>

        {/* Add Menu */}
        <div 
          className={styles.toolbarItem}
          onMouseEnter={() => setActiveMenu('add')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button className={styles.toolbarButton}>Add</button>
          {activeMenu === 'add' && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.menuItem}
                onClick={() => addNode('event', screenToFlowPosition)}
              >
                Event
              </button>
              <button 
                className={styles.menuItem} 
                onClick={() => addNode('if', screenToFlowPosition)}
              >
                If
              </button>
              <button 
                className={styles.menuItem} 
                onClick={() => addNode('label', screenToFlowPosition)}
              >
                Label
              </button>
              <button 
                className={styles.menuItem} 
                onClick={() => addNode('buy', screenToFlowPosition)}
              >
                Buy
              </button>
              <button 
                className={styles.menuItem} 
                onClick={() => addNode('sell', screenToFlowPosition)}
              >
                Sell
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div 
          className={styles.toolbarItem}
          onMouseEnter={() => setActiveMenu('tools')}
          onMouseLeave={() => setActiveMenu(null)}
        >
          <button className={styles.toolbarButton}>Tools</button>
          {activeMenu === 'tools' && (
            <div className={styles.dropdownMenu}>
              <button className={styles.menuItem}>Run</button>
              <button 
                className={styles.menuItem} 
                onClick={() => setIsBacktestModalOpen(true)}
              >
                Backtest
              </button>
            </div>
          )}
        </div>
      </div>

      <BacktestModal
        isOpen={isBacktestModalOpen}
        onClose={() => setIsBacktestModalOpen(false)}
      />
    </>
  );
};

export { Toolbar };