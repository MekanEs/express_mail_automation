import { Request, Response } from 'express';
import { supabaseClient } from '../../clients/supabaseClient';

class FromEmailsController {
  public async getEmails(_req: Request, response: Response) {
    const from = await supabaseClient.from('from_emails').select();
    response.status(200).send(from);
    console.log(from);
    return;
  }
  public async postEmails(req: Request, response: Response) {
    const { error } = await supabaseClient.from('from_emails').insert({ email: req.body.email });
    if (error !== null) {
      response.status(400);
      return;
    }
    response.status(200);
    return;
  }
  public async deleteEmails(req: Request, response: Response) {
    const { error } = await supabaseClient.from('from_emails').delete().eq('id', req.body.id);
    if (error !== null) {
      response.status(400);
      return;
    }
    response.status(200);
    return;
  }
}
export const fromEmailsController = new FromEmailsController();
