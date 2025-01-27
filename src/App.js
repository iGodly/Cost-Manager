import React, { useState, useEffect } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
} from '@mui/material';
import './App.css';
import AddCost from './components/AddCost';
import CostReport from './components/CostReport';
import CostChart from './components/CostChart';
import idb from './lib/idb';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [initialized, setInitialized] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [chartDateRange, setChartDateRange] = useState({
    startDate: reportDateRange.startDate,
    endDate: reportDateRange.endDate,
  });

  useEffect(() => {
    const initDB = async () => {
      try {
        await idb.init();
        setInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error.message);
      }
    };

    initDB();
  }, []);

  // Update chart dates when report dates change
  useEffect(() => {
    setChartDateRange({
      startDate: reportDateRange.startDate,
      endDate: reportDateRange.endDate,
    });
  }, [reportDateRange]);

  const handleCostAdded = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  // Add this function to handle updates from CostReport
  const handleCostUpdated = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  if (!initialized) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth='lg'>
        <Box sx={{ my: 4 }}>
          <h1>Cost Manager</h1>
          <AddCost onCostAdded={handleCostAdded} />
          <Box sx={{ my: 4 }}>
            <CostReport 
              updateTrigger={updateTrigger}
              dateRange={reportDateRange}
              onDateRangeChange={setReportDateRange}
              onCostUpdated={handleCostUpdated}
            />
          </Box>
          <Box sx={{ my: 4 }}>
            <CostChart 
              updateTrigger={updateTrigger}
              dateRange={chartDateRange}
              onDateRangeChange={setChartDateRange}
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
