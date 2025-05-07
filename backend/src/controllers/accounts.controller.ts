import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';

class AccountsController {
  public async getAccounts(_req: Request, response: Response) {
    const { data: accounts } = await supabaseClient.from('user_accounts').select();
    response.status(200).send(accounts);
    return;
  }
}
export const accountsController = new AccountsController();
