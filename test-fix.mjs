require('dotenv').config();
import { detectBusinessColumns } from './src/lib/analytics/column-detector.js';

const dataset = {
  columns: [{ name: 'Order Date' }, { name: 'Revenue' }, { name: 'Profit' }, { name: 'Customer ID' }, { name: 'Product Name' }, { name: 'Region' }, { name: 'Order ID' }],
  preview: [{ 'Order Date': '2024-01-01', Revenue: 100, Profit: 20, 'Customer ID': 'C001', 'Product Name': 'Widget', Region: 'US', 'Order ID': 'O001' }]
};

detectBusinessColumns(dataset).then(r => console.log('Result:', JSON.stringify(r, null, 2)));