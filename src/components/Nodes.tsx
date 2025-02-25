import { Handle, Position } from 'reactflow';
import React, { useState, useRef, useCallback } from 'react';

import styles from '../styles/Editor.module.css'


function Comparison() {
  type ComparisonOperation = '=' | '<' | '>' | '<=' | '>=' | '≠';

  const [selectedOperation, setSelectedOperation] = useState<ComparisonOperation>('=');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOperation(event.target.value as ComparisonOperation);
  };

  return (
    <select
      id="comparison-select"
      value={selectedOperation}
      onChange={handleChange}
    >
      <option value="=">=</option>
      <option value="<">&lt;</option>
      <option value=">">&gt;</option>
      <option value="<=">&lt;=</option>
      <option value=">=">&gt;=</option>
      <option value="≠">≠</option>
    </select>
  );
}

const AUTOCOMPLETE_OPTIONS: {[key: string]: string;} = {
  // Portfolio Data
  "equity()": "equity()",
  "buyingPower()": "buyingPower()",
  "positionOpen()": "positionOpen(default)",
  // Standard
  "priceOf()": "priceOf(default, 0)",
  "analystRatingsOf()": "analystRatingsOf(default)", 
  "daysUntilEarningsOf()": "daysUntilEarningsOf(default)", 
  "52WeekLowOf()": "52WeekLowOf(default, 0)", 
  "52WeekHighOf()": "52WeekHighOf(default, 0)", 
  // Momentum Indicators
  "rsiOf()": "rsiOf(default, 0)", 
  // Trend Indicators
  // Volitility Indicators
  // Volume Indicators
  "volumeOf()": "volumeOf(default, 0)", 
};

function VariableInput() {
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const cursorPosRef = useRef<number>(0);

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
    const text = (e.currentTarget.innerText || '').replace(/\u00A0/g, ' '); // Replace nbsp with normal spaces
    updateCursorPosition();
    const currentWord = getCurrentWord(text);
    
    setInputText(text);
    updateSuggestions(currentWord);
  }, [getCurrentWord, updateCursorPosition]);

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
    const text = inputText;
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
    
    setInputText(newText);
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
  }, [inputText]);

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

function StockList({ includeDefault }: {includeDefault: boolean}) {
  let init = includeDefault ? ["DEFAULT"] : []
  const [stocks, setStocks] = useState<String[]>(init)

  function addStock(): void {
    const ticker = prompt("Ticker: ")?.toUpperCase();
    if (ticker && !stocks.includes(ticker)) {
      setStocks([...stocks, ticker]);
    }
  }

  function removeStock(stock: String) {
    setStocks((prevStocks) => prevStocks.filter((s) => s !== stock));
  }

  return (
    <>
      {stocks.map((stock)=> {return (
        <div
          className={styles.variableInput}
          contentEditable={false}
          onClick={() => removeStock(stock)}
          style={{cursor: "default"}}
        >
          {stock}
        </div>
      )})}
      <button className='nodrag' onClick={addStock}>＋</button>
    </>
  );
}

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

function IfNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>If </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput />
        <Comparison />
        <VariableInput />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

function EventNode() {

  return (
    <>
      <div className={styles.horizontalAlign}>
        <p className={styles.nodeTitle}>Event for </p>
        <StockList includeDefault={false}/>
      </div>
      <hr />
      <div className={styles.horizontalAlign}>
        <p className={styles.nodeText}>Trigger when</p>
        <VariableInput />
        <Comparison />
        <VariableInput />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}

function BuyNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>Buy </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput />
        <p className={styles.nodeText}>share(s) of</p>
        <StockList includeDefault={true} />
      </div>
    </>
  )
}

function SellNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <p className={styles.nodeTitle}>Sell </p>
      <hr />
      <div className={styles.horizontalAlign}>
        <VariableInput />
        <p>share(s) of</p>
        <StockList includeDefault={true} />
      </div>
    </>
  )
}

export { LabelNode, EventNode, IfNode, BuyNode, SellNode }