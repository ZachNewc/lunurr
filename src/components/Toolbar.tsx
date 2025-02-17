import React, { useState } from 'react';
import styles from "../styles/Toolbar.module.css";

interface ToolbarProps {
  addNode: (type: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ addNode }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
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
            <button className={styles.menuItem}>New</button>
            <button className={styles.menuItem}>Open</button>
            <button className={styles.menuItem}>Save</button>
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
              onClick={() => addNode('event')}
            >
              Event
            </button>
            <button 
              className={styles.menuItem} 
              onClick={() => addNode('if')}
            >
              If
            </button>
            <button 
              className={styles.menuItem} 
              onClick={() => addNode('label')}
            >
              Label
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { Toolbar };