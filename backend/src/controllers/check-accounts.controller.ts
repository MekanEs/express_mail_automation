import { Request, Response } from 'express';
import { supabaseClient } from '../clients/supabaseClient';
import { checkAccounts as checkAccountsService, CheckAccountsParams } from '../services/check_accounts/checkAccounts.service';

class CheckAccountsController {
  public async checkAccounts(_req: Request, response: Response) {
    console.log('accounts to check', _req.body.accounts)
    const { data: accounts } = await supabaseClient.from('user_accounts').select();
    const connected: string[] = [];
    if (!accounts) {
      return;
    }

    const params: CheckAccountsParams = {
      accounts: _req.body.accounts,
      connected
    };

    await checkAccountsService(params);
    response.status(200).send(connected);
  }
}

export const checkAccountsController = new CheckAccountsController();
