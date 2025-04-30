import { Router, Request, Response, NextFunction } from 'express';
// FIXME: Correct the import path and name based on your Supabase client setup
import { supabaseClient } from '../clients/supabaseClient';
import { Database } from '../clients/database.types';

// Define the specific type for convenience
type SenderAggregateRow = Database['public']['Tables']['sender_aggregates']['Row'];

const router = Router();

// Controller function to get sender aggregates
const getSenderAggregates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data, error } = await supabaseClient
            .from('sender_aggregates')
            .select('*');

        if (error) {
            console.error('Error fetching sender aggregates:', error);
            // Pass the error to an error handling middleware if you have one
            // or send a response directly
            return res.status(500).json({ message: 'Failed to fetch sender aggregates', error: error.message });
        }

        res.status(200).json({ data: data as SenderAggregateRow[] });

    } catch (err) {
        console.error('Unexpected error in getSenderAggregates:', err);
        // Pass to error handling middleware or send response
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        res.status(500).json({ message: 'An unexpected error occurred', error: errorMessage });
        // If using error middleware, you might call next(err) instead
    }
};

// Define the GET route - using the async handler correctly
router.get('/', (req, res, next) => {
    getSenderAggregates(req, res, next).catch(next); // Ensure async errors are caught and passed to Express error handlers
});

export default router;
