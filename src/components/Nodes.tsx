import { Handle, Position, useReactFlow } from 'reactflow';
import React, { useState, useRef, useCallback, useEffect } from 'react';

import styles from '../styles/Editor.module.css'

interface ComparisonProps {
  value: string;
  onChange: (value: string) => void;
}
function Comparison({value, onChange}: ComparisonProps) {
  type ComparisonOperation = '=' | '<' | '>' | '<=' | '>=' | 'not =';

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as ComparisonOperation);
  };

  return (
    <select
      id="comparison-select"
      value={value}
      onChange={handleChange}
    >
      <option value="=">=</option>
      <option value="<">&lt;</option>
      <option value=">">&gt;</option>
      <option value="<=">&lt;=</option>
      <option value=">=">&gt;=</option>
      <option value="not =">not =</option>
    </select>
  );
}

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
}
function VariableInput({ value, onChange }: VariableInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<number>(0);
  const AUTOCOMPLETE_OPTIONS: {[key: string]: string} = {
    // Portfolio Data
    "equity()": "equity()",
    "buyingPower()": "buyingPower()",
    "sharesOwned()": "sharesOwned(default)",
    "costBasis()": "costBasis(default)",
    // Standard
    "priceOf()": "priceOf(default, 0)",
    "analystRatingsOf()": "analystRatingsOf(default)", 
    "daysUntilEarningsOf()": "daysUntilEarningsOf(default)", 
    "lowOf()": "lowOf(default, 0, 252)", 
    "highOf()": "highOf(default, 0, 252)", 
    // Momentum Indicators
    "rsiOf()": "rsiOf(default, 0)", 
    "averageRsiOf()": "averageRsiOf(default, 0)", 
    // Trend Indicators
    "adxOf()": "adxOf(default, 0, 14)",
    "posAdxOf()": "posAdxOf(default, 0, 14)",
    "negAdxOf()": "negAdxOf(default, 0, 14)",
    "posAroonIndicatorOf()": "posAroonIndicatorOf(default, 0, 25)",
    "negAroonIndicatorOf()": "negAroonIndicatorOf(default, 0, 25)",
    "cciOf()": "cciOf(default, 0, 20)",
    "dpoOf()": "dpoOf(default, 0, 20)",
    "emaOf()": "emaOf(default, 0, 14)",
    "macdOf()": "macdOf(default, 0, 26)",
    "miOf()": "miOf(default, 0, 14)",
    "posPsarOf()": "posPsarOf(default, 0)", 
    "negPsarOf()": "negPsarOf(default, 0)", 
    "smaOf()": "smaOf(default, 0, 20)", 
    "trixOf()": "trixOf(default, 0, 15)", 
    "posViOf()": "posViOf(default, 0, 14)", 
    "negViOf()": "negViOf(default, 0, 14)", 
    "wmaOf()": "wmaOf(default, 0, 9)", 
    // Volitility Indicators
    "atrOf()": "atrOf(default, 0, 14)",
    "highBollingeOfr()": "highBollingeOfr(default, 0, 20)",
    "lowBollingerOf()": "lowBollingerOf(default, 0, 20)",
    "donchianChannelOf()": "DonchianChannelOf(default, 0, 20)",
    "lowKeltnerOf()": "LowKeltnerOf(default, 0, 20)",
    "highKeltnerOf()": "HighKeltnerOf(default, 0, 20)",
    "ulcerIndexOf()": "atrOf(default, 0, 14)",
    // Volume Indicators
    "volumeOf()": "volumeOf(default, 0)", 
    "averageVolumeOf()": "averageVolumeOf(default, 0, 20)",
    "adiOf()": "adiOf(default, 0)",
    "cmfOf()": "cmfOf(default, 0, 20)", 
    "emvOf()": "emvOf(default, 0, 14)", 
    "fiOf()": "fiOf(default, 0, 13)", 
    "mfiOf()": "mfiOf(default, 0, 14)", 
    "nviOf()": "nviOf(default, 0)", 
    "obvOf()": "obvOf(default, 0)", 
    "vptOf()": "vptOf(default, 0)", 
    "vwapOf()": "vwapOf(default, 0, 14)", 
  };

  // Sync div content with value prop
  useEffect(() => {
    if (divRef.current && divRef.current.innerText !== value) {
      divRef.current.innerText = value;
    }
  }, [value]);

  // Track cursor position
  const updateCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && divRef.current) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(divRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorPosRef.current = preCaretRange.toString().length;
    }
  }, []);

  // Get current word at cursor position
  const getCurrentWord = useCallback((text: string) => {
    const pos = cursorPosRef.current;
    let start = pos;
    let end = pos;

    // Find word boundaries
    while (start > 0 && /[\w()]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w()]/.test(text[end])) end++;

    return text.slice(start, end).toLowerCase();
  }, []);

  // Handle text input
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const text = (e.currentTarget.innerText || '').replace(/\u00A0/g, ' ');
    onChange(text);
    updateCursorPosition();
    const currentWord = getCurrentWord(text);
    
    updateSuggestions(currentWord);
  }, [onChange]);

  // Update suggestions
  const updateSuggestions = useCallback((currentWord: string) => {
    if (currentWord.length > 0) {
      const matches = Object.keys(AUTOCOMPLETE_OPTIONS).filter(option =>
        option.toLowerCase().startsWith(currentWord)
      );
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Complete the word at cursor position
  const completeWord = useCallback((completion: string) => {
    const text = completion;
    const pos = cursorPosRef.current;
    let start = pos;
    let end = pos;

    // Find word boundaries
    while (start > 0 && /[\w()]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w()]/.test(text[end])) end++;

    const before = text.slice(0, start);
    const after = text.slice(end);
    const completionText = AUTOCOMPLETE_OPTIONS[completion] || completion;

    const newText = `${before}${completionText} ${after}`.trim();
    
    setShowSuggestions(false);

    // Update DOM and reposition cursor
    if (divRef.current) {
      divRef.current.innerText = newText;
      const newCursorPos = start + completionText.length;
      
      // Set cursor position after completion
      requestAnimationFrame(() => {
        const range = document.createRange();
        const sel = window.getSelection();
        if (divRef.current?.childNodes[0]) {
          console.log(1)
          range.setStart(divRef.current.childNodes[0], newCursorPos);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    }
  onChange(newText);
  }, [value, onChange]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        completeWord(suggestions[0]);
      }
    }
    // Update cursor position on arrow keys/mouse clicks
    if (['ArrowLeft', 'ArrowRight', 'Click'].includes(e.key)) {
      updateCursorPosition();
    }
  }, [showSuggestions, suggestions, completeWord, updateCursorPosition]);

  return (
    <div className={styles.container}>
      <div
        ref={divRef}
        className={`nodrag ${styles.variableInput}`}
        contentEditable={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={updateCursorPosition}
        onBlur={() => {setShowSuggestions(false)}}
        suppressContentEditableWarning={true}
        spellCheck={false}
        style={{cursor: "default"}}
      ></div>

      {showSuggestions && (
        <div className={styles.suggestions}>
          {suggestions.map((word) => (
            <div
              key={word}
              className={styles.suggestionItem}
              onClick={() => completeWord(word)}
            >
              {word}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StockListProps {
  value: string[];
  onChange: (value: string[]) => void;
}
function StockList({ value, onChange }: StockListProps) {
  return (
    <>
      {value.map((stock)=> {return (
        <div
          className={styles.variableInput}
          contentEditable={false}
          onClick={() => onChange(value.filter((s) => s !== stock))}
          style={{cursor: "default"}}
        >
          {stock}
        </div>
      )})}
      <button className='nodrag' onClick={() => {
          let addedTicker = prompt("Enter a ticker:") || "DEFAULT"
          if (addedTicker && !value.includes(addedTicker.toUpperCase())) {
            onChange([...value, addedTicker.toUpperCase()])
          }
        }}>＋</button>
    </>
  );
}

function LabelNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();

  const handleLabelChange = (value: string) => {
    console.log(1)
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, left: value } } : node
    ));
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div>
        <textarea name="label" id="label" className='nodrag' value={data.left || ''} onInput={(event: React.FormEvent<HTMLTextAreaElement>) => {handleLabelChange(event.currentTarget.value)}}></textarea>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

function IfNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();

  const handleLeftChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, left: value } } : node
    ));
  };

  const handleRightChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, right: value } } : node
    ));
  };

  const handleComparisonChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, comparison: value } } : node
    ));
  }

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>If </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput value={data.left || ''} onChange={handleLeftChange} />
        <Comparison value={data.comparison || ''} onChange={handleComparisonChange} />
        <VariableInput value={data.right || ''} onChange={handleRightChange} />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

function EventNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();

  const handleLeftChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, left: value } } : node
    ));
  };

  const handleRightChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, right: value } } : node
    ));
  };

  const handleComparisonChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, comparison: value } } : node
    ));
  }

  const handleStockListChange = (value : string[]) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, stocks: value } } : node
    ));
  }

  return (
    <>
      <div className={styles.horizontalAlign}>
        <p className={styles.nodeTitle}>Event for </p>
        <StockList value={data.stocks || []} onChange={handleStockListChange}/>
      </div>
      <hr />
      <div className={styles.horizontalAlign}>
        <p className={styles.nodeText}>Trigger when</p>
        <VariableInput value={data.left || ''} onChange={handleLeftChange} />
        <Comparison value={data.comparison || ''} onChange={handleComparisonChange} />
        <VariableInput value={data.right || ''} onChange={handleRightChange} />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}

function BuyNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();

  const handleLeftChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, left: value } } : node
    ));
  };

  const handleStockListChange = (value : string[]) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, stocks: value } } : node
    ));
  }

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>Buy </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput value={data.left || ''} onChange={handleLeftChange} />
        <p className={styles.nodeText}>share(s) of</p>
        <StockList value={data.stocks || []} onChange={handleStockListChange}/>
      </div>
    </>
  )
}

function SellNode({ id, data }: { id: string, data: any }) {
  const { setNodes } = useReactFlow();

  const handleLeftChange = (value: string) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, left: value } } : node
    ));
  };

  const handleStockListChange = (value : string[]) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...data, stocks: value } } : node
    ));
  }

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>Sell </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput value={data.left || ''} onChange={handleLeftChange} />
        <p>share(s) of</p>
        <StockList value={data.stocks || []} onChange={handleStockListChange}/>
      </div>
    </>
  )
}

export { LabelNode, EventNode, IfNode, BuyNode, SellNode }