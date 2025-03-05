import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// Type definition for the financial data format
export type FinancialDataPoint = {
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};

export type FinancialDataset = {
  [date: string]: FinancialDataPoint;
};

// OHLC data structure for candlestick
interface OHLCPoint {
  x: string;
  o: number;
  h: number;
  l: number;
  c: number;
}

// Extended dataset interface for candlestick data
interface CandlestickDataset {
  candlestickData?: OHLCPoint[];
}

// Define custom chart options interface to avoid linter errors with zoom plugin
interface ExtendedChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      callbacks: {
        label: (context: any) => string[];
      };
    };
    // Custom zoom plugin options
    zoom?: {
      pan: {
        enabled: boolean;
        mode: 'x' | 'y' | 'xy';
        modifierKey?: 'shift' | 'alt' | 'ctrl' | 'meta';
      };
      zoom: {
        wheel: {
          enabled: boolean;
        };
        pinch: {
          enabled: boolean;
        };
        mode: 'x' | 'y' | 'xy';
      };
    };
  };
  scales: {
    x: {
      display: boolean;
      grid: {
        display: boolean;
      };
      min?: number;
      max?: number;
      ticks?: {
        maxTicksLimit?: number;
        autoSkip: boolean;
      };
    };
    y: {
      display: boolean;
      beginAtZero: boolean;
      min: number;
      max: number;
      grid: {
        color: string;
      };
    };
  };
  onClick: (event: any) => void;
}

export class ChartService {
  private static chartInstance: Chart | null = null;
  private static clickOutsideHandler: ((event: MouseEvent) => void) | null = null;

