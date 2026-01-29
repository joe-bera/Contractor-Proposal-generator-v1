import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { LeadSource } from '@prisma/client';
import prisma from '../db/client.js';
import { leadService } from '../services/leadService.js';

const router = Router();

// Voice AI webhook - call started
router.post(
  '/voice/call-started',
  asyncHandler(async (req, res) => {
    console.log('Voice call started:', req.body);
    res.json({ success: true });
  })
);

// Voice AI webhook - call ended
router.post(
  '/voice/call-ended',
  asyncHandler(async (req, res) => {
    const voiceCallSchema = z.object({
      call_id: z.string(),
      duration: z.number(),
      transcript: z.string(),
      extracted_data: z.object({
        contact: z.object({
          firstName: z.string(),
          lastName: z.string(),
          phone: z.string(),
          email: z.string().optional(),
          address: z.string().optional(),
        }),
        project: z.object({
          type: z.string().optional(),
          description: z.string().optional(),
          urgency: z.enum(['emergency', 'urgent', 'standard']).default('standard'),
        }),
        qualification: z.object({
          propertyOwner: z.boolean().default(true),
          readinessToBuy: z.enum(['high', 'medium', 'low']).default('medium'),
        }),
        appointment: z.object({
          scheduled: z.boolean(),
          dateTime: z.string().optional(),
        }).optional(),
      }),
      company_id: z.string(),
    });

    try {
      const data = voiceCallSchema.parse(req.body);

      // Create lead from voice call data
      const lead = await leadService.create({
        firstName: data.extracted_data.contact.firstName,
        lastName: data.extracted_data.contact.lastName,
        phone: data.extracted_data.contact.phone,
        email: data.extracted_data.contact.email,
        address: data.extracted_data.contact.address,
        projectType: data.extracted_data.project.type,
        projectDescription: data.extracted_data.project.description,
        urgency: data.extracted_data.project.urgency,
        source: LeadSource.PHONE,
        companyId: data.company_id,
        voiceCallId: data.call_id,
        voiceTranscript: data.transcript,
        voiceCallDuration: data.duration,
        voiceQualificationData: {
          ...data.extracted_data.qualification,
          appointment: data.extracted_data.appointment,
        },
      });

      // If appointment was scheduled, update the lead
      if (data.extracted_data.appointment?.scheduled && data.extracted_data.appointment.dateTime) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: 'APPOINTMENT_SCHEDULED',
            appointmentDate: new Date(data.extracted_data.appointment.dateTime),
          },
        });
      }

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      console.error('Voice webhook error:', error);
      res.status(400).json({ success: false, error: 'Invalid webhook data' });
    }
  })
);

// Voice AI webhook - transcription (real-time)
router.post(
  '/voice/transcription',
  asyncHandler(async (req, res) => {
    // For real-time transcription updates
    console.log('Transcription update:', req.body);
    res.json({ success: true });
  })
);

// GoHighLevel webhook - contact created/updated
router.post(
  '/ghl/contact',
  asyncHandler(async (req, res) => {
    const ghlContactSchema = z.object({
      type: z.enum(['ContactCreate', 'ContactUpdate']),
      contactId: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      locationId: z.string(),
    });

    try {
      const data = ghlContactSchema.parse(req.body);

      // Find company by GHL location ID
      const company = await prisma.company.findFirst({
        where: { goHighLevelLocationId: data.locationId },
      });

      if (!company) {
        console.log('No company found for GHL location:', data.locationId);
        res.json({ success: true, message: 'Location not configured' });
        return;
      }

      // Check if lead already exists with this GHL contact ID
      const existingLead = await prisma.lead.findFirst({
        where: { ghlContactId: data.contactId },
      });

      if (existingLead) {
        // Update existing lead
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            firstName: data.firstName || existingLead.firstName,
            lastName: data.lastName || existingLead.lastName,
            email: data.email || existingLead.email,
            phone: data.phone || existingLead.phone,
          },
        });
      } else if (data.type === 'ContactCreate' && data.firstName && data.lastName && data.phone) {
        // Create new lead
        await leadService.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          source: LeadSource.OTHER,
          companyId: company.id,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('GHL contact webhook error:', error);
      res.status(400).json({ success: false, error: 'Invalid webhook data' });
    }
  })
);

// GoHighLevel webhook - opportunity stage changed
router.post(
  '/ghl/opportunity',
  asyncHandler(async (req, res) => {
    console.log('GHL opportunity webhook:', req.body);
    // TODO: Sync opportunity stage changes back to our project status
    res.json({ success: true });
  })
);

// Stripe webhook
router.post(
  '/stripe',
  asyncHandler(async (req, res) => {
    // TODO: Implement Stripe webhook handling
    // Verify webhook signature
    // Handle payment_intent.succeeded, payment_intent.failed, etc.
    res.json({ success: true });
  })
);

export default router;
