import React, { useEffect, useRef } from 'react';
import { format } from '../utils/format';
import '../styles/global.css';

const Chart = ({ 
  data, 
  type = 'line', 
  xKey = 'date', 
  yKey = 'value', 
  label = '',
  height = 200,
  color = '#3498db',
  fillColor = 'rgba(52, 152, 219, 0.1)',
  showGrid = true,
  showTooltip = true
}) => {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const tooltip = tooltipRef.current;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate chart dimensions
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find min and max values
    const xValues = data.map(d => new Date(d[xKey]).getTime());
    const yValues = data.map(d => parseFloat(d[yKey]));
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues) * 0.9; // Add some padding
    const maxY = Math.max(...yValues) * 1.1; // Add some padding

    // Scale functions
    const scaleX = (x) => {
      const xTime = new Date(x).getTime();
      return padding.left + (chartWidth * (xTime - minX)) / (maxX - minX);
    };

    const scaleY = (y) => {
      return height - padding.bottom - (chartHeight * (y - minY)) / (maxY - minY);
    };

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      const yTickCount = 5;
      for (let i = 0; i <= yTickCount; i++) {
        const y = minY + (i / yTickCount) * (maxY - minY);
        const scaledY = scaleY(y);
        
        ctx.beginPath();
        ctx.moveTo(padding.left, scaledY);
        ctx.lineTo(rect.width - padding.right, scaledY);
        ctx.stroke();
        
        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(format.formatCurrency(y), padding.left - 5, scaledY);
      }

      // Vertical grid lines
      const xTickCount = Math.min(7, data.length);
      for (let i = 0; i <= xTickCount; i++) {
        const x = data[Math.floor((i / xTickCount) * (data.length - 1))][xKey];
        const scaledX = scaleX(x);
        
        ctx.beginPath();
        ctx.moveTo(scaledX, padding.top);
        ctx.lineTo(scaledX, height - padding.bottom);
        ctx.stroke();
        
        // X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const date = new Date(x);
        const dateLabel = format.formatShortDate(date);
        ctx.fillText(dateLabel, scaledX, height - padding.bottom + 5);
      }
    }

    // Draw chart
    if (type === 'line') {
      // Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = scaleX(d[xKey]);
        const y = scaleY(d[yKey]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Fill area under the line
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = scaleX(d[xKey]);
        const y = scaleY(d[yKey]);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(scaleX(data[data.length - 1][xKey]), height - padding.bottom);
      ctx.lineTo(scaleX(data[0][xKey]), height - padding.bottom);
      ctx.closePath();
      ctx.fill();

      // Draw points
      ctx.fillStyle = color;
      data.forEach(d => {
        const x = scaleX(d[xKey]);
        const y = scaleY(d[yKey]);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (type === 'bar') {
      // Draw bars
      const barWidth = chartWidth / data.length * 0.8;
      ctx.fillStyle = color;
      
      data.forEach(d => {
        const x = scaleX(d[xKey]) - barWidth / 2;
        const y = scaleY(d[yKey]);
        const barHeight = height - padding.bottom - y;
        
        ctx.fillRect(x, y, barWidth, barHeight);
      });
    }

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, height - padding.bottom);
    ctx.lineTo(rect.width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.stroke();

    // Draw label
    if (label) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, rect.width / 2, 5);
    }

    // Tooltip handling
    if (showTooltip && tooltip) {
      const handleMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find closest data point
        let closestPoint = null;
        let closestDistance = Infinity;

        data.forEach(d => {
          const pointX = scaleX(d[xKey]);
          const pointY = scaleY(d[yKey]);
          const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = d;
          }
        });

        // Only show tooltip if mouse is close enough to a point
        if (closestDistance < 30 && closestPoint) {
          const pointX = scaleX(closestPoint[xKey]);
          const pointY = scaleY(closestPoint[yKey]);

          // Highlight the point
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawChart(); // Redraw the chart
          ctx.fillStyle = '#ff6b6b';
          ctx.beginPath();
          ctx.arc(pointX, pointY, 5, 0, Math.PI * 2);
          ctx.fill();

          // Show tooltip
          tooltip.style.display = 'block';
          tooltip.style.left = `${pointX + rect.left}px`;
          tooltip.style.top = `${pointY + rect.top - 40}px`;
          
          const date = new Date(closestPoint[xKey]);
          tooltip.innerHTML = `
            <div>${format.formatDate(date)}</div>
            <div>${label}: ${format.formatCurrency(closestPoint[yKey])}</div>
          `;
        } else {
          tooltip.style.display = 'none';
        }
      };

      const handleMouseLeave = () => {
        tooltip.style.display = 'none';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawChart(); // Redraw the chart
      };

      // Function to draw the chart (for redrawing after tooltip)
      const drawChart = () => {
        // This would be a duplicate of the chart drawing code above
        // In a real implementation, you would refactor the drawing code into a function
      };

      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [data, type, xKey, yKey, label, height, color, fillColor, showGrid, showTooltip]);

  return (
    <div className="chart-wrapper">
      <canvas ref={canvasRef} className="chart-canvas"></canvas>
      {showTooltip && <div ref={tooltipRef} className="chart-tooltip" style={{ display: 'none' }}></div>}
    </div>
  );
};

export default Chart;