  /**
   * Generates and renders a financial chart with the provided data
   * @param data Financial data in the specified format
   * @param container HTML element ID where the chart should be rendered
   * @param type Chart type ('line', 'candlestick', 'ohlc', etc.)
   * @returns The chart instance
   */
  public static generateChart(
    data: FinancialDataset,
    container: string,
    setChartData: React.Dispatch<React.SetStateAction<FinancialDataset>>,
    type: 'line' | 'bar' | 'candlestick' = 'candlestick'
  ): Chart | null {
    // Clean up any existing chart
    this.destroyChart();

    const containerElement = document.getElementById(container);
    if (!containerElement) {
      console.error(`Container element with ID '${container}' not found`);
      return null;
    }
    containerElement.innerHTML = '';
    // Create canvas element
    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    // Prepare datasets
    const dates = Object.keys(data).sort();
    const ohlcData: OHLCPoint[] = dates.map(date => ({
      x: date,
      o: data[date].open,
      h: data[date].high,
      l: data[date].low,
      c: data[date].close,
    }));

    // Find min and max values for proper Y axis scaling
    const allValues = ohlcData.flatMap(point => [point.o, point.h, point.l, point.c]);
    const minValue = Math.min(...allValues) * 0.95; // Add 5% padding
    const maxValue = Math.max(...allValues) * 1.05; // Add 5% padding

    // Configuration for scrolling behavior
    const scrollThreshold = 50; // Start scrolling when more than this many candles
    const isScrollable = dates.length > scrollThreshold;
    
    // Fixed candle width for when scrolling is enabled
    const fixedCandleWidth = 20; // in pixels
    const minPercentage = 0.05; // Show at least 5% of all candles when scrolling
    const visibleCandles = isScrollable ? 
      Math.max(Math.floor(scrollThreshold * 0.8), Math.floor(dates.length * minPercentage)) : 
      dates.length;

    // Create chart options
    const chartOptions: ExtendedChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide legend for candlestick
        },
        title: {
          display: true,
          text: 'Candlestick Chart',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const dataIndex = context.dataIndex;
              const data = ohlcData[dataIndex];
              return [
                `Open: ${data.o}`,
                `High: ${data.h}`,
                `Low: ${data.l}`,
                `Close: ${data.c}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          // Enable scrolling when we have more than threshold candles
          min: isScrollable ? dates.length - visibleCandles : undefined,
          max: isScrollable ? dates.length - 1 : undefined,
          ticks: {
            // Limit the number of visible ticks
            maxTicksLimit: isScrollable ? 10 : undefined,
            autoSkip: true
          }
        },
        y: {
          display: true,
          beginAtZero: false,
          min: minValue, // Set min value for proper scaling
          max: maxValue, // Set max value for proper scaling
          grid: {
            color: 'rgba(200, 200, 200, 0.1)'
          }
        }
      },
      onClick: (event) => {
        // Prevent destroying chart when clicking on it
        event.native?.stopPropagation();
      }
    };
    
    // Add zoom plugin options if scrollable
    if (isScrollable) {
      chartOptions.plugins.zoom = {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'shift'
        },
        zoom: {
          wheel: {
            enabled: true
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        }
      };
    }

    // Create a candlestick chart using a custom renderer
    this.chartInstance = new Chart(canvas, {
      type: 'bar' as const, // We'll use a bar chart as the base and customize it
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Candlestick',
            // Use a placeholder dataset that won't be visible
            // The actual candlesticks will be drawn by our plugin
            data: dates.map(() => 0),
            backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent
            borderColor: 'rgba(0, 0, 0, 0)', // Transparent
            borderWidth: 0,
            // Add candlestick data as a custom property
            // @ts-ignore - Adding custom property
            candlestickData: ohlcData
          } as any // Use any to bypass type-checking for custom properties
        ]
      },
      options: chartOptions as any,
      plugins: [{
        id: 'candlestickDrawer',
        beforeDraw: (chart) => {
          // Clear the canvas to prevent any background coloring
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = 'transparent';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        },
        afterDraw: (chart) => {
          const { ctx, scales } = chart;
          const dataset = chart.data.datasets[0] as any;
          
          if (dataset.candlestickData) {
            ctx.save();
            ctx.lineWidth = 1.5;
            
            // Calculate the optimal width for candlesticks
            const totalPoints = dataset.candlestickData.length;
            const chartWidth = chart.chartArea.width;
            
            let optimalWidth;
            
            if (isScrollable) {
              // Fixed width when scrolling
              optimalWidth = fixedCandleWidth;
            } else {
              // Dynamic width based on visible candles when not scrolling
              // Each candle takes up to 80% of its available space (with 20% as margins)
              const percentPerCandle = 0.8;
              optimalWidth = Math.max(
                Math.min(
                  (chartWidth / totalPoints) * percentPerCandle, 
                  chartWidth / 10 // Cap at 1/10th of chart width for very few candles
                ),
                2 // Minimum width of 2px
              );
            }
            
            dataset.candlestickData.forEach((dataPoint: OHLCPoint, i: number) => {
              const x = scales.x.getPixelForValue(i);
              
              // Skip rendering candles that are outside the visible area
              if (x < chart.chartArea.left - optimalWidth || x > chart.chartArea.right + optimalWidth) {
                return;
              }
              
              const high = scales.y.getPixelForValue(dataPoint.h);
              const low = scales.y.getPixelForValue(dataPoint.l);
              const open = scales.y.getPixelForValue(dataPoint.o);
              const close = scales.y.getPixelForValue(dataPoint.c);

              const isGreen = dataPoint.c >= dataPoint.o;
              const candleColor = isGreen ? 
                { fill: 'rgba(75, 192, 92, 0.5)', stroke: 'rgb(75, 192, 92)' } :
                { fill: 'rgba(255, 99, 132, 0.5)', stroke: 'rgb(255, 99, 132)' };
              
              // Draw the full wick (high to low)
              ctx.beginPath();
              ctx.strokeStyle = candleColor.stroke;
              ctx.moveTo(x, high);
              ctx.lineTo(x, low);
              ctx.stroke();
              
              // Draw the candle body (open to close)
              const bodyTop = isGreen ? close : open;
              const bodyBottom = isGreen ? open : close;
              const bodyHeight = Math.max(Math.abs(close - open), 1); // Minimum 1px height
              
              // Fill the body
              ctx.fillStyle = candleColor.fill;
              ctx.fillRect(
                x - optimalWidth / 2,
                bodyTop,
                optimalWidth,
                bodyHeight
              );
              
              // Draw border around the body for better clarity
              ctx.strokeStyle = candleColor.stroke;
              ctx.lineWidth = 1;
              ctx.strokeRect(
                x - optimalWidth / 2,
                bodyTop,
                optimalWidth,
                bodyHeight
              );
            });
            
            ctx.restore();
            
            // Add navigation controls for scrolling if needed
            if (isScrollable) {
              this.drawNavigationControls(chart, containerElement);
            }
          }
        }
      }]
    });

    // Set up click outside listener
    this.setupClickOutsideListener(container, setChartData);

    // Add initial touch/mouse down event listener for scrolling
    if (isScrollable) {
      let isDragging = false;
      let previousX = 0;
      
      const handleDragStart = (clientX: number) => {
        isDragging = true;
        previousX = clientX;
      };
      
      const handleDragMove = (clientX: number) => {
        if (!isDragging || !this.chartInstance) return;
        
        const delta = previousX - clientX;
        previousX = clientX;
        
        // Get current min and max
        const options = this.chartInstance.options;
        if (!options.scales || !options.scales.x) return;
        
        const xScale = options.scales.x;
        const currentMin = xScale.min as number;
        const currentMax = xScale.max as number;
        const range = currentMax - currentMin;
        
        // Calculate movement amount (positive delta = move right, showing newer data)
        // Movement should be proportional to the size of the canvas and the range
        const moveAmount = (delta / this.chartInstance.width!) * range * 2;
        
        // Apply bounds - prevent scrolling past the last data point
        const dataLength = dates.length;
        
        // Only allow scrolling right if we're not already at the end
        let newMin, newMax;
        if (moveAmount > 0) { // Scrolling right (showing newer data)
          // Don't scroll right if the last data point is already visible
          if (currentMax >= dataLength - 1) {
            return; // Already at the end, don't scroll further right
          }
          
          // Calculate new positions
          newMin = Math.min(dataLength - range, currentMin + moveAmount);
          newMax = Math.min(dataLength - 1, newMin + range);
          
          // Ensure max is exactly at the end if we're close
          if (newMax > dataLength - 1.5) {
            newMax = dataLength - 1;
            newMin = Math.max(0, newMax - range);
          }
        } else { // Scrolling left (showing older data)
          newMin = Math.max(0, currentMin + moveAmount);
          newMax = Math.min(dataLength - 1, newMin + range);
        }
        
        // Update the scale
        xScale.min = newMin;
        xScale.max = newMax;
        
        this.chartInstance.update();
      };
      
      const handleDragEnd = () => {
        isDragging = false;
      };
      
      canvas.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
      canvas.addEventListener('touchstart', (e) => handleDragStart(e.touches[0].clientX));
      
      window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
      window.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientX));
      
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return this.chartInstance;
  }

  /**
   * Creates a volume chart as a secondary chart
   * @param data Financial data
   * @param container HTML element ID for the volume chart
   * @returns The volume chart instance
   */
  public static generateVolumeChart(data: FinancialDataset, container: string = 'volume-chart-container'): Chart | null {
    const containerElement = document.getElementById(container);
    if (!containerElement) {
      console.error(`Container element with ID '${container}' not found`);
      return null;
    }

    // Create canvas element
    const canvas = document.createElement('canvas');
    containerElement.appendChild(canvas);

    // Prepare volume data
    const dates = Object.keys(data).sort();
    const volumes = dates.map(date => data[date].volume);

    // Create volume chart
    const volumeChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Volume',
            data: volumes,
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: false,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'Trading Volume'
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(200, 200, 200, 0.1)'
            }
          }
        },
        onClick: (event) => {
          // Prevent destroying chart when clicking on it
          event.native?.stopPropagation();
        }
      }
    });

    return volumeChart;
  }

  /**
   * Destroys the current chart instance and removes event listeners
   */
  public static destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    this.removeClickOutsideListener();
  }

  /**
   * Sets up an event listener to detect clicks outside the chart
   */
  private static setupClickOutsideListener(containerId: string, setChartData: React.Dispatch<React.SetStateAction<FinancialDataset>>): void {
    // Remove any existing handler first
    this.removeClickOutsideListener();

    // Create a new handler
    this.clickOutsideHandler = (event: MouseEvent) => {
      const containerElement = document.getElementById(containerId);
      if (containerElement && !containerElement.contains(event.target as Node)) {
        this.destroyChart();
        setChartData({});
      }
    };

    // Add the event listener
    document.addEventListener('mousedown', this.clickOutsideHandler);
  }

  /**
   * Removes the click outside event listener
   */
  private static removeClickOutsideListener(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }

  /**
   * Draws navigation controls (left/right arrows) for scrolling the chart
   */
  private static drawNavigationControls(chart: Chart, containerElement: HTMLElement): void {
    // Create navigation container if it doesn't exist
    let navContainer = containerElement.querySelector('.chart-navigation') as HTMLElement | null;
    if (!navContainer) {
      navContainer = document.createElement('div');
      navContainer.className = 'chart-navigation';
      Object.assign(navContainer.style, {
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '20px',
        zIndex: '100'
      });
      containerElement.appendChild(navContainer);
      
      // Left button
      const leftBtn = document.createElement('button');
      leftBtn.innerHTML = '←';
      Object.assign(leftBtn.style, {
        backgroundColor: 'rgba(25, 25, 25, 0.7)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer'
      });
      leftBtn.onclick = (e) => {
        e.stopPropagation();
        this.scrollChart('left');
      };
      
      // Right button
      const rightBtn = document.createElement('button');
      rightBtn.innerHTML = '→';
      Object.assign(rightBtn.style, {
        backgroundColor: 'rgba(25, 25, 25, 0.7)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '4px',
        padding: '5px 10px',
        cursor: 'pointer'
      });
      rightBtn.onclick = (e) => {
        e.stopPropagation();
        this.scrollChart('right');
      };
      
      navContainer.appendChild(leftBtn);
      navContainer.appendChild(rightBtn);
    }
  }
  
  /**
   * Scrolls the chart left or right
   */
  private static scrollChart(direction: 'left' | 'right'): void {
    if (!this.chartInstance || !this.chartInstance.options.scales?.x) return;
    
    const xScale = this.chartInstance.options.scales.x;
    const currentMin = xScale.min as number;
    const currentMax = xScale.max as number;
    const range = currentMax - currentMin;
    
    // Scroll by 25% of the visible range
    const scrollAmount = range * 0.25 * (direction === 'left' ? -1 : 1);
    
    // Calculate new bounds with limits
    const dataLength = this.chartInstance.data.labels?.length || 0;
    
    // When scrolling right, prevent going beyond the last data point
    if (direction === 'right') {
      // If we're already at or near the end, don't scroll further right
      if (currentMax >= dataLength - 1) {
        return; // Already at the end, don't scroll further
      }
      
      let newMin = Math.min(dataLength - range, currentMin + scrollAmount);
      let newMax = Math.min(dataLength - 1, newMin + range);
      
      // Ensure max is exactly at the end if we're close
      if (newMax > dataLength - 1.5) {
        newMax = dataLength - 1;
        newMin = Math.max(0, newMax - range);
      }
      
      // Update the scale
      xScale.min = newMin;
      xScale.max = newMax;
    } else {
      // Scrolling left, regular behavior
      const newMin = Math.max(0, currentMin + scrollAmount);
      const newMax = Math.min(dataLength - 1, newMin + range);
      
      // Update the scale
      xScale.min = newMin;
      xScale.max = newMax;
    }
    
    this.chartInstance.update();
  }
}

/**
 * React hook to use the chart service in functional components
 */
export function useChart() {
  const chartRef = useRef<Chart | null>(null);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      ChartService.destroyChart();
    };
  }, []);

  /**
   * Renders a financial chart in the specified container
   */
  const renderChart = (
    data: FinancialDataset,
    container: string = 'chart-container',
    setChartData: React.Dispatch<React.SetStateAction<FinancialDataset>>,
    type: 'line' | 'bar' | 'candlestick' = 'candlestick'
  ) => {
    chartRef.current = ChartService.generateChart(data, container, setChartData, type);
    return chartRef.current;
  };

  return { renderChart, destroyChart: ChartService.destroyChart };
}
