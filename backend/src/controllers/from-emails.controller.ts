import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';

class FromEmailsController {
    public async getEmails(_req: Request, response: Response) {
        const from = await supabaseClient.from('from_emails').select();
        response.status(200).send(from);
        return;
    }
    public async postEmails(req: Request, response: Response) {
        await supabaseClient.from('from_emails').insert({ email: req.body.email });
        response.sendStatus(200);
    }
    public async deleteEmails(req: Request, response: Response) {
        await supabaseClient.from('from_emails').delete().eq('id', req.body.id);
        response.sendStatus(200);
    }
}
export const fromEmailsController = new FromEmailsController();
