import React, { useState, useCallback } from 'react';
import styles from '../styles/BacktestModal.module.css';
import { ChartService } from '../services/ChartService';
import { BacktestChart } from './Charts';

interface BacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BacktestModal: React.FC<BacktestModalProps> = ({ isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartData, setChartData] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:8000/getHistory/NVDA/${timeframe}/${startDate}/${endDate}`);
      const data = await response.json();
      console.log('Backtest data:', data.data);
      
      const d = data.data
      // {
      //   "2025/1/1": {"close": 5, "open": 4, "high": 6, "low": 3, "volume": 27},
      //   "2025/1/12": {"close": 7, "open": 5, "high": 8, "low": 5, "volume": 21}
      // };

      setChartData(d);
      ChartService.generateChart(d,"backtest-chart", setChartData);
      
    } catch (error) {
      console.error('Error fetching backtest data:', error);
    }
  };

  return (
    <>
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Backtest Configuration</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="timeframe">Timeframe:</label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="1d">1 Day</option>
              <option value="30m">30 Minutes</option>
              <option value="5m">5 Minutes</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    </div>

    <div style={{ display: Object.keys(chartData).length > 0 ? 'block' : 'none' }}>
      <BacktestChart />
    </div>
    </>
  );
};

export { BacktestModal }; 