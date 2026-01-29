import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import leadsRouter from './routes/leads.js';
import projectsRouter from './routes/projects.js';
import estimatesRouter from './routes/estimates.js';
import proposalsRouter from './routes/proposals.js';
import changeOrdersRouter from './routes/changeOrders.js';
import jobCostingRouter from './routes/jobCosting.js';
import webhooksRouter from './routes/webhooks.js';
import companyRouter from './routes/company.js';
import analyticsRouter from './routes/analytics.js';
import exportRouter from './routes/export.js';
import complianceRouter from './routes/compliance.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/leads', leadsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', estimatesRouter); // Nested under projects
app.use('/api/projects', proposalsRouter); // Nested under projects
app.use('/api/projects', changeOrdersRouter); // Nested under projects
app.use('/api/projects', jobCostingRouter); // Nested under projects
app.use('/api/webhooks', webhooksRouter);
app.use('/api/company', companyRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/export', exportRouter);
app.use('/api/compliance', complianceRouter);

// Public proposal routes (no auth required)
app.use('/api/proposals', proposalsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
