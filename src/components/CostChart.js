import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Colors,
} from 'chart.js';
import idb from '../lib/idb';

// Custom exception for chart data fetching errors
function ChartDataError(message) {
  this.message = message;
  this.name = 'ChartDataError';
}

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Colors);

// Chart colors configuration
const CHART_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
];

/**
 * Component for displaying cost distribution chart
 */
function CostChart({ updateTrigger, dateRange, onDateRangeChange }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: CHART_COLORS,
      },
    ],
  });

  const fetchChartData = async () => {
    try {
      const categoryTotals = await idb.getCostsByCategory(
        dateRange.startDate,
        dateRange.endDate
      );

      const labels = Object.keys(categoryTotals);
      const data = Object.values(categoryTotals);

      setChartData({
        labels,
        datasets: [
          {
            data,
            backgroundColor: CHART_COLORS,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData({
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
      });
    }
  };

  useEffect(() => {
    fetchChartData().catch((error) => {
      console.error('Failed to load chart data:', error.message);
    });
  }, [dateRange.startDate, dateRange.endDate, updateTrigger]);

  const handleStartDateChange = (newDate) => {
    onDateRangeChange(prev => ({
      ...prev,
      startDate: newDate,
    }));
  };

  const handleEndDateChange = (newDate) => {
    onDateRangeChange(prev => ({
      ...prev,
      endDate: newDate,
    }));
  };

  const calculatePercentage = (value, total) => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant='h6' gutterBottom fontWeight='bold'>
        Cost Distribution
      </Typography>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label='From'
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            format='dd/MM/yyyy'
            sx={{ width: 200 }}
          />
          <DatePicker
            label='To'
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            format='dd/MM/yyyy'
            sx={{ width: 200 }}
          />
        </LocalizationProvider>
      </Box>
      <Typography sx={{ mb: 2, fontWeight: 'bold' }}>
        Total Sum: ${chartData.labels.length > 0 
          ? chartData.datasets[0].data.reduce((a, b) => a + b, 0).toFixed(2)
          : '0.00'}
      </Typography>
      <Box sx={{ height: 400, display: 'flex', justifyContent: 'center' }}>
        {chartData.labels.length > 0 ? (
          <Pie
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label: (context) => {
                      const value = context.raw;
                      const total = context.dataset.data.reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage = calculatePercentage(value, total);
                      return `$${value.toFixed(2)} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        ) : (
          <Typography 
            variant='h6' 
            sx={{ 
              fontWeight: 'bold',
              alignSelf: 'center'
            }}
          >
            No costs found for this period
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default CostChart;
