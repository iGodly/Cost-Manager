import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import idb from '../lib/idb';

// Custom exception for form validation
function CostValidationError(message) {
  this.message = message;
  this.name = 'CostValidationError';
}

// Predefined categories for costs
const CATEGORIES = [
  'Food',
  'Transportation',
  'Housing',
  'Healthcare',
  'Entertainment',
  'Other',
];

/**
 * Component for adding new cost items
 */
function AddCost({ onCostAdded }) {
  const [formData, setFormData] = useState({
    sum: '',
    category: '',
    description: '',
    date: new Date(),
  });
  const [alert, setAlert] = useState({
    show: false,
    severity: 'success',
    message: '',
  });

  const validateForm = () => {
    const sum = parseFloat(formData.sum);
    if (isNaN(sum) || sum <= 0) {
      throw new CostValidationError(
        'Please enter a valid positive number for sum'
      );
    }
    if (!formData.category) {
      throw new CostValidationError('Please select a category');
    }
    return sum;
  };

  /**
   * Handles form input changes
   * @param {Object} event - Input change event
   */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handles date input changes with validation
   * @param {Object} event - Input change event
   */
  const handleDateChange = (newDate) => {
    setFormData((prev) => ({
      ...prev,
      date: newDate,
    }));
  };

  /**
   * Handles form submission
   * @param {Object} event - Form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const sum = validateForm();
      const date = new Date(formData.date);
      date.setHours(12, 0, 0, 0);
      const cost = {
        ...formData,
        sum,
        date: date,
      };

      await idb.addCost(cost);
      onCostAdded();

      setAlert({
        show: true,
        severity: 'success',
        message: 'Cost added successfully!',
      });

      setFormData({
        sum: '',
        category: '',
        description: '',
        date: new Date(),
      });
    } catch (error) {
      setAlert({
        show: true,
        severity: 'error',
        message: error.message,
      });
    }

    setTimeout(() => {
      setAlert({ show: false, severity: 'success', message: '' });
    }, 3000);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant='h6' gutterBottom fontWeight='bold'>
        Add New Cost
      </Typography>
      <Box component='form' onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          required
          fullWidth
          label='Sum'
          name='sum'
          type='number'
          value={formData.sum}
          onChange={handleChange}
          sx={{ mb: 2 }}
          inputProps={{ min: '0', step: '0.01' }}
        />
        <TextField
          required
          fullWidth
          select
          label='Category'
          name='category'
          value={formData.category}
          onChange={handleChange}
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
          name='description'
          value={formData.description}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label='Date'
            value={formData.date}
            onChange={handleDateChange}
            format='dd/MM/yyyy'
            sx={{ width: '100%', mb: 2 }}
            slotProps={{
              textField: {
                required: true,
              },
            }}
          />
        </LocalizationProvider>
        <Button type='submit' variant='contained' color='primary' fullWidth>
          Add Cost
        </Button>
      </Box>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mt: 2 }}>
          {alert.message}
        </Alert>
      )}
    </Paper>
  );
}

export default AddCost;
