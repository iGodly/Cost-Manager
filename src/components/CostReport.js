import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import idb from '../lib/idb';

// Predefined categories for costs
const CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Healthcare',
  'Entertainment',
  'Other',
];

// Custom exception for data fetching errors
function CostFetchError(message) {
  this.message = message;
  this.name = 'CostFetchError';
}

/**
 * Component for displaying cost reports
 */
function CostReport({ updateTrigger, dateRange, onDateRangeChange, onCostUpdated }) {
  const [costs, setCosts] = useState([]);
  const [editingCost, setEditingCost] = useState(null);
  const [editFormData, setEditFormData] = useState({
    sum: '',
    category: '',
    description: '',
    date: new Date(),
  });

  const fetchCosts = async () => {
    try {
      const monthCosts = await idb.getCostsByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );
      setCosts(monthCosts);
    } catch (error) {
      console.error('Error fetching costs:', error);
      throw new CostFetchError('Failed to fetch cost data');
    }
  };

  useEffect(() => {
    fetchCosts().catch((error) => {
      console.error('Failed to load costs:', error.message);
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

  const handleEditClick = (cost) => {
    setEditingCost(cost);
    setEditFormData({
      sum: cost.sum.toString(),
      category: cost.category,
      description: cost.description,
      date: new Date(cost.date),
    });
  };

  const handleEditClose = () => {
    setEditingCost(null);
    setEditFormData({
      sum: '',
      category: '',
      description: '',
      date: new Date(),
    });
  };

  const handleEditSave = async () => {
    try {
      const sum = parseFloat(editFormData.sum);
      if (isNaN(sum) || sum <= 0) {
        throw new CostFetchError('Please enter a valid positive number');
      }

      const updatedCost = {
        ...editingCost,
        ...editFormData,
        sum,
      };

      await idb.updateCost(updatedCost);
      handleEditClose();
      fetchCosts();
      onCostUpdated();
    } catch (error) {
      console.error('Failed to update cost:', error);
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this cost?')) {
      try {
        await idb.deleteCost(id);
        fetchCosts();
        onCostUpdated();
      } catch (error) {
        console.error('Failed to delete cost:', error);
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant='h6' gutterBottom fontWeight='bold'>
        Cost Report
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
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
              <TableCell align='right' sx={{ fontWeight: 'bold' }}>Sum</TableCell>
              <TableCell align='right'></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>
                  {new Date(cost.date).toLocaleDateString('en-GB')}
                </TableCell>
                <TableCell>{cost.category}</TableCell>
                <TableCell>{cost.description}</TableCell>
                <TableCell align='right'>${cost.sum.toFixed(2)}</TableCell>
                <TableCell align='right'>
                  <Button
                    onClick={() => handleEditClick(cost)}
                    sx={{ color: 'primary.main', mr: 1 }}
                    variant='outlined'
                  >
                    <Box sx={{ fontWeight: 'bold' }}>Edit</Box>
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(cost.id)}
                    sx={{ color: 'error.main' }}
                    variant='outlined'
                  >
                    <Box sx={{ fontWeight: 'bold' }}>Delete</Box>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {costs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    No costs found for this period
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editingCost} onClose={handleEditClose}>
        <DialogTitle>Edit Cost</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label='Sum'
              type='number'
              value={editFormData.sum}
              onChange={(e) => setEditFormData(prev => ({ ...prev, sum: e.target.value }))}
              sx={{ mb: 2 }}
              inputProps={{ min: '0', step: '0.01' }}
            />
            <TextField
              fullWidth
              select
              label='Category'
              value={editFormData.category}
              onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
              sx={{ mb: 2 }}
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label='Description'
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label='Date'
                value={editFormData.date}
                onChange={(newDate) => setEditFormData(prev => ({ ...prev, date: newDate }))}
                format='dd/MM/yyyy'
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant='contained'>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default CostReport;